import { useEffect, useContext } from "react";
import {
  isPlatform,
  getPlatforms,
  useIonLoading,
  useIonToast,
} from "@ionic/react";
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Storage } from "@ionic/storage";
import { supabase } from "../supabaseClient";
import { Capacitor } from "@capacitor/core";
import Context from "../Context";
import { useMobileNet } from "./useMobileNet";
import { useCloudSync } from "./useCloudSync";

// Create instance of Ionic KV Storage in browser/storage/indexDB/_ionickv
const store = new Storage();

const createStorage = async () => {
  await store.create();
  return;
};
createStorage();

/**
 * Photo Gallery Hook
 * @returns
 */
export function usePhotoGallery() {

  const { dispatch, session, isLoadingSession, photos } = useContext(Context);
  const { getEmbeddings } = useMobileNet();
  const { savePictureToCloud } = useCloudSync();
  const { downloadPictureFromCloud } = useCloudSync();
  const { updateCloudKVStore } = useCloudSync();

  const [showLoading, hideLoading] = useIonLoading();

  const [showToast] = useIonToast();

  // Name KV photo storage using user id from supabase
  const PHOTO_STORAGE = `photos-usr-${session?.user?.id ?? "undefined"}`;

  useEffect(() => {
    /**
     * Looks for local or cloud versions of photos KVs and Image data
     * @returns
     */
    const loadSaved = async () => {
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

      console.log("Platforms ", getPlatforms());

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
    };

    if (!isLoadingSession) loadSaved();
  }, [
    PHOTO_STORAGE,
    dispatch,
    downloadPictureFromCloud,
    isLoadingSession,
    savePictureToCloud,
    session?.user.id,
    showToast,
  ]);

  /**
   * Saves picture to local Filesystem + Cloud and gets Image Embeddings
   * @param photo
   * @param fileName
   * @returns UserPhoto obj including any embeddings
   */
  const savePicture = async (
    photo: Photo,
    fileName: string
  ): Promise<UserPhoto> => {
    let base64Data: string;
    // "hybrid" will detect Cordova or Capacitor
    if (isPlatform("hybrid")) {
      const file = await Filesystem.readFile({
        path: photo.path!,
      });
      base64Data = file.data;
    } else {
      base64Data = await base64FromPath(photo.webPath!);
    }

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    const backedUp = await savePictureToCloud(base64Data, fileName);

    let embeddings: any = "";

    await hideLoading();
    await showLoading("Analyzing image");
    
    try {
      embeddings = await getEmbeddings(base64Data);
    } catch (error) {
      console.log(error);
      await showToast({ message: `${error}`, duration: 3000 });
      await hideLoading();
    }

    // let predictions: any = "";

    // try {
    //   predictions = await getPredictions(base64Data);
    //   console.log("predictions are ", predictions)
    // } catch (error) {
    //   console.log(error)
    // }

    if (isPlatform("hybrid")) {
      // Display the new image rewriting the 'file://' path to HTTP
      return {
        filepath: fileName,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
        flag: null,
        cloudBackup: backedUp,
        embeddings: embeddings,
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
        flag: null,
        cloudBackup: backedUp,
        embeddings: embeddings,
      };
    }
    
  };

  /**
   * Gets photo from camera or library,saves image and updates photos store
   * @returns Uri of photo
   */
  const takePhoto = async () => {
    await showLoading({ message: "Wait...", mode: "ios" });

    /**
     * Opens device camera to let user take photo or select from gallery
     * @returns photo / undefined
     */
    const getPhoto = async () => {
      try {
        const photo = await Camera.getPhoto({
          resultType: CameraResultType.Uri,
          // source: CameraSource.Camera, -> if source is Camera, can't select from gallery
          quality: 50,
          width: 600,
          height: 600,
        });
        return photo;
      } catch (error) {
        console.error(error);
        await hideLoading();
        return undefined;
      }
    };

    const photo = await getPhoto();

    if (!photo) {
      await hideLoading();
      return;
    }

    const filename = new Date().getTime() + ".jpeg";

    const savedFileImage = await savePicture(photo, filename);

    const newPhotos = [savedFileImage, ...photos];

    store.set(PHOTO_STORAGE, JSON.stringify(newPhotos));

    // Save copy of key-value store to cloud
    updateCloudKVStore(session, newPhotos);

    // Update app state
    dispatch({ type: "SET_STATE", state: { photos: newPhotos } });
    await hideLoading();
  };

  /**
   * Sets Y/N flag to photo, updates local and cloud store
   * @param photo
   * @param e
   * @returns
   */
  const setFlag = async (photo: UserPhoto | undefined, e?: any) => {
    if (photo === undefined) return;

    e.target.dataset.flag !== ""
      ? (photo.flag = e.target.dataset.flag)
      : (photo.flag = null);
    const filepath = photo.filepath;
    const newPhotos = [
      photo,
      ...photos.filter((photo) => photo.filepath !== filepath),
    ];
    store.set(PHOTO_STORAGE, JSON.stringify(newPhotos));

    // Update copy of key-value store on cloud
    updateCloudKVStore(session, newPhotos);

    // Update app state
    dispatch({ type: "SET_STATE", state: { photos: newPhotos } });
  };

  /**
   * Removes photo from store, file system and cloud bucket
   * @param photo
   */
  const deletePhoto = async (photo: UserPhoto) => {
    await showLoading();
    // Remove photo from the Photos reference array
    const newPhotos = photos.filter((p) => p.filepath !== photo.filepath);

    // Update photos array cache by overwriting the existing photo array
    store.set(PHOTO_STORAGE, JSON.stringify(newPhotos));

    // Update copy of key-value store on cloud
    updateCloudKVStore(session, newPhotos);

    // Then delete photo from filesystem
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf("/") + 1);
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });

    // Then delete from cloud
    const { error: _error } = await supabase.storage
      .from("photos")
      .remove([`${session?.user?.id ?? "undefined"}/${filename}`]);
    if (_error) {
      console.error(_error);
      await showToast({
        message: _error.message,
        duration: 3000,
      });
    }

    // Update app state
    // setPhotos(newPhotos);
    dispatch({ type: "SET_STATE", state: { photos: newPhotos } });
    await hideLoading();
  };

  return {
    takePhoto,
    deletePhoto,
    setFlag,
  };
}

/**
 * Helper function to convert webpath of an image into base64 string
 * @param path
 * @returns Promise with base64 ASCII econded string
 */
export async function base64FromPath(path: string): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject("method did not return a string");
      }
    };
    reader.readAsDataURL(blob);
  });
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  flag?: string | null;
  cloudBackup?: boolean;
  embeddings:
    | number
    | number[]
    | number[][]
    | number[][][]
    | number[][][][]
    | number[][][][][]
    | number[][][][][][];
}
