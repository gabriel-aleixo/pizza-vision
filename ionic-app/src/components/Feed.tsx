import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { camera } from "ionicons/icons";
import { useContext } from "react";
import { usePhotoGallery } from "../hooks/usePhotoGallery";
import Context from "../Context";
import "./Feed.css";

const Feed: React.FC = () => {
  const { takePhoto } = usePhotoGallery();
  const { photos } = useContext(Context);

  photos.sort(
    (a, b) =>
      parseInt(b.filepath.substring(0, b.filepath.lastIndexOf("."))) -
      parseInt(a.filepath.substring(0, a.filepath.lastIndexOf(".")))
  );

  return (
    <>
      {photos.map((photo, index) => (
        <IonCard
          button
          key={index}
          routerLink={
            "/feed/details/" +
            photo.filepath.substring(0, photo.filepath.lastIndexOf("."))
          }
        >
          <IonImg src={photo.webviewPath} />
          {!photo.flag ? (
            <>
              <IonCardTitle className="ion-padding">
                Not rated yet...
              </IonCardTitle>
            </>
          ) : (
            <IonCardTitle className="ion-padding">
              {photo.flag === "yes" ? <>👍</> : <>👎</>}
            </IonCardTitle>
          )}
        </IonCard>
      ))}
      <IonFab vertical="bottom" horizontal="center" slot="fixed">
        <IonFabButton onClick={() => takePhoto()}>
          <IonIcon icon={camera}></IonIcon>
        </IonFabButton>
      </IonFab>
    </>
  );
};

export default Feed;
