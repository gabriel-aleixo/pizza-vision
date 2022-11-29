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
  IonTitle,
  IonToolbar,
  useIonToast,
  useIonLoading,
} from "@ionic/react";
import { supabase } from "../supabaseClient";
import Context from "../Context";
import { Redirect } from "react-router";

function LoginPage() {
  const { dispatch, session, isEnterOtp } = useContext(Context);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({ type: "SET_STATE", state: { session: session } });
    });

    supabase.auth.onAuthStateChange((event, session) => {
      console.log(event);
      dispatch({ type: "SET_STATE", state: { session: session } });
    });
  }, [dispatch]);

  if (session) {
    return <Redirect to="/feed" />;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>PizzaYah9!</IonTitle>
        </IonToolbar>
      </IonHeader>
      {isEnterOtp ? <OtpField /> : <LoginField />}
    </IonPage>
  );
}

function LoginField() {
  const [showLoading, hideLoading] = useIonLoading();
  const [showToast] = useIonToast();
  const { dispatch, phone } = useContext(Context);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log();
    e.preventDefault();
    await showLoading();
    const { data, error } = await supabase.auth.signInWithOtp({ phone: phone });
    if (error) {
      await showToast({
        message: error.message,
        duration: 5000,
      });
    }
    dispatch({ type: "SET_STATE", state: { isEnterOtp: true } });
    await hideLoading();
  };
  return (
    <IonContent>
      <div className="ion-padding">
        <h1>Login</h1>
        <p>Enter your email to receive the sign in code</p>
      </div>
      <IonList inset={true}>
        <form onSubmit={handleLogin}>
          <IonItem>
            <IonLabel position="stacked">Phone</IonLabel>
            <IonInput
              value={phone}
              name="phone"
              onIonChange={(e) =>
                dispatch({
                  type: "SET_STATE",
                  state: { phone: e.detail.value ?? "" },
                })
              }
              type="tel"
            />
          </IonItem>
          <div className="ion-text-center">
            <IonButton type="submit">Next</IonButton>
          </div>
        </form>
      </IonList>
    </IonContent>
  );
}

function OtpField() {
  const [otp, setOtp] = useState("");
  const [showLoading, hideLoading] = useIonLoading();
  const [showToast] = useIonToast();
  const { dispatch, phone } = useContext(Context);

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await showLoading();

    // Link example
    console.log("Verification", phone, otp);
    let { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: "sms",
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
      <div className="ion-Padding">
        <h1>Login</h1>
        <p>Please enter the code you received via email</p>
      </div>
      <IonList inset={true}>
        <form onSubmit={handleVerifyOtp}>
          <IonItem>
            <IonLabel position="stacked">Code</IonLabel>
            <IonInput
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
      </IonList>
    </IonContent>
  );
}

export default LoginPage;
