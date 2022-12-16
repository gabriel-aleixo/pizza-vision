import {
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import Feed from "../components/Feed";
import "./home.css";

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color={"primary"} >
          <IonTitle>
            PizzaVision
          </IonTitle>
        </IonToolbar>
      </IonHeader>
        <Feed />
    </IonPage>
  );
};

export default Home;
