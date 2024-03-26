import { useCallback, useContext } from "react";
import Context from "../Context";
import { store, UserPhoto } from "./usePhotoGallery";
import { useIonToast, isPlatform } from "@ionic/react";
import { supabase } from "../services/supabaseClient";
import { useCloudSync } from "./useCloudSync";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

export function useLoadSaved() {
  const { dispatch, session } = useContext(Context);
  const { downloadPictureFromCloud, savePictureToCloud } = useCloudSync();
  //   const { PHOTO_STORAGE } = usePhotoGallery();

  // Name KV photo storage using user id from supabase
  const PHOTO_STORAGE = `photos-usr-${session?.user?.id ?? "undefined"}`;

  const [showToast] = useIonToast();
  /**
   * Looks for local or cloud versions of photos KVs and Image data
   * @returns
   */
  const loadSaved = useCallback(async () => {
    console.log("Running loadSaved");

    dispatch({ type: "SET_STATE", state: { isLoadingData: true } });
    let value = await store.get(PHOTO_STORAGE);

    // If no local copy of key-value store, look for cloud backup
    if (!value) {
      console.log("Getting KV from cloud");
      const { data, error } = await supabase
        .from("photos")
        .select("photos")
        .eq("user_id", session?.user.id);

      if (error) {
        console.error(error);
        await showToast({
          message: error.message,
          duration: 3000,
        });
      }
      value = data?.length
        ? JSON.stringify(data[0].photos)
        : JSON.stringify([]);
      store.set(PHOTO_STORAGE, value);
    }

    let photosInStore = (value ? JSON.parse(value) : []) as UserPhoto[];

    console.log("Photos in store", photosInStore);

    // console.log("Platforms ", getPlatforms());

    // "hybrid" will detect Capacitor;
    if (!isPlatform("hybrid")) {
      for (let photo of photosInStore) {
        // Recover picture file from local filesystem
        let file;
        try {
          file = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });
        } catch (error) {
          console.log(error);
        }

        // Web platform only: Load the photos as base64 data
        if (file?.data) {
          photo.webviewPath = `data:image/jpeg;base64,${file.data}`;

          // Check if photo hasn't been backedup before
          if (photo.cloudBackup !== true) {
            photo.cloudBackup = await savePictureToCloud(
              file.data,
              photo.filepath
            );
          }
        } else {
          // If can't get file from local filesystem, look for picture in the cloud
          console.log("Getting file from cloud bucket", photo.filepath);
          const imageData = await downloadPictureFromCloud(photo.filepath);
          photo.webviewPath = `data:image/jpeg;base64,${imageData}`;

          // Then save to local filesystem and mark photo as backed up for local key-value store
          Filesystem.writeFile({
            path: photo.filepath,
            data: imageData,
            directory: Directory.Data,
          }).then((response) =>
            response.uri
              ? (photo.cloudBackup = true)
              : (photo.cloudBackup = false)
          );

          // And add photo to photo store
          const filepath = photo.filepath;
          photosInStore = [
            photo,
            ...photosInStore.filter((photo) => photo.filepath !== filepath),
          ];
        }
      }
      // "hybrid" will detect Capacitor;
    } else if (isPlatform("hybrid")) {
      for (let photo of photosInStore) {
        // Check if photo can be loaded from Filesystem
        const decodeImage = async (photo: UserPhoto): Promise<boolean> => {
          return new Promise(async (resolve, reject) => {
            let img = new Image();
            img.src = photo.webviewPath ? photo.webviewPath : "";
            img
              .decode()
              .then(() => {
                resolve(true);
              })
              .catch((error) => {
                resolve(false);
              });
          });
        };

        // If can't get file from local filesystem, look for picture in the cloud
        if ((await decodeImage(photo)) === false) {
          console.log("Getting file from cloud bucket", photo.filepath);
          const imageData = await downloadPictureFromCloud(photo.filepath);

          // Then save to local filesystem and mark photo as backed up for local key-value store
          let savedFile;
          try {
            savedFile = await Filesystem.writeFile({
              path: photo.filepath,
              data: imageData,
              directory: Directory.Data,
            });
            photo.cloudBackup = true;
            photo.webviewPath = Capacitor.convertFileSrc(savedFile.uri);
          } catch (error) {
            console.error(`Could not write file to Filesystem`);
          }
          // And add photo to photo store
          const filepath = photo.filepath;
          photosInStore = [
            photo,
            ...photosInStore.filter((photo) => photo.filepath !== filepath),
          ];
        }
      }
    }

    // Update app state with new photos in store
    store.set(PHOTO_STORAGE, JSON.stringify(photosInStore));
    dispatch({
      type: "SET_STATE",
      state: { photos: photosInStore, isLoadingData: false },
    });

    return;
  }, [
    PHOTO_STORAGE,
    dispatch,
    downloadPictureFromCloud,
    savePictureToCloud,
    session?.user.id,
    showToast,
  ]);

  return { loadSaved };
}
