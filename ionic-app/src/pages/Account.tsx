import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
  IonLoading,
  //   useIonLoading,
  useIonToast,
  useIonRouter,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Session } from "@supabase/gotrue-js/src/lib/types";

function AccountPage() {
  //   const [showLoading, hideLoading] = useIonLoading();
  const [showToast] = useIonToast();
  const router = useIonRouter();
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>();
  const [profile, setProfile] = useState({
    username: "",
    website: "",
    avatar_url: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    getProfile();
  }, []);

  const getProfile = async () => {
    console.log("get");
    // await showLoading();
    setShowLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let { data, error, status } = await supabase
        .from("profiles")
        .select(`username, website, avatar_url`)
        .eq("id", user!.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }
      if (data != null) {
        setProfile({
          username: data.username,
          website: data.website,
          avatar_url: data.avatar_url,
        });
      }
    } catch (error: any) {
      showToast({ message: error.message, duration: 5000 });
    } finally {
      //   hideLoading();
      setShowLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/", "forward", "replace");
  };
  const updateProfile = async (e?: any, avatar_url: string = "") => {
    e?.preventDefault();

    console.log("update ");
    // await showLoading();
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
        <IonToolbar>
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
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
              <IonInput type="text" name="email" value={session?.user?.email} disabled/>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Phone</IonLabel>
              <IonInput type="text" name="phone" value={session?.user?.phone} disabled />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Name</IonLabel>
            <IonInput
              type="text"
              name="username"
              value={profile.username}
              onIonChange={(e) =>
                setProfile({ ...profile, username: e.detail.value ?? "" })
              }
            />
          </IonItem>

          <div className="ion-text-center">
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
      </IonContent>
    </IonPage>
  );
}

export default AccountPage;
