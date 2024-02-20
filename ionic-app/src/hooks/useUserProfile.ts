import { supabase } from "../services/supabaseClient";
import { Session } from "@supabase/supabase-js";
import { UserProfile } from "../Context";
import { useCallback } from "react";

export function useUserProfile() {
  // const { dispatch } = useContext(Context);
  // const [showToast] = useIonToast();

  /**
   * Fetches user profile object for given user id
   * @param session supabase session object
   * @returns [profile, error]
   */
  const getProfile = useCallback(
    async (
      session: Session | null
    ): Promise<[UserProfile | null, Error | null]> => {
      if (!session) return [null, new Error("No Session object passed")];

      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user!.id)
        .single();

      if (error) return [null, new Error(error.message)];

      let access_granted_to: any[] = [];
      let access_granted_by: any[] = [];

      if (data != null && data.access_granted_to != null) {
        let access_granted_to_promises = data.access_granted_to.map(
          async (uid: any) => {
            let { data, error } = await supabase
              .from("profiles")
              .select("id, full_name")
              .eq("id", uid)
              .single();

            if (error) throw error;

            return data;
          }
        );

        access_granted_to = await Promise.all(access_granted_to_promises);
      }

      if (data != null && data.access_granted_by != null) {
        let access_granted_by_promises = data.access_granted_by.map(
          async (uid: any) => {
            let { data, error } = await supabase
              .from("profiles")
              .select("id, full_name")
              .eq("id", uid)
              .single();

            if (error) throw error;

            return data;
          }
        );

        access_granted_by = await Promise.all(access_granted_by_promises);
      }

      let profile = {
        username: data.username,
        fullName: data.full_name,
        sharingOn: data.sharing_on,
        photosAccessGrantedBy: access_granted_by,
        photosAccessGrantedTo: access_granted_to,
      };

      return [profile, null];
    },
    []
  );

  /**
   *
   * @returns
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) return error;

    return null;
  };

  return { getProfile, signOut };
}
