import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonSegment,
  IonSegmentButton,
  IonCard,
} from "@ionic/react";
import { UserPhoto } from "../hooks/usePhotoGallery";
import { useContext, useEffect, useState } from "react";
import Context from "../Context";

import "./library.css";

const Library: React.FC = () => {
  const [segment, setSegment] = useState<string>("all");
  const { photos } = useContext(Context);
  const [libraryPhotos, setLibraryPhotos] = useState<UserPhoto[]>(photos);

  const PhotosElementProps = { photos: libraryPhotos };

  useEffect(() => {
    setLibraryPhotos(photos);
  }, [photos]);

  const filterPhotos = (segment: string) => {
    setSegment(segment);
    setLibraryPhotos(photos);
    if (segment === "all") return;
    const newLibraryPhotos = photos.filter((photo) => photo.flag === segment);
    setLibraryPhotos(newLibraryPhotos);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color={"primary"}>
          <IonSegment color={"secondary"} value={segment}>
            <IonSegmentButton onClick={() => filterPhotos("all")} value="all">
              All
            </IonSegmentButton>
            <IonSegmentButton onClick={() => filterPhotos("yes")} value="yes">
              👍
            </IonSegmentButton>
            <IonSegmentButton onClick={() => filterPhotos("no")} value="no">
              👎
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PhotosElement {...PhotosElementProps} />
      </IonContent>
    </IonPage>
  );
};

interface PhotosProps {
  photos: UserPhoto[];
}

const PhotosElement: React.FC<PhotosProps> = ({ photos }) => {
  return (
    <IonGrid className="ion-no-padding">
      <IonRow>
        {photos.map((photo, index) => (
          <IonCol key={index} size="6">
            <IonCard
              button
              routerLink={
                "/library/details/" +
                photo.filepath.substring(0, photo.filepath.lastIndexOf("."))
              }
            >
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
  );
};

export default Library;
