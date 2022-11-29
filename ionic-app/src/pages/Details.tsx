import React, { useState } from "react";
import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonPage,
  IonToolbar,
  IonTitle,
  IonContent,
  IonImg,
  IonIcon,
  IonButton,
  IonActionSheet,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonCard,
} from "@ionic/react";
import { RouteComponentProps, useHistory } from "react-router";
import { usePhotoGallery, UserPhoto } from "../hooks/usePhotoGallery";
import {
  close,
  ellipsisHorizontal,
  thumbsDown,
  thumbsUp,
  trash,
} from "ionicons/icons";

interface DetailsProps
  extends RouteComponentProps<{
    filename: string;
  }> {}

const Details: React.FC<DetailsProps> = ({ match }) => {
  const { photos, deletePhoto } = usePhotoGallery();

  const [photoToDelete, setPhotoToDelete] = useState<UserPhoto>();

  const history = useHistory()

  const filename = match.params.filename;
  const selectedPhoto = photos.find(
    (photo) => photo.filepath === filename + ".jpeg"
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/feed" />
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={() => setPhotoToDelete(selectedPhoto)}>
              <IonIcon icon={ellipsisHorizontal} />
            </IonButton>
          </IonButtons>
          <IonTitle>Detail</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {selectedPhoto ? (
          selectedPhoto.flag == null ? (
            <>
              <IonImg src={selectedPhoto.webviewPath} />
              <IonItem shape="round" lines="none" color="medium">
                <IonLabel>Not rated yet</IonLabel>
              </IonItem>
            </>
          ) : selectedPhoto.flag === "yes" ? (
            <>
              <IonImg src={selectedPhoto.webviewPath} />
              <IonItem shape="round" lines="none" color="success">
                <IonLabel>It's a YES</IonLabel>
                <IonIcon icon={thumbsUp} size="large" slot="end" />
              </IonItem>
            </>
          ) : (
            <>
              <IonImg src={selectedPhoto.webviewPath} />
              <IonItem shape="round" lines="none" color="danger">
                <IonLabel>It's a NO</IonLabel>
                <IonIcon icon={thumbsDown} size="large" slot="end" />
              </IonItem>
            </>
          )
        ) : (
          <></>
        )}
        <IonList className="ion-padding">
          <IonListHeader>
            <IonLabel>Similar Images</IonLabel>
          </IonListHeader>
          {photos.map((photo, index) => (
            <IonCard key={index}>
              <IonImg src={photo.webviewPath} />
            </IonCard>
          ))}
        </IonList>

        <IonActionSheet
          isOpen={!!photoToDelete}
          header="Select an option"
          buttons={[
            {
              text: "Clear 👍 👎 ",
            },
            {
              text: "Delete",
              role: "destructive",
              handler: () => {
                if (photoToDelete) {
                  deletePhoto(photoToDelete);
                  setPhotoToDelete(undefined);
                  history.goBack();
                }
              },
            },
            {
              text: "Cancel",
              role: "cancel",
            },
          ]}
          onDidDismiss={() => setPhotoToDelete(undefined)}
        ></IonActionSheet>
      </IonContent>
    </IonPage>
  );
};

export default Details;
