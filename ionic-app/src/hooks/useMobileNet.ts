import React from "react";
import { UserPhoto, base64FromPath } from "./usePhotoGallery";
import "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Photo } from "@capacitor/camera";

export function useMobileNet() {
  const version = 2;
  const alpha = 0.5;

  const getEmbeddings = async (
    photo: UserPhoto
  ): Promise<
    | number
    | number[]
    | number[][]
    | number[][][]
    | number[][][][]
    | number[][][][][]
    | number[][][][][][]
  > => {

    return new Promise(async (resolve, reject) => {
      const model = await mobilenet.load({ version, alpha });

      if (!photo.webviewPath) {
        console.error("No image data for embeddings");
        return [];
      }
      const base64Data = await base64FromPath(photo.webviewPath);
      const image = new Image();
      image.src = base64Data;
      image
        .decode()
        .then(async () => {
          const embeddings = model.infer(image, true);
          const data = await embeddings.array();
          console.log(data);
          resolve(data);
        })
        .catch((error) => {
          console.error("Error encoding image: ", error);
          reject(error);
        });
    });
  };

  const getPredictions = async (photo: UserPhoto): Promise<{}[]> => {
    return new Promise(async (resolve, reject) => {
        const model = await mobilenet.load({ version, alpha });
  
        if (!photo.webviewPath) {
          console.error("No image data for embeddings");
          return [];
        }
        const base64Data = await base64FromPath(photo.webviewPath);
        const image = new Image();
        image.src = base64Data;
        image
          .decode()
          .then(async () => {
            const predictions = model.classify(image, 10);
            console.log(predictions);
            resolve(predictions);
          })
          .catch((error) => {
            console.error("Error encoding image: ", error);
            reject(error);
          });
      });
  
  };

  const cosineSimilarity = (vec1input: any, vec2input: any) => {
    const vec1: number[] = vec1input[0];
    const vec2: number[] = vec2input[0];
    // console.log("Vectors are: ", vec1, vec2)

    const dotProduct = vec1
      .map((val, i) => val * vec2[i])
      .reduce((accum, curr) => accum + curr, 0);
    const vec1Size = calcVectorSize(vec1);
    const vec2Size = calcVectorSize(vec2);

    // console.log("Similarity is ", dotProduct / (vec1Size * vec2Size))
    return dotProduct / (vec1Size * vec2Size);
  };

  const calcVectorSize = (vec: number[]) => {
    return Math.sqrt(vec.reduce((accum, curr) => accum + Math.pow(curr, 2), 0));
  };

  return {
    getEmbeddings,
    getPredictions,
    cosineSimilarity,
  };
}
