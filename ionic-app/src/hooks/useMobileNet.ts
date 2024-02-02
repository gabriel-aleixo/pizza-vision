import "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

export function useMobileNet() {
  const version = 2;
  const alpha = 0.5;

  /**
   * Converts base64 ASCII string into HTMLImageElement,
   * and passes it to mobilenet model to get embeddings
   * @param base64String The base64 string
   * @returns Array(1280) with image embeddings
   */
  const getEmbeddings = async (
    base64String: string
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

      console.timeLog("takePhoto")
      const model = await mobilenet.load({ version, alpha });

      console.timeLog("takePhoto")

      const image = new Image();
      image.src = base64String;

      image
        .decode()
        .then(async () => {
          console.timeLog("takePhoto")

          const embeddings = model.infer(image, true);
          console.timeLog("takePhoto")

          const data = await embeddings.array();
          console.timeLog("takePhoto")

          // console.log(data);
          resolve(data);
        })
        .catch((error) => {
          console.error("Error encoding image: ", error);
          reject(error);
        });
    });
  };

  const getPredictions = async (base64String: string): Promise<{}[]> => {
    return new Promise(async (resolve, reject) => {
      const model = await mobilenet.load({ version, alpha });


      const image = new Image();
      image.src = base64String;
      image
        .decode()
        .then(async () => {
          const predictions = model.classify(image, 5);
          // console.log(predictions);
          resolve(predictions);
        })
        .catch((error) => {
          console.error("Error encoding image: ", error);
          reject(error);
        });
    });
  };

  /**
   * Calculates cosine distance of two vectors
   * @param vec1input 
   * @param vec2input 
   * @returns 
   */
  const cosineSimilarity = (vec1input: any, vec2input: any) => {
    const vec1: number[] = vec1input[0];
    const vec2: number[] = vec2input[0];
    // console.log("Vectors are: ", vec1input, vec2input)

    if (!vec1 || !vec2) {
      return 0;
    }

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
