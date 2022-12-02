import React, { useState, useContext } from "react";
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
import Context from "../Context";
import { RouteComponentProps, useHistory } from "react-router";
import { usePhotoGallery, UserPhoto } from "../hooks/usePhotoGallery";
import { useMobileNet } from "../hooks/useMobileNet";
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
  const { deletePhoto, setFlag } = usePhotoGallery();
  const { cosineSimilarity } = useMobileNet();
  const { photos } = useContext(Context);

  const [photoToDelete, setPhotoToDelete] = useState<UserPhoto>();

  const history = useHistory();

  const tabname = match.url.split("/")[1].charAt(0).toUpperCase() +  match.url.split("/")[1].slice(1);

  const filename = match.params.filename;

  const selectedPhoto = photos.find(
    (photo) => photo.filepath === filename + ".jpeg"
  );

  const otherPhotos = photos.filter(
    (photo) => photo.filepath !== filename + ".jpeg"
  );

  interface SimilarPhoto extends UserPhoto {
    sim?: number;
  }

  let similarPhotos: SimilarPhoto[] = [];

  if (selectedPhoto && selectedPhoto.embeddings != undefined) {
    similarPhotos = otherPhotos.map((photo) => {
      let sim: number = cosineSimilarity(
        selectedPhoto.embeddings,
        photo.embeddings
      );
      let photoWithSim: SimilarPhoto = photo;
      photoWithSim.sim = sim;
      return photoWithSim;
    });
  }

  const filterSimPhotos = (photo: SimilarPhoto) => {
    if (photo.sim && photo.sim > 0.6) {
      console.log(photo.sim)
      return true;
    }
    return false;
  };

  const filteredSimPhotos = similarPhotos.filter(filterSimPhotos);

  filteredSimPhotos.sort((a, b) => {
    if (a.sim && b.sim) {
      if (a.sim > b.sim) {
        return -1;
      } else if (a.sim < b.sim) {
        return 1;
      }
      return 0;
    }
    return 0;
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <IonTitle>{tabname} | Detail</IonTitle>
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
              <IonItem shape="round" lines="none">
                <IonButton
                  color="medium"
                  fill="outline"
                  size="large"
                  data-flag="yes"
                  onClick={(e) => setFlag(selectedPhoto, e)}
                >
                  👍
                </IonButton>
                <IonButton
                  color="medium"
                  fill="outline"
                  size="large"
                  data-flag="no"
                  onClick={(e) => setFlag(selectedPhoto, e)}
                >
                  👎
                </IonButton>
                <IonButton
                  color="medium"
                  fill="outline"
                  size="large"
                  data-flag=""
                  onClick={(e) => setFlag(selectedPhoto, e)}
                >
                  🤷
                </IonButton>
                <IonButton
                  color="danger"
                  fill="outline"
                  size="large"
                  onClick={() => setPhotoToDelete(selectedPhoto)}
                >
                  <IonIcon icon={trash} />
                </IonButton>
              </IonItem>{" "}
            </>
          ) : selectedPhoto.flag === "yes" ? (
            <>
              <IonImg src={selectedPhoto.webviewPath} />
              <IonItem shape="round" lines="none" color="success">
                <IonLabel>It's a YES</IonLabel>
                <IonIcon icon={thumbsUp} size="large" slot="end" />
              </IonItem>
              <IonItem shape="round" lines="none">
                <IonButton
                  color="medium"
                  fill="outline"
                  size="large"
                  data-flag="yes"
                  onClick={(e) => setFlag(selectedPhoto, e)}
                >
                  👍
                </IonButton>
                <IonButton
                  color="medium"
                  fill="outline"
                  size="large"
                  data-flag="no"
                  onClick={(e) => setFlag(selectedPhoto, e)}
                >
                  👎
                </IonButton>
                <IonButton
                  color="medium"
                  fill="outline"
                  size="large"
                  data-flag=""
                  onClick={(e) => setFlag(selectedPhoto, e)}
                >
                  🤷
                </IonButton>
                <IonButton
                  color="danger"
                  fill="outline"
                  size="large"
                  onClick={() => setPhotoToDelete(selectedPhoto)}
                >
                  <IonIcon icon={trash} />
                </IonButton>
              </IonItem>{" "}
            </>
          ) : (
            <>
              <IonImg src={selectedPhoto.webviewPath} />
              <IonItem shape="round" lines="none" color="danger">
                <IonLabel>It's a NO</IonLabel>
                <IonIcon icon={thumbsDown} size="large" slot="end" />
              </IonItem>
              <IonItem shape="round" lines="none">
                <IonButton
                  color="medium"
                  fill="outline"
                  size="large"
                  data-flag="yes"
                  onClick={(e) => setFlag(selectedPhoto, e)}
                >
                  👍
                </IonButton>
                <IonButton
                  color="medium"
                  fill="outline"
                  size="large"
                  data-flag="no"
                  onClick={(e) => setFlag(selectedPhoto, e)}
                >
                  👎
                </IonButton>
                <IonButton
                  color="medium"
                  fill="outline"
                  size="large"
                  data-flag=""
                  onClick={(e) => setFlag(selectedPhoto, e)}
                >
                  🤷
                </IonButton>
                <IonButton
                  color="danger"
                  fill="outline"
                  size="large"
                  onClick={() => setPhotoToDelete(selectedPhoto)}
                >
                  <IonIcon icon={trash} />
                </IonButton>
              </IonItem>{" "}
            </>
          )
        ) : (
          <></>
        )}
        <IonList className="ion-padding">
          <IonListHeader>
            <IonLabel>Similar Images</IonLabel>
          </IonListHeader>
          {filteredSimPhotos.length > 0 ? (
            filteredSimPhotos.map((photo, index) => (
              <IonCard key={index}>
                <IonImg src={photo.webviewPath} />
              </IonCard>
            ))
          ) : (
            <IonItem lines="none">
              <IonLabel>nothing to see here...</IonLabel>
            </IonItem>
          )}
        </IonList>

        <IonActionSheet
          isOpen={!!photoToDelete}
          header="This cannot be undone"
          buttons={[
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
