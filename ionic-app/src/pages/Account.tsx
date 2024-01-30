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
import { useEffect, useState, useContext } from "react";
import Context from "../Context";
import { supabase } from "../supabaseClient";
// import { Session } from "@supabase/gotrue-js/src/lib/types";

function AccountPage() {
  const [showToast] = useIonToast();
  const router = useIonRouter();
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const { session } = useContext(Context);
  // const [session, setSession] = useState<Session | null>();

  const [profile, setProfile] = useState({
    username: "",
    website: "",
    avatar_url: "",
  });

  useEffect(() => {
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   setSession(session);
    // });
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
        setShowLoading(false);
      }
    };

    getProfile();
  }, [showToast]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/", "forward", "replace");
  };
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
            <IonNote slot="helper">You can't change this at the moment</IonNote>
          </div>
          {/* <IonLabel position="stacked">Phone</IonLabel>
              <IonInput type="text" name="phone" value={session?.user?.phone} disabled /> */}
          <IonLabel position="stacked">Name</IonLabel>
          <IonInput
            type="text"
            name="username"
            value={profile.username}
            onIonChange={(e) =>
              setProfile({ ...profile, username: e.detail.value ?? "" })
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
