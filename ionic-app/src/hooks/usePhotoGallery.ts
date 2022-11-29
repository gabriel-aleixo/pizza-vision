import React, { useState, useEffect } from "react";
import { isPlatform } from "@ionic/react";
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import Photos from "../pages/Photos";

const PHOTO_STORAGE = "photos";

export function usePhotoGallery() {
  const [photos, setPhotos] = useState<UserPhoto[]>([]);

  useEffect(() => {
    const loadSaved = async () => {
      const { value } = await Preferences.get({ key: PHOTO_STORAGE });

      const photosInPreferences = (
        value ? JSON.parse(value) : []
      ) as UserPhoto[];
      // If running on web
      if (!isPlatform("hybrid")) {
        for (let photo of photosInPreferences) {
          const file = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });
          photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
        }
      }
      setPhotos(photosInPreferences);
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
      // Diaplay the new image rewriting the 'file://' path to HTTP
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
        flag: null,
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
        flag: null,
      };
    }
  };

  const takePhoto = async () => {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 90,
    });
    const filename = new Date().getTime() + ".jpeg";
    const savedFileImage = await savePicture(photo, filename);
    const newPhotos = [savedFileImage, ...photos];
    setPhotos(newPhotos);
    Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });
  };

  const setFlag = async (photo: UserPhoto, e?: any) => {
    console.log(e.target.dataset.flag);
    console.log(photo, photo.flag);
    photo.flag = e.target.dataset.flag;
    const filepath = photo.filepath;
    console.log(photos);
    const newPhotos = [
      photo,
      ...photos.filter((photo) => photo.filepath !== filepath),
    ];
    newPhotos.sort(
      (a, b) =>
        parseInt(a.filepath.substring(0, a.filepath.lastIndexOf("."))) -
        parseInt(a.filepath.substring(0, a.filepath.lastIndexOf(".")))
    );
    setPhotos(newPhotos);
    Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });

    // const filename = photo.filepath.substr(photo.filepath.lastIndexOf("/") + 1);
    // const file = await Filesystem.readFile({
    //   path: filename,
    //   directory: Directory.Data,
    // });

    // await Filesystem.appendFile({
    //   path: filename,
    //   data: file.data,
    //   directory: Directory.Data,
    // });
  };

  const deletePhoto = async (photo: UserPhoto) => {
    // Remove photo from the Photos reference array
    const newPhotos = photos.filter((p) => p.filepath !== photo.filepath);

    // Update photos array cache by overwriting the existing photo array
    Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });

    // Then delete photo from filesystem
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf("/") + 1);
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
    setPhotos(newPhotos);
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
}
