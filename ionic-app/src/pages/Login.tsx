import { useState, useContext, useEffect } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonToast,
  useIonLoading,
  IonButtons,
} from "@ionic/react";
import { supabase } from "../supabaseClient";
import Context from "../Context";
import { Redirect, useHistory } from "react-router";
import { usePhotoGallery } from "../hooks/usePhotoGallery";

function LoginPage() {
  const { dispatch, session } = useContext(Context);
  const { photos } = usePhotoGallery();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({ type: "SET_STATE", state: { session: session } });
    });

    supabase.auth.onAuthStateChange((event, session) => {
      console.log(event);
      dispatch({ type: "SET_STATE", state: { session: session } });
    });

    dispatch({ type: "SET_STATE", state: { photos: photos } });
    setIsLoading(false);
  }, [dispatch]);

  if (session) {
    return <Redirect to="/feed" />;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>PizzaVision</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {isLoading ? <IonSpinner />: <LoginField />}
      </IonContent>
    </IonPage>
  );
}

function LoginField() {
  const [showLoading, hideLoading] = useIonLoading();
  const [showToast] = useIonToast();
  const { dispatch, email } = useContext(Context);

  const history = useHistory();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log();
    e.preventDefault();
    await showLoading();
    const { data, error } = await supabase.auth.signInWithOtp({ email: email });
    if (error) {
      await showToast({
        message: error.message,
        duration: 3000,
      });
      await hideLoading();
      return;
    }
    await hideLoading();
    history.push("/login/verify");
    return;
  };

  return (
    <>
      <div className="ion-padding">
        <h1>Login</h1>
        <p>Enter your email to receive a code to sign in</p>
      </div>
      <IonList inset={true}>
        <form onSubmit={handleLogin}>
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput
              value={email}
              name="email"
              onIonChange={(e) =>
                dispatch({
                  type: "SET_STATE",
                  state: { email: e.detail.value ?? "" },
                })
              }
              type="email"
              required
            />
          </IonItem>
          <div className="ion-text-center">
            <IonButton expand="block" type="submit">Next</IonButton>
          </div>
        </form>
      </IonList>
    </>
  );
}

export default LoginPage;
