import { useCallback, useContext } from "react";
import { supabase } from "../services/supabaseClient";
import Context from "../Context";
import { UserPhoto } from "./usePhotoGallery";
import { Session } from "@supabase/supabase-js";

export function useLibrarySharing() {
  const { session } = useContext(Context);
  const { photos } = useContext(Context);

  photos.sort(
    (a, b) =>
      parseInt(b.filepath.substring(0, b.filepath.lastIndexOf("."))) -
      parseInt(a.filepath.substring(0, a.filepath.lastIndexOf(".")))
  );


  /**
   * 
   * @param sharedUid - uuid of owner of shared library to check
   * @returns Promise<boolean>
   */
  const checkSharedLibUpdated = useCallback(
    async (sharedUid: string): Promise<boolean> => {
      try {
        // Determine last update of local KV store
        const localUpdatedAt = photos[0].filepath.substring(0, photos[0].filepath.lastIndexOf("."));

        // Determine last update of Shared library KV store
        const sharedUpdatedAt = await supabase
        .from("photos")
        .select("updated_at")
        .eq("user_id", sharedUid);

        // If shared newer than local, return true
        console.log("local upd", localUpdatedAt);
        console.log("shared upd", sharedUpdatedAt);

      } catch (error) {
        console.error(error);
        return false;
      }
      return true;
    },
    [photos]
  );

  return {
    checkSharedLibUpdated,
  };
}
