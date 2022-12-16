import React, { useState, useEffect, useContext } from "react";
import { isPlatform, useIonLoading } from "@ionic/react";
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
// import { Preferences } from "@capacitor/preferences";
import { Storage } from "@ionic/storage";

import { Capacitor } from "@capacitor/core";
import Context from "../Context";
import { useMobileNet } from "./useMobileNet";

const PHOTO_STORAGE = "photos";
const store = new Storage();

const createStorage = async () => {
  await store.create();
  return;
};
createStorage();

export function usePhotoGallery() {
  const [photos, setPhotos] = useState<UserPhoto[]>([]);

  const { dispatch } = useContext(Context);
  const { getEmbeddings, getPredictions } = useMobileNet();

  const [showLoading, hideLoading] = useIonLoading();

  useEffect(() => {
    const loadSaved = async () => {
      // const { value } = await Preferences.get({ key: PHOTO_STORAGE });
      const value = await store.get(PHOTO_STORAGE);

      const photosInStore = (value ? JSON.parse(value) : []) as UserPhoto[];

      // If running on web
      if (!isPlatform("hybrid")) {
        for (let photo of photosInStore) {
          const file = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });
          photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
          // getEmbeddings(photo);
          // getPredictions(photo);
        }
      }
      setPhotos(photosInStore);
      dispatch({ type: "SET_STATE", state: { photos: photosInStore } });
    };
    loadSaved();
  }, []);

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

    if (isPlatform("hybrid")) {
      // Display the new image rewriting the 'file://' path to HTTP
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
        flag: null,
        embeddings: [],
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
        flag: null,
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
        console.error(error)
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
    console.log("Embeddings: ", savedFileImage.embeddings);

    // TODO We can add predictions to the Photo from here, in the future;

    const newPhotos = [savedFileImage, ...photos];
    setPhotos(newPhotos);
    // Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });
    store.set(PHOTO_STORAGE, JSON.stringify(newPhotos));
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
    dispatch({ type: "SET_STATE", state: { photos: photos } });
  };

  const deletePhoto = async (photo: UserPhoto) => {
    // Remove photo from the Photos reference array
    const newPhotos = photos.filter((p) => p.filepath !== photo.filepath);

    // Update photos array cache by overwriting the existing photo array
    // Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });
    store.set(PHOTO_STORAGE, JSON.stringify(newPhotos));

    // Then delete photo from filesystem
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf("/") + 1);
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
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
  embeddings:
    | number
    | number[]
    | number[][]
    | number[][][]
    | number[][][][]
    | number[][][][][]
    | number[][][][][][];
}
