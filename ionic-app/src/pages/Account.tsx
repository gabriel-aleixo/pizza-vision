import {
  IonButton,
  IonContent,
  IonInput,
  IonLabel,
  IonPage,
  // IonLoading,
  useIonLoading,
  useIonToast,
  useIonRouter,
  IonNote,
  IonList,
  IonIcon,
  IonListHeader,
  IonItem,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
  IonToggle,
} from "@ionic/react";
import { useState, useContext } from "react";
import Context from "../Context";
import { supabase } from "../services/supabaseClient";
import { useUserProfile } from "../hooks/useUserProfile";
import { trash } from "ionicons/icons";

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
            <IonCardTitle>Profile</IonCardTitle>
            <IonCardSubtitle>
              Your username and full name can be visible to other users
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <form onSubmit={updateProfile}>
              <IonItem color={"light"} lines="full">
                <IonNote slot="helper">User Name</IonNote>
                <IonInput
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
                <IonNote slot="helper">Full Name</IonNote>
                <IonInput
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

        <IonCard color={"light"}>
          <IonCardHeader>
            <IonCardTitle>Library Sharing</IonCardTitle>
            <IonCardSubtitle>
              Share access to your library with other users
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonListHeader color={"light"}>General Access</IonListHeader>
              <IonItem color={"light"}>
                <IonLabel>
                  Sharing is {profile.sharingOn ? <>ON</> : <>OFF</>}
                </IonLabel>
                <IonToggle
                  onIonChange={handleSharingChange}
                  slot="end"
                  checked={profile.sharingOn}
                ></IonToggle>
              </IonItem>
            </IonList>

            {profile.sharingOn && profile.photosAccessGrantedTo.length > 0 ? (
              <>
                <IonList lines="none">
                  <IonListHeader color={"light"}>
                    People with access
                  </IonListHeader>
                  {profile.photosAccessGrantedTo.map((value, index) => (
                    <IonItem key={index} color={"light"}>
                      <IonLabel>{value.full_name}</IonLabel>
                      <IonIcon icon={trash} slot="end" color="danger"></IonIcon>
                    </IonItem>
                  ))}
                </IonList>
                <IonButton expand="full">Add others</IonButton>
              </>
            ) : (
              <></>
            )}
          </IonCardContent>
        </IonCard>

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
            <IonCardTitle>Danger Zone</IonCardTitle>
            <IonCardSubtitle>
              Email us if you want to delete your account
            </IonCardSubtitle>
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
