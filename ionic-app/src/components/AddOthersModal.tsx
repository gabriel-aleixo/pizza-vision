import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonNote,
  useIonLoading,
  useIonToast,
} from "@ionic/react";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import React, { useContext, useRef, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Context from "../Context";

const AddOthersModal: React.FC = (props) => {
  const modal = useRef<HTMLIonModalElement>(null);
  const input = useRef<HTMLIonInputElement>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [isValid, setIsValid] = useState<boolean>();
  const [showLoading, hideLoading] = useIonLoading();
  const [showToast] = useIonToast();
  const { dispatch, profile } = useContext(Context);

  const confirm = async () => {
    await showLoading();

    if (input.current?.value != null) {
      let email = input.current?.value.toString();

      try {
        const [data, error] = await handleAddOthers(email);

        if (error) throw error;

        console.log(data);
        await hideLoading();

        modal.current?.dismiss(input.current?.value, "confirm");
      } catch (e: any) {
        await hideLoading();
        await showToast(e.message, 5000);
      }
    }
  };

  const onWillDismiss = (ev: CustomEvent<OverlayEventDetail>) => {
    if (ev.detail.role === "confirm") {
      // Show confirmation message here
    }
  };
  const validateEmail = (email: string) => {
    return email.match(
      /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    );
  };

  const validate = (ev: Event) => {
    const value = (ev.target as HTMLInputElement).value;

    setIsValid(undefined);

    if (value === "") return;

    validateEmail(value) !== null ? setIsValid(true) : setIsValid(false);
  };

  const markTouched = () => {
    setIsTouched(true);
  };

  const handleAddOthers = async (
    email: string
  ): Promise<[any, Error | null]> => {
    // Check if email exists in Auth.users table
    let idToAdd: any;
    try {
      let { data, error } = await supabase.rpc("get_user_id", {
        email: email,
      });

      if (error) throw error;

      idToAdd = data;

    } catch (e: any) {
      // Return error message user not found
      console.error(e);
      let error = new Error("User not found");
      return [null, error];
    }

    let accessGrantedToUids: any[] = [];
    // Add other user id to profiles.access_granted_to
    try {
      const { data, error } = await supabase.rpc("append_access_granted_to", {
        uid: idToAdd,
      });

      if (error) throw error;

      accessGrantedToUids = data;

      console.log(accessGrantedToUids);
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
    <IonModal
      ref={modal}
      trigger="open-modal"
      onWillDismiss={(ev) => onWillDismiss(ev)}
    >
      <IonContent className="ion-padding">
        <IonCard color={"light"}>
          <IonCardHeader>
            <IonCardTitle>Share your library</IonCardTitle>
            <IonCardSubtitle>
              Enter the email of an existing user to share access to your photos
              library
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem
              color={"light"}
              lines="full"
              className={`${isValid && "ion-valid"} ${
                isValid === false && "ion-invalid"
              } ${isTouched && "ion-touched"}`}
            >
              <IonNote slot="helperText">Enter a valid email</IonNote>
              <IonNote slot="errorText">Invalid email</IonNote>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                aria-label="email"
                ref={input}
                type="email"
                onIonInput={(event) => validate(event)}
                onIonBlur={() => markTouched()}
              />
            </IonItem>
            <IonButton
              disabled={!isValid}
              className="ion-margin-vertical"
              expand="full"
              strong={true}
              onClick={() => confirm()}
            >
              Confirm
            </IonButton>
            <IonButton
              color={"warning"}
              expand="full"
              onClick={() => modal.current?.dismiss()}
            >
              Cancel
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonModal>
  );
};

export default AddOthersModal;
