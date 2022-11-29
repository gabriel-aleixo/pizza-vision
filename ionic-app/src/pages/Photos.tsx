import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonActionSheet,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { camera, trash, close } from "ionicons/icons";
import { usePhotoGallery, UserPhoto } from "../hooks/usePhotoGallery";
import { useState } from "react";

import "./Tab2.css";

const Photos: React.FC = () => {

  const [photoToDelete, setPhotoToDelete] = useState<UserPhoto>();

  const { photos, deletePhoto } = usePhotoGallery();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonSegment value="all">
            <IonSegmentButton value="all">
              All
            </IonSegmentButton>
            <IonSegmentButton value="yes">
              👍
            </IonSegmentButton>
            <IonSegmentButton value="no">
              👎
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid>
          <IonRow>
            {photos.map((photo, index) => (
              <IonCol size="6" key={index}>
                <IonImg
                src={photo.webviewPath}
                onClick={() => setPhotoToDelete(photo)}
                />
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
        <IonActionSheet
        isOpen={!!photoToDelete}
        buttons={[
          {
            text: 'Delete',
            role: 'destructive',
            icon: trash,
            handler: () => {
              if (photoToDelete) {
                deletePhoto(photoToDelete);
                setPhotoToDelete(undefined);
              }
            }
          },
          {
            text: 'Cancel',
            icon: close,
            role: 'cancel',
          }
        ]}
        onDidDismiss={() => setPhotoToDelete(undefined)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Photos;
