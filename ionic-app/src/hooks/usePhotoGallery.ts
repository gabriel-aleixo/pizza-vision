import { useState, useEffect, useContext, useCallback } from "react";
import { isPlatform, useIonLoading, useIonToast } from "@ionic/react";
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
// import { Preferences } from "@capacitor/preferences";
import { Storage } from "@ionic/storage";
import { supabase } from "../supabaseClient";
import { Capacitor } from "@capacitor/core";
import Context from "../Context";
import { useMobileNet } from "./useMobileNet";

const store = new Storage();

const createStorage = async () => {
  await store.create();
  return;
};
createStorage();

export function usePhotoGallery() {
  // const [photos, setPhotos] = useState<UserPhoto[]>([]);

  const { dispatch, session, isLoadingSession, photos } = useContext(Context);
  const { getEmbeddings } = useMobileNet();

  const [showLoading, hideLoading] = useIonLoading();

  const [showToast] = useIonToast();

  const PHOTO_STORAGE = `photos-usr-${session?.user?.id ?? "undefined"}`;

  const savePictureToCloud = useCallback(
    async (base64Data: string, fileName: string): Promise<boolean> => {
      try {
        // Need to remove header from the string used in the app
        const base64string = base64Data.replace(
          /^data:image\/(png|jpeg|jpg);base64,/,
          ""
        );

        // Convert base64-encoded ASCII string to ArrayBffer
        const dataArray = Uint8Array.from(atob(base64string), (c) =>
          c.charCodeAt(0)
        );

        // Upload to cloud using ArrayBuffer
        const { data, error } = await supabase.storage
          .from("photos")
          .upload(
            `${session?.user?.id ?? "undefined"}/${fileName}`,
            dataArray,
            {
              contentType: "image/jpg",
              upsert: true,
            }
          );

        if (error) {
          console.error(error);
          return false;
        }
      } catch (error) {
        console.error(error);
        return false;
      }
      return true;
    },
    [session?.user?.id]
  );

  const downloadPictureFromCloud = useCallback(
    async (fileName: string): Promise<string> => {
      // Declare empty sring to hold binary data
      let binary = "";

      // Retrieve picture blob from cloud
      const { data, error } = await supabase.storage
        .from("photos")
        .download(`${session?.user?.id ?? "undefined"}/${fileName}`);

      if (error) {
        console.error(error);
        return window.btoa(binary);
      }

      // Conver ArrayBuffer from Blob into byte string
      if (data?.arrayBuffer) {
        // Create typed array of 8-bit integers with the contents of the ArrayBuffer
        let bytes = new Uint8Array(await data?.arrayBuffer());
        const len = bytes.byteLength;
        // Iterate through Uint8Array and add characters UTF-16 codes to 'binary' string
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
      }

      // Convert bynary string to Base64-encoded ASCII string
      return window.btoa(binary);
    },
    [session?.user?.id]
  );

  useEffect(() => {
    const loadSaved = async () => {
      dispatch({ type: "SET_STATE", state: { isLoadingData: true } });
      let value = await store.get(PHOTO_STORAGE);

      // If no local copy of key-value store, look for cloud backup
      if (!value) {
        console.log("Getting KV from cloud")
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
      // console.log("Photos in store", photosInStore);

      // If running on web
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
          }
          const filepath = photo.filepath;
          photosInStore = [
            photo,
            ...photosInStore.filter((photo) => photo.filepath !== filepath),
          ];
        }
      } else if (isPlatform("hybrid")) {
        // TODO Recover picture file from local filesystem, if not, look for cloud, etc
        for (let photo of photosInStore) {
          // Check if photo can be loaded from Filesystem
          const decodeImage = async (photo: UserPhoto): Promise<boolean> => {
            return new Promise(async (resolve, reject) => {
              let img = new Image();
              img.src = photo.webviewPath ? photo.webviewPath : "";
              img
                .decode()
                .then(() => {
                  // console.log(`File ${photo.filepath} exists`);
                  resolve(true);
                })
                .catch((error) => {
                  // console.error(`Error decoding file ${photo.filepath}`);
                  resolve(false);
                });
            });
          };

          if ((await decodeImage(photo)) === false) {
            // If can't get file from local filesystem, look for picture in the cloud
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
            const filepath = photo.filepath;
            photosInStore = [
              photo,
              ...photosInStore.filter((photo) => photo.filepath !== filepath),
            ];
          }
        }
      }
      // setPhotos(photosInStore);
      // Update app state with photos in store
      store.set(PHOTO_STORAGE, JSON.stringify(photosInStore))
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

    try {
      embeddings = await getEmbeddings(base64Data);
    } catch (error) {
      console.log(error);
      await showToast({ message: `${error}`, duration: 3000 });
      await hideLoading();
    }

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

  const takePhoto = async () => {
    await showLoading({ message: "Processing image..." });

    const getPhoto = async () => {
      try {
        const photo = await Camera.getPhoto({
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
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

    // Call getEmbeddings then set poto.embeddings with the result
    // getBase64 from Path only works for Web. Better to pass base64 to getEmbeddings
    // Better to get embeddings from within savePicture func where base64 is available
    // try {
    //   savedFileImage.embeddings = await getEmbeddings(savedFileImage);
    // } catch (error) {
    //   console.error(error);
    // }

    const newPhotos = [savedFileImage, ...photos];
    // setPhotos(newPhotos);
    // Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });
    store.set(PHOTO_STORAGE, JSON.stringify(newPhotos));

    // Save copy of key-value store to cloud
    const { data, error } = await supabase.from("photos").upsert({
      user_id: session?.user?.id,
      photos: newPhotos,
    });
    //   .select("*");

    // console.log(data);

    if (error) {
      console.error(error);
      await showToast({
        message: error.message,
        duration: 3000,
      });
    }

    // Update app state
    dispatch({ type: "SET_STATE", state: { photos: newPhotos } });
    await hideLoading();
  };

  const setFlag = async (photo: UserPhoto | undefined, e?: any) => {
    // console.log(e.target.dataset.flag);
    // console.log(photo, photo.flag);
    if (photo === undefined) return;

    e.target.dataset.flag !== ""
      ? (photo.flag = e.target.dataset.flag)
      : (photo.flag = null);
    const filepath = photo.filepath;
    const newPhotos = [
      photo,
      ...photos.filter((photo) => photo.filepath !== filepath),
    ];
    // setPhotos(newPhotos);
    // Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(photos) });
    store.set(PHOTO_STORAGE, JSON.stringify(newPhotos));

    // Update copy of key-value store on cloud
    const { data, error } = await supabase.from("photos").upsert({
      user_id: session?.user?.id,
      photos: photos,
    });

    if (error) {
      console.error(error);
      await showToast({
        message: error.message,
        duration: 3000,
      });
    }

    // Update app state
    dispatch({ type: "SET_STATE", state: { photos: newPhotos } });
  };

  const deletePhoto = async (photo: UserPhoto) => {
    await showLoading();
    // Remove photo from the Photos reference array
    const newPhotos = photos.filter((p) => p.filepath !== photo.filepath);

    // Update photos array cache by overwriting the existing photo array
    // Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });
    store.set(PHOTO_STORAGE, JSON.stringify(newPhotos));

    // Update copy of key-value store on cloud
    const { data, error } = await supabase.from("photos").upsert({
      user_id: session?.user?.id,
      photos: newPhotos,
    });

    if (error) {
      console.error(error);
      await showToast({
        message: error.message,
        duration: 3000,
      });
    }

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
