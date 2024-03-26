import { Redirect, Route } from "react-router-dom";
import { useEffect, useContext } from "react";
import { supabase } from "./services/supabaseClient";
// import { Session } from "@supabase/gotrue-js/src/lib/types"
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonLoading,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { images, person, pizza } from "ionicons/icons";
import { ReactComponent as Logo } from "./assets/pizzavision-logo.svg";
import Home from "./pages/Home";
import Library from "./pages/Library";
import LoginPage from "./pages/Login";
import VerifyPage from "./pages/Verify";
import AccountPage from "./pages/Account";
import Details from "./pages/Details";
import Context from "./Context";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useUserProfile } from "./hooks/useUserProfile";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
// import "./theme/custom-tab-bar.css";
import "./theme/custom-ui-components.css";

setupIonicReact();

const App: React.FC = () => {
  // const [session, setSession] = useState<Session | null>();

  const { session, dispatch } = useContext(Context);
  const { getProfile } = useUserProfile();

  useEffect(() => {

    const loadUserData = async () => {
      if (session === null) {
        try {
          console.log("Retrieve session");
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) throw error;

          dispatch({
            type: "SET_STATE",
            state: {
              session: session,
              user: session?.user,
            },
          });
          console.log("Session set");
        } catch (error) {
          console.error(error);
        }
      }

      if (session) {
        try {
          console.log("retrieve profile");
          const [profile, error] = await getProfile(session);

          if (error) throw error;

          if (profile) {
            dispatch({
              type: "SET_STATE",
              state: {
                profile: profile,
              },
            });
            console.log("Profile set");
          }
        } catch (error) {
          console.error(error);
        }
      }
    };
    loadUserData();

    supabase.auth.onAuthStateChange((event, session) => {
      console.log("State change", event);
      dispatch({
        type: "SET_STATE",
        state: { session: session, isLoadingSession: false },
      });
    });
  }, [dispatch, getProfile, session]);

  return (
    <IonApp>
      <IonReactRouter>
        <Route path="/login" component={LoginPage} />
        <Route path="/login/verify" component={VerifyPage} />
        <ProtectedRoute path="/" component={ProtectedRoutes} />
        <Route path="*">
          <Redirect to="/login" />
        </Route>
      </IonReactRouter>
    </IonApp>
  );
};

const ProtectedRoutes: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <ProtectedRoute exact path="/library" component={Library} />
        <ProtectedRoute path="/library/details/:filename" component={Details} />
        <ProtectedRoute exact path="/feed" component={Home} />
        <ProtectedRoute path="/feed/details/:filename" component={Details} />
        <ProtectedRoute path="/account" component={AccountPage} />
      </IonRouterOutlet>
      <IonTabBar slot="bottom" color={"primary"}>
        <IonTabButton tab="tab2" href="/library">
          <IonIcon icon={images} />
          <IonLabel>Libary</IonLabel>
        </IonTabButton>
        <IonTabButton tab="tab1" href="/feed">
          <IonIcon icon={pizza} />
          <IonLabel>Feed</IonLabel>
        </IonTabButton>
        <IonTabButton tab="tab3" href="/account">
          <IonIcon icon={person} />
          <IonLabel>Account</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default App;
