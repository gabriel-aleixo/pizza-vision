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
    const filterPhotos = (segment: string) => {
      setSegment(segment);
      setLibraryPhotos(photos);
      if (segment === "all") return;
      const newLibraryPhotos = photos.filter((photo) => photo.flag === segment);
      setLibraryPhotos(newLibraryPhotos);
    };

    filterPhotos(segment);
  }, [photos, segment]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color={"primary"}>
          <IonSegment color={"secondary"} value={segment}>
            <IonSegmentButton onClick={() => setSegment("all")} value="all">
              All
            </IonSegmentButton>
            <IonSegmentButton onClick={() => setSegment("yes")} value="yes">
              👍
            </IonSegmentButton>
            <IonSegmentButton onClick={() => setSegment("no")} value="no">
              👎
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {!photos.length ? (
          <div className="ion-padding">
            <p>Take your first photo by going to the Feed tab</p>
            </div>
        ) : (
          <PhotosElement {...PhotosElementProps} />
        )}
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
