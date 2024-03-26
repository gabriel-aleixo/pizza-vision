import React from "react";
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  IonButton,
  useIonLoading,
  useIonToast,
} from "@ionic/react";
import { trash } from "ionicons/icons";
import AddOthersModal from "./AddOthersModal";
import { supabase } from "../services/supabaseClient";
import Context from "../Context";
import { useContext } from "react";

import "./LibrarySharingCard.css";

const LibrarySharingCard: React.FC = () => {
  const { profile, user, dispatch } = useContext(Context);
  const [showLoading, hideLoading] = useIonLoading();
  const [showToast] = useIonToast();

  /**
   * Updates user sharing preference on supabase and updates app state
   * @param e Ionic toggle custome event
   */
  const handleSharingChange = async (e?: any) => {
    e?.preventDefault();

    await showLoading();

    try {
      let { data, error } = await supabase
        .from("profiles")
        .update({ sharing_on: e.detail.checked })
        .eq("id", user!.id)
        .select()
        .single();

      let newSharingValue: boolean = data.sharing_on;

      if (error) {
        throw error;
      } else {
        dispatch({
          type: "SET_STATE",
          state: {
            profile: {
              ...profile!,
              sharingOn: newSharingValue,
            },
          },
        });
      }
    } catch (error: any) {
      showToast({ message: error.message, duration: 5000 });
    } finally {
      await hideLoading();
    }
  };

  /**
   * Calls handleRemoveUser, manages loading state, catches and displays errors
   * @param e
   */
  const remove = async (e: any): Promise<void> => {
    await showLoading();

    if (e.target.dataset.id != null) {
      let idToRemove = e.target.dataset.id;

      try {
        const [data, error] = await handleRemoveUser(idToRemove);

        if (error) throw error;

        await hideLoading();
      } catch (e: any) {
        await hideLoading();
        await showToast(e.message, 5000);
      }
    }
  };

  /**
   * Calls database function to remove user id from access_granted_to and updates app state
   * @param idToRemove string with the uid to be removed from array
   * @returns [0, error]
   */
  const handleRemoveUser = async (idToRemove: string) => {
    let accessGrantedToUids: any[] = [];
    // Remove user id from profiles.access_granted_to
    try {
      const { data, error } = await supabase.rpc("remove_access_granted_to", {
        uid: idToRemove,
      });

      if (error) throw error;

      accessGrantedToUids = data;
    } catch (e: any) {
      // Return error if retrieval fails
      console.error(e);
      let error = new Error("Something went wrong, try again");
      return [null, error];
    }

    // Get the full_name for the ids in the updated access_granted_to array
    let photosAccessGrantedTo: any[] = [];
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", accessGrantedToUids);

      if (error) throw error;

      photosAccessGrantedTo = data;
      console.log(photosAccessGrantedTo);
    } catch (e: any) {
      // Return error if retrieval fails
      console.error(e);
      let error = new Error("Something went wrong, try again");
      return [null, error];
    }

    // Update app state.profile.access_granted_to
    dispatch({
      type: "SET_STATE",
      state: {
        profile: {
          ...profile,
          photosAccessGrantedTo: photosAccessGrantedTo,
        },
      },
    });
    // Return 0 if all ok
    return [0, null];
  };

  return (
    <IonCard color={"light"}>
      <IonCardHeader>
        <IonCardSubtitle>
          Share access to your library with other users
        </IonCardSubtitle>
        <IonCardTitle>Library Sharing</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonList lines="none">
          <IonListHeader color={"light"}>General Access</IonListHeader>
          <IonItem color={"light"}>
            <IonLabel>
              Sharing is {profile.sharingOn ? <>ON</> : <>OFF</>}
            </IonLabel>
            <IonToggle
              aria-label="Sharing"
              onIonChange={handleSharingChange}
              slot="end"
              checked={profile.sharingOn}
            ></IonToggle>
          </IonItem>
        </IonList>

        {profile.sharingOn && profile.photosAccessGrantedTo.length > 0 ? (
          <IonList lines="none">
            <IonListHeader color={"light"}>People with access</IonListHeader>
            {profile.photosAccessGrantedTo.map((value, index) => (
              <IonItem key={index} color={"light"}>
                <IonLabel>{!value.full_name ? value.username : value.full_name}</IonLabel>
                <IonButton
                  data-id={value.id}
                  className="item-delete-button"
                  slot="end"
                  fill="clear"
                  size="default"
                  onClick={(e) => remove(e)}
                >
                  <IonIcon
                    slot="icon-only"
                    icon={trash}
                    color="danger"
                  ></IonIcon>
                </IonButton>
                {/* <IonIcon icon={trash} slot="end" color="danger"></IonIcon> */}
              </IonItem>
            ))}
          </IonList>
        ) : (
          <></>
        )}
        {profile.sharingOn ? (
          <>
            <IonButton id="open-modal" expand="full">
              Add others
            </IonButton>
            <AddOthersModal></AddOthersModal>
          </>
        ) : (
          <></>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default LibrarySharingCard;
