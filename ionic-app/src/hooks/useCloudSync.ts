import { useCallback, useContext } from "react";
import { supabase } from "../services/supabaseClient";
import Context from "../Context";
import { UserPhoto } from "./usePhotoGallery";
import { Session } from "@supabase/supabase-js";

export function useCloudSync() {
  const { session } = useContext(Context);

  /**
   * Converts base64 ASCII string to ArrayBuffer and uploads to cloud
   * @param base64Data : string
   * @param file : string
   * @returns Promise<boolean>
   */
  const savePictureToCloud = useCallback(
    async (base64Data: string, fileName: string): Promise<boolean> => {
      try {
        // Need to remove header from the string used in the app
        const base64string = base64Data.replace(
          /^data:image\/(png|jpeg|jpg);base64,/,
          ""
        );

        // Convert base64-encoded ASCII string to ArrayBuffer
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

  /**
   * Returns Base64-encoded ASCII string with image data
   * @param filename : string
   * @returns Promise<string>
   */
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

  /**
   * Updates KV store in photos table in cloud
   * @param session
   * @param values
   * @returns
   */
  const updateCloudKVStore = useCallback(
    async (session: Session | null, values: UserPhoto[]) => {

      const updates = {
        user_id: session?.user?.id,
        photos: values,
        updated_at: new Date(),
      };

      const { data, error } = await supabase.from("photos").upsert(updates);

      if (error) {
        console.error(error);
        return error;
      }

      return 0;
    },
    []
  );

  return {
    savePictureToCloud,
    downloadPictureFromCloud,
    updateCloudKVStore,
  };
}
