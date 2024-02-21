import { useState, useContext, useEffect } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonToast,
  useIonLoading,
  IonNote,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonItem,
  IonCard,
} from "@ionic/react";
import { supabase } from "../services/supabaseClient";
import Context from "../Context";
import { Redirect, useHistory } from "react-router";

// Styles
import "./Login.css";

function LoginPage() {
  const { dispatch, session, isLoadingSession } = useContext(Context);
  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({
        type: "SET_STATE",
        state: { session: session, isLoadingSession: false },
      });
    });

    supabase.auth.onAuthStateChange((event, session) => {
      // console.log(event);
      dispatch({
        type: "SET_STATE",
        state: { session: session, isLoadingSession: false },
      });
    });
  }, [dispatch]);

  if (isLoadingSession) {
    return <></>;
  }

  if (session) {
    return <Redirect to="/feed" />;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color={"primary"}>
          <IonTitle>PizzaVision</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <LoginField />
      </IonContent>
    </IonPage>
  );
}

function LoginField() {
  const [showLoading, hideLoading] = useIonLoading();
  const [showToast] = useIonToast();
  const { dispatch, signinEmail } = useContext(Context);

  const history = useHistory();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await showLoading();
    const { data, error } = await supabase.auth.signInWithOtp({
      email: signinEmail,
    });
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
    <IonCard color={"light"}>
      <IonCardHeader>
        <IonCardTitle>Login</IonCardTitle>
        <IonCardSubtitle>
          First, enter the email you want to use to sign-in
        </IonCardSubtitle>
      </IonCardHeader>
      <IonCardContent>

          <form className="ion-padding" onSubmit={handleLogin}>
         <IonItem lines="full" color={"light"}>           
            <IonLabel position="stacked">Email*</IonLabel>
            <IonInput
              clearInput={true}
              value={signinEmail}
              name="email"
              onIonChange={(e) =>
                dispatch({
                  type: "SET_STATE",
                  state: { signinEmail: e.detail.value ?? "" },
                })
              }
              type="email"
              required
            />
            <IonNote slot="helper">*Required</IonNote>
        </IonItem>            
              <IonButton expand="full" type="submit">
                Next
              </IonButton>
          </form>
      </IonCardContent>
    </IonCard>
  );
}

export default LoginPage;
