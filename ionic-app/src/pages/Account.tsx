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
} from "@ionic/react";
import { useEffect, useState, useContext, useCallback } from "react";
import Context from "../Context";
import { supabase } from "../supabaseClient";
// import { Session } from "@supabase/gotrue-js/src/lib/types";

function AccountPage() {
  const [showToast] = useIonToast();
  const router = useIonRouter();
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const { session, dispatch } = useContext(Context);

  const [profile, setProfile] = useState({
    username: "",
    full_name: "",
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
          .select()
          .single();

        console.log(data);

        if (error) {
          throw error;
        }

        if (data != null) {
          setProfile({
            username: data.username,
            full_name: data.full_name,
          });
        }
      } catch (error: any) {
        console.error(error);
        showToast({
          message: error.message,
          duration: 5000,
        });
        // dispatch({ type: "RESET_STATE" });
        // await signOut();
      } finally {
        setShowLoading(false);
      }
    };

    getProfile();
  }, [showToast]);

  const updateProfile = async (e?: any, avatar_url: string = "") => {
    e?.preventDefault();

    console.log("update ");
    setShowLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const updates = {
        id: user!.id,
        ...profile,
        avatar_url: avatar_url,
        updated_at: new Date(),
      };

      let { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      showToast({ message: error.message, duration: 5000 });
    } finally {
      //   await hideLoading();
      setShowLoading(false);
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
        <form onSubmit={updateProfile} className="ion-padding">
          <div>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput
              type="text"
              name="email"
              value={session?.user?.email}
              disabled
            />
            <IonNote slot="helper">You can't change your Email</IonNote>
          </div>
          {/* <IonLabel position="stacked">Phone</IonLabel>
              <IonInput type="text" name="phone" value={session?.user?.phone} disabled /> */}
          <IonLabel position="stacked">User Name</IonLabel>
          <IonInput
            type="text"
            name="username"
            value={profile.username}
            onIonChange={(e) =>
              setProfile({ ...profile, username: e.detail.value ?? "" })
            }
          />

          <IonLabel position="stacked">Full Name</IonLabel>
          <IonInput
            type="text"
            name="full_name"
            value={profile.full_name}
            onIonChange={(e) =>
              setProfile({ ...profile, full_name: e.detail.value ?? "" })
            }
          />

          <div className="ion-text-center ion-padding-top">
            <IonButton expand="block" type="submit">
              Update Profile
            </IonButton>
          </div>
        </form>

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
