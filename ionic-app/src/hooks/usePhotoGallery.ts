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
  const [photos, setPhotos] = useState<UserPhoto[]>([]);

  const { dispatch, session, isLoading } = useContext(Context);
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
      // const { value } = await Preferences.get({ key: PHOTO_STORAGE });
      let value = await store.get(PHOTO_STORAGE);

      // If no local copy of key-value store, look for cloud backup
      if (!value) {
        const { data, error } = await supabase
          .from("photos")
          .select("photos")
          .eq("user_id", session?.user.id)
          .limit(1);

        if (error) {
          console.error(error);
          await showToast({
            message: error.message,
            duration: 3000,
          });
        }
        value = data ? JSON.stringify(data[0].photos) : JSON.stringify([]);
        store.set(PHOTO_STORAGE, value);
      }

      const photosInStore = (value ? JSON.parse(value) : []) as UserPhoto[];

      // If running on web
      if (!isPlatform("hybrid")) {
        for (let photo of photosInStore) {
          try {
            // Recover picture file from local filesystem
            const file = await Filesystem.readFile({
              path: photo.filepath,
              directory: Directory.Data,
            });
            photo.webviewPath = `data:image/jpeg;base64,${file.data}`;

            // Check if photo hasn't been backeudup before
            if (photo.cloudBackup !== true) {
              photo.cloudBackup = await savePictureToCloud(
                file.data,
                photo.filepath
              );
            }
          } catch (error) {
            // If error getting file from local filesystem, look for picture in the cloud
            console.log("Getting file from cloud bucket", photo.filepath);
            const imageData = await downloadPictureFromCloud(photo.filepath);
            photo.webviewPath = `data:image/jpeg;base64,${imageData}`;

            // Then save to local filesystem and mark photo as backed up in local key-value store
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
        }
      }
      setPhotos(photosInStore);
      dispatch({ type: "SET_STATE", state: { photos: photosInStore } });
    };
    if (!isLoading) loadSaved();
  }, [
    PHOTO_STORAGE,
    dispatch,
    showToast,
    session,
    isLoading,
    savePictureToCloud,
    downloadPictureFromCloud,
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

    if (isPlatform("hybrid")) {
      // Display the new image rewriting the 'file://' path to HTTP
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
        flag: null,
        cloudBackup: backedUp,
        embeddings: [],
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
        flag: null,
        cloudBackup: backedUp,
        embeddings: [],
      };
    }
  };

  const takePhoto = async () => {
    await showLoading();

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

    // Put call to getEmbedding here, then set poto.embeddings with the result
    savedFileImage.embeddings = await getEmbeddings(savedFileImage);
    // console.log("Embeddings: ", savedFileImage.embeddings);

    // TODO We can add predictions to the Photo from here, in the future;

    const newPhotos = [savedFileImage, ...photos];
    setPhotos(newPhotos);
    // Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });
    store.set(PHOTO_STORAGE, JSON.stringify(newPhotos));

    // Save copy of key-value store to cloud
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

    // Update app state
    dispatch({ type: "SET_STATE", state: { photos: newPhotos } });
    await hideLoading();
  };

  const setFlag = async (photo: UserPhoto, e?: any) => {
    // console.log(e.target.dataset.flag);
    // console.log(photo, photo.flag);
    e.target.dataset.flag !== ""
      ? (photo.flag = e.target.dataset.flag)
      : (photo.flag = null);
    const filepath = photo.filepath;
    const newPhotos = [
      photo,
      ...photos.filter((photo) => photo.filepath !== filepath),
    ];
    setPhotos(newPhotos);
    // Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(photos) });
    store.set(PHOTO_STORAGE, JSON.stringify(photos));

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
    dispatch({ type: "SET_STATE", state: { photos: photos } });
  };

  const deletePhoto = async (photo: UserPhoto) => {
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
    }

    // Update app state
    setPhotos(newPhotos);
    dispatch({ type: "SET_STATE", state: { photos: newPhotos } });
  };

  return {
    photos,
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
