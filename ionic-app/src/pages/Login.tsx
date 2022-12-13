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
import { Redirect } from "react-router";
import { usePhotoGallery } from "../hooks/usePhotoGallery";

function LoginPage() {
  const { dispatch, session, isEnterOtp } = useContext(Context);
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
      {isLoading ? (
        <IonContent>
          <IonSpinner></IonSpinner>
        </IonContent>
      ) : isEnterOtp ? (
        <OtpField />
      ) : (
        <LoginField />
      )}
    </IonPage>
  );
}

function LoginField() {
  const [showLoading, hideLoading] = useIonLoading();
  const [showToast] = useIonToast();
  const { dispatch, email } = useContext(Context);

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
    dispatch({ type: "SET_STATE", state: { isEnterOtp: true } });
    await hideLoading();
    return;
  };

  return (
    <IonContent>
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
            <IonButton type="submit">Next</IonButton>
          </div>
        </form>
        <div className="ion-text-center">
          <IonButton
            color="medium"
            fill="clear"
            type="button"
            onClick={() =>
              dispatch({ type: "SET_STATE", state: { isEnterOtp: true } })
            }
          >
            I already have a code
          </IonButton>
        </div>
      </IonList>
    </IonContent>
  );
}

function OtpField() {
  const [otp, setOtp] = useState("");
  const [showLoading, hideLoading] = useIonLoading();
  const [showToast] = useIonToast();
  const { dispatch, email } = useContext(Context);

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await showLoading();

    // Link example
    // console.log("Verification", email, otp);
    let { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: "magiclink",
    });
    if (error) {
      console.log(error);
      await showToast({
        message: error.message,
        duration: 3000,
      });
      setOtp("");
      await hideLoading();
      return;
    }
    setOtp("");
    dispatch({
      type: "SET_STATE",
      state: { user: data.user, session: data.session, isEnterOtp: false },
    });
    await hideLoading();
  };

  return (
    <IonContent>
      <div className="ion-padding">
        <h1>Login</h1>
        <p>Please enter the code you received via email</p>
      </div>
      <IonList inset={true}>
        <form onSubmit={handleVerifyOtp}>
          <IonItem>
            <IonLabel position="stacked">Code</IonLabel>
            <IonInput
              required
              value={otp}
              name="otp"
              onIonChange={(e) => setOtp(e.detail.value ?? "")}
              type="text"
            />
          </IonItem>
          <div className="ion-text-center">
            <IonButton type="submit">Login</IonButton>
          </div>
        </form>
        <div className="ion-text-center">
          <IonButton
            color="medium"
            fill="clear"
            type="button"
            onClick={() =>
              dispatch({ type: "SET_STATE", state: { isEnterOtp: false, email:"" } })
            }
          >
            Cancel
          </IonButton>
        </div>
      </IonList>
    </IonContent>
  );
}

export default LoginPage;
