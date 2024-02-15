import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
  IonLoading,
  //   useIonLoading,
  useIonToast,
  useIonRouter,
  IonNote,
  IonText,
  IonList,
} from "@ionic/react";
import { useEffect, useState, useContext } from "react";
import Context from "../Context";
import { supabase } from "../supabaseClient";
// import { Session } from "@supabase/gotrue-js/src/lib/types";

function AccountPage() {
  const [showToast] = useIonToast();
  const router = useIonRouter();
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const { session, user, profile, photos, dispatch } = useContext(Context);

  const [newProfile, setNewProfile] = useState({
    username: profile?.username ?? "",
    full_name: profile?.fullName ?? "",
  });

  const signOut = async () => {
    dispatch({ type: "RESET_STATE" });
    await supabase.auth.signOut();
    router.push("/", "forward", "replace");
  };

  useEffect(() => {
    const getProfile = async () => {
      setShowLoading(true);

      try {
        let { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session?.user!.id)
          .single();

        if (error) {
          throw error;
        }

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

              if (error) {
                throw error;
              }

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

              if (error) {
                throw error;
              }

              return data;
            }
          );

          access_granted_by = await Promise.all(access_granted_by_promises);
        }

        dispatch({
          type: "SET_STATE",
          state: {
            profile: {
              username: data.username,
              fullName: data.full_name,
              sharingOn: data.sharing_on,
              photosAccessGrantedBy: access_granted_by,
              photosAccessGrantedTo: access_granted_to,
            },
          },
        });
      } catch (error: any) {
        console.error(error);
        showToast({
          message: error.message,
          duration: 5000,
        });
      } finally {
        setShowLoading(false);
      }
    };

    getProfile();
  }, [dispatch, session?.user, showToast]);

  const updateProfile = async (e?: any) => {
    e?.preventDefault();

    setShowLoading(true);

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

      dispatch({
        type: "SET_STATE",
        state: {
          profile: {
            ...profile!,
            username: newProfile.username,
            fullName: newProfile.full_name,
          },
        },
      });
    } catch (error: any) {
      showToast({ message: error.message, duration: 5000 });
    } finally {
      setShowLoading(false);
      showToast({ message: "Profile updated", duration: 3000 });
    }
  };
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading
          cssClass="my-custom-class"
          isOpen={showLoading}
          onDidDismiss={() => setShowLoading(false)}
          message={"Hold on..."}
        />
        <div className="ion-padding">
          <IonLabel position="stacked">
            {" "}
            Your email is private and can't be changed
          </IonLabel>
          <IonInput
            type="text"
            name="email"
            value={session?.user?.email}
            disabled
          />
        </div>

        <form onSubmit={updateProfile} className="ion-padding-horizontal">
          <div className="ion-padding-bottom">
            <IonText>
              <h3>Public Profile</h3>
            </IonText>
            <IonNote>
              Your Full Name and Username will be visible to other users
            </IonNote>
          </div>
          <div className="ion-padding-bottom">
            <IonLabel position="stacked">User Name</IonLabel>
            <IonInput
              type="text"
              name="username"
              value={newProfile?.username ?? ""}
              onIonChange={(e) =>
                setNewProfile({ ...newProfile, username: e.detail.value ?? "" })
              }
            />
          </div>

          <div className="ion-padding-bottom">
            <IonLabel position="stacked">Full Name</IonLabel>
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
          </div>
          <div className="ion-text-center ion-padding-top">
            <IonButton expand="block" type="submit">
              Update Profile
            </IonButton>
          </div>
        </form>

        <div className="ion-padding-bottom">
          <IonText>
            <h3>Library Sharing</h3>
          </IonText>
          <IonNote>Give other users access to your photos library</IonNote>
        </div>

        <div>
          {profile.sharingOn && profile.photosAccessGrantedTo.length > 0 ? (
            <>
              <IonNote>You ARE sharing your library with:</IonNote>
              <IonList>
                {profile.photosAccessGrantedTo.map((value, index) => (
                  <IonText key={index}>{value.full_name}</IonText>
                ))}{" "}
              </IonList>
            </>
          ) : (
              <IonNote>You are NOT sharing your library</IonNote>
          )}
        </div>

        <div>
          {profile.photosAccessGrantedBy &&
          profile.photosAccessGrantedBy.length > 0 ? (
            <>
              <IonNote>You have access to these shared libraries:</IonNote>
              <IonList>
                {profile.photosAccessGrantedBy.map((value, index) => (
                  <IonText key={index}>{value.full_name}</IonText>
                ))}
              </IonList>
            </>
          ) : (
            <></>
          )}
        </div>

        <div className="ion-text-center ion-padding">
          <IonButton expand="block" color="warning" onClick={signOut}>
            Log Out
          </IonButton>
        </div>
        <div className="ion-text-center ion-padding">
          <IonButton
            expand="block"
            color="danger"
            href={`mailto:delete@gabrielaleixo.com?subject=Please delete my account&body=Please delete my account with the email ${session?.user?.email}`}
          >
            Delete Account (email us)
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default AccountPage;
