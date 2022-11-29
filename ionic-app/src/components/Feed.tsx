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
import { camera, thumbsDown, thumbsUp } from "ionicons/icons";
import { usePhotoGallery, UserPhoto } from "../hooks/usePhotoGallery";
import "./Feed.css";

const Feed: React.FC = () => {
  const { photos, takePhoto, setFlag } = usePhotoGallery();
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
              <IonCardContent>Not rated yet.. Yes or no?</IonCardContent>
              <IonButton
                type="button"
                color="medium"
                size="large"
                fill="outline"
                data-flag="yes"
                onClick={(e) => setFlag(photo, e)}
              >
                👍
              </IonButton>
              <IonButton
                type="button"
                color="medium"
                size="large"
                fill="outline"
                data-flag="no"
                onClick={(e) => setFlag(photo, e)}
              >
                👎
              </IonButton>
            </>
          ) : (
            <IonCardTitle>
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
