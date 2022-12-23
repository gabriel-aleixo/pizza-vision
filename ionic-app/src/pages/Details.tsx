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
  IonGrid,
  IonCol,
  IonRow,
  isPlatform,
} from "@ionic/react";
import Context from "../Context";
import { RouteComponentProps, useHistory } from "react-router";
import { usePhotoGallery, UserPhoto } from "../hooks/usePhotoGallery";
import { useMobileNet } from "../hooks/useMobileNet";
import { trash } from "ionicons/icons";

import "./Details.css";

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

  const tabname =
    match.url.split("/")[1].charAt(0).toUpperCase() +
    match.url.split("/")[1].slice(1);

  const filename = match.params.filename;
  // console.log("Match", match);

  const selectedPhoto: UserPhoto | undefined = photos.find(
    (photo) => photo.filepath === filename + ".jpeg"
  );

  // console.log("Selected Photo", selectedPhoto);

  const otherPhotos: UserPhoto[] = photos.filter(
    (photo) => photo.filepath !== filename + ".jpeg"
  );

  // const findPhoto = (photo: UserPhoto) => {
  //   return (
  //     photo.filepath.substring(photo.filepath.lastIndexOf("/")) ===
  //     `/${filename}.jpeg`
  //   );
  // };

  // if (isPlatform("hybrid")) {
  //   selectedPhoto = photos.find((photo) => findPhoto(photo));

  //   otherPhotos = photos.filter((photo) => findPhoto(photo));
  // } else {
    // selectedPhoto 
    // otherPhotos;
  // }

  interface SimilarPhoto extends UserPhoto {
    sim?: number;
  }

  let similarPhotos: SimilarPhoto[] = [];

  if (selectedPhoto && selectedPhoto.embeddings && otherPhotos !== undefined) {

    similarPhotos = otherPhotos.map((photo) => {
      let sim: number = cosineSimilarity(
        selectedPhoto?.embeddings,
        photo.embeddings
      );
      let photoWithSim: SimilarPhoto = photo;
      photoWithSim.sim = sim;
      return photoWithSim;
    });
  }

  const filterSimPhotos = (photo: SimilarPhoto) => {
    if (photo.sim && photo.sim > 0.6) {
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
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <IonTitle>{tabname} | Detail</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {selectedPhoto !== undefined ? (
          <>
            <IonImg
              className="detail-main-image"
              src={selectedPhoto.webviewPath}
            />
            <IonGrid className="detail-buttons">
              <IonRow>
                <IonCol>
                  <IonButton
                    color={
                      selectedPhoto.flag === null
                        ? "light"
                        : selectedPhoto.flag === "yes"
                        ? "secondary"
                        : "light"
                    }
                    data-flag="yes"
                    onClick={(e) => setFlag(selectedPhoto, e)}
                  >
                    👍
                  </IonButton>
                </IonCol>
                <IonCol>
                  <IonButton
                    color={
                      selectedPhoto.flag === null
                        ? "light"
                        : selectedPhoto.flag === "no"
                        ? "secondary"
                        : "light"
                    }
                    data-flag="no"
                    onClick={(e) => setFlag(selectedPhoto, e)}
                  >
                    👎
                  </IonButton>
                </IonCol>
                <IonCol>
                  <IonButton
                    color={selectedPhoto.flag === null ? "secondary" : "light"}
                    data-flag=""
                    onClick={(e) => setFlag(selectedPhoto, e)}
                  >
                    🤷
                  </IonButton>
                </IonCol>
                <IonCol>
                  <IonButton
                    color="light"
                    onClick={() => setPhotoToDelete(selectedPhoto)}
                  >
                    <IonIcon color="danger" icon={trash} />
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </>
        ) : (
          <></>
        )}
        <IonList className="ion-padding">
          <IonListHeader>
            <h2>Similar Images</h2>
          </IonListHeader>
          {filteredSimPhotos.length > 0 ? (
            <IonGrid>
              <IonRow>
                {filteredSimPhotos.map((photo, index) => (
                  <IonCol key={index} size="6">
                    <IonCard className="detail-card">
                      <IonImg src={photo.webviewPath} />
                      {!photo.flag ? (
                        <>
                          <h2 className="photo-flag-small">🤷</h2>
                        </>
                      ) : (
                        <h2 className="photo-flag-small">
                          {photo.flag === "yes" ? <>👍</> : <>👎</>}
                        </h2>
                      )}
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
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
              handler: async () => {
                if (photoToDelete) {
                  await deletePhoto(photoToDelete);
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
