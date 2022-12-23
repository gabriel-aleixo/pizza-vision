import { useState, useContext, useEffect } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonLabel,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonToast,
  useIonLoading,
  IonButtons,
  IonBackButton,
  IonNote,
} from "@ionic/react";
import { supabase } from "../supabaseClient";
import Context from "../Context";
import { Redirect, useHistory } from "react-router";
// import { usePhotoGallery } from "../hooks/usePhotoGallery";

// Styles
import "./Verify.css";

function VerifyPage() {
  const { dispatch, session, email, photos } = useContext(Context);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const history = useHistory();

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

  const handleCancel = () => {
    dispatch({
      type: "SET_STATE",
      state: { email: "" },
    });
    history.replace("/login");
  };

  if (session) {
    return <Redirect to="/feed" />;
  }

  if (email === "") {
    return <Redirect to="/login" />;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color={"primary"}>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <IonTitle>PizzaVision</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {isLoading ? <IonSpinner /> : <OtpField />}
        <div className="ion-text-center ion-padding">
          <IonButton
          color={"warning"}
            type="button"
            expand="block"
            onClick={() => handleCancel()}
          >
            Cancel
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
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
      state: { user: data.user, session: data.session },
    });
    await hideLoading();
  };

  return (
    <>
      <div className="ion-padding">
        <h1>Login</h1>
        <p>Now enter the code we sent you via email.</p>
        <p>If you haven't received it yet, give it a minute and check you spam folder.</p>
      </div>
      <form className="ion-padding" onSubmit={handleVerifyOtp}>
        <IonLabel position="stacked">Code*</IonLabel>
        <IonInput
        className="ion-text-center"
        clearInput={true}
        placeholder="_ _ _ _ _ _"
          required
          value={otp}
          name="otp"
          onIonChange={(e) => setOtp(e.detail.value ?? "")}
          type="number"
        />
        <IonNote slot="helper">*It's a 6 numbers code, and it's required</IonNote>
        <div className="ion-text-center ion-padding-top">
          <IonButton expand="block" type="submit">
            Login
          </IonButton>
        </div>
      </form>
    </>
  );
}

export default VerifyPage;
