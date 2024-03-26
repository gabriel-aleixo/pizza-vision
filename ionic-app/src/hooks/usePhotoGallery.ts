import { useEffect, useContext } from "react";
import {
  isPlatform,
  useIonLoading,
  useIonToast,
} from "@ionic/react";
import {
  Camera,
  CameraResultType,
  Photo,
} from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Storage } from "@ionic/storage";
import { supabase } from "../services/supabaseClient";
import { Capacitor } from "@capacitor/core";
import Context from "../Context";
import { useMobileNet } from "./useMobileNet";
import { useCloudSync } from "./useCloudSync";
import { useLoadSaved } from "./useLoadSaved";

// Create instance of Ionic KV Storage in browser/storage/indexDB/_ionickv
export const store = new Storage();

const createStorage = async () => {
  await store.create();
  return;
};
createStorage();

/**
 * Photo Gallery Hook
 * @returns { takePhoto(), deletePhoto(), setFlag() }
 */
export function usePhotoGallery() {

  const { dispatch, session, isLoadingSession, photos } = useContext(Context);
  const { getEmbeddings } = useMobileNet();
  const { savePictureToCloud } = useCloudSync();
  const { updateCloudKVStore } = useCloudSync();
  const { loadSaved } = useLoadSaved();

  const [showLoading, hideLoading] = useIonLoading();

  const [showToast] = useIonToast();

  // Name KV photo storage using user id from supabase
  const PHOTO_STORAGE = `photos-usr-${session?.user?.id ?? "undefined"}`;

  useEffect(() => {

    // Loads all KVs and pictures in memory from local or cloud sources
    if (!isLoadingSession) loadSaved();

  }, [isLoadingSession, loadSaved]);

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
