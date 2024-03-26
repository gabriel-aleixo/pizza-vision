import {
  IonButton,
  IonContent,
  IonInput,
  IonLabel,
  IonPage,
  useIonLoading,
  useIonToast,
  useIonRouter,
  IonNote,
  IonList,
  IonItem,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
} from "@ionic/react";
import { useState, useContext } from "react";
import Context from "../Context";
import LibrarySharingCard from "../components/LibrarySharingCard";
import { supabase } from "../services/supabaseClient";
import { useUserProfile } from "../hooks/useUserProfile";

import "./Account.css";

function AccountPage() {
  const [showToast] = useIonToast();
  const router = useIonRouter();
  const [showLoading, hideLoading] = useIonLoading();
  const { session, user, profile, dispatch } = useContext(Context);
  const { signOut } = useUserProfile();

  const [newProfile, setNewProfile] = useState({
    username: profile?.username ?? "",
    full_name: profile?.fullName ?? "",
  });

  /**
   *  Calls the signOut() function, resets app state and routes to root
   * @returns
   */
  const logOut = async () => {
    const error = await signOut();

    if (error) {
      console.error(error);
      showToast({
        message: error.message,
        duration: 5000,
      });

      return null;
    } else {
      dispatch({ type: "RESET_STATE" });
      router.push("/", "forward", "replace");
    }
  };

  /**
   * Sends profile updates to supabase
   * @param e form submit event
   */
  const updateProfile = async (e?: any) => {
    e?.preventDefault();

    await showLoading();

    try {
      const updates = {
        id: user!.id,
        ...newProfile,
        updated_at: new Date(),
      };

      let { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }

      showToast({ message: "Profile updated", duration: 3000 });
    } catch (error: any) {
      showToast({ message: error.message, duration: 5000 });
    } finally {
      hideLoading();
    }
  };

  return (
    <IonPage>
      <IonContent>
        <IonCard color={"light"}>
          <IonCardHeader>
            <IonCardTitle>Account</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem color={"light"} lines="none">
                <IonNote>{session?.user?.email}</IonNote>
              </IonItem>
            </IonList>
            <IonButton expand="full" color="warning" onClick={logOut}>
              Log Out
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard color={"light"}>
          <IonCardHeader>
            <IonCardSubtitle>
              Your username and full name are visible to other users
            </IonCardSubtitle>
            <IonCardTitle>Profile</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <form onSubmit={updateProfile}>
              <IonItem color={"light"} lines="full">
                <IonLabel position="stacked">User Name</IonLabel>
                <IonInput
                  aria-label="Username"
                  type="text"
                  name="username"
                  value={newProfile?.username ?? ""}
                  onIonChange={(e) =>
                    setNewProfile({
                      ...newProfile,
                      username: e.detail.value ?? "",
                    })
                  }
                />
              </IonItem>
              <IonItem color={"light"} lines="full">
                <IonLabel position="stacked">Full Name</IonLabel>
                <IonInput
                  aria-label="full name"
                  type="text"
                  name="full_name"
                  value={newProfile?.full_name ?? ""}
                  onIonChange={(e) =>
                    setNewProfile({
                      ...newProfile,
                      full_name: e.detail.value ?? "",
                    })
                  }
                />
              </IonItem>
              <IonButton expand="block" type="submit">
                Update Profile
              </IonButton>
            </form>
          </IonCardContent>
        </IonCard>

        <LibrarySharingCard />

        <IonCard color={"light"}>
          <IonCardHeader>
            <IonCardTitle>Shared with you</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              {profile.photosAccessGrantedBy &&
              profile.photosAccessGrantedBy.length > 0 ? (
                <>
                  {profile.photosAccessGrantedBy.map((value, index) => (
                    <IonItem key={index} color={"light"}>
                      <IonLabel>{value.full_name}</IonLabel>
                    </IonItem>
                  ))}
                </>
              ) : (
                <></>
              )}
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonCard color={"light"}>
          <IonCardHeader>
            <IonCardSubtitle>
              Email us if you want to delete your account
            </IonCardSubtitle>
            <IonCardTitle>Danger Zone</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton
              expand="block"
              color="danger"
              href={`mailto:delete@gabrielaleixo.com?subject=Please delete my account&body=Please delete my account with the email ${session?.user?.email}`}
            >
              Delete My Account
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
}

export default AccountPage;
