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
  IonList,
  IonItem,
  IonIcon,
  IonAccordionGroup,
  IonAccordion,
  IonLabel,
} from "@ionic/react";
import { UserPhoto } from "../hooks/usePhotoGallery";
import { useContext, useEffect, useState } from "react";
import Context from "../Context";

import "./library.css";
import { chevronDownOutline, chevronForwardOutline } from "ionicons/icons";
import React from "react";

const Library: React.FC = () => {
  const [segment, setSegment] = useState<string>("all");
  const { photos, profile } = useContext(Context);
  const [libraryPhotos, setLibraryPhotos] = useState<UserPhoto[]>(photos);
  const [libraries, setLibraries] = useState([
    { name: "My Photos", photos: photos, expanded: true },
    { name: "Another User", photos: photos, expanded: true },
  ]);


  // Toggle library's expanded state
  const toggleLib = (libIndex: number) => {
    const newLibs = libraries.map((lib, index) => {
      if (index === libIndex) {
        return { ...lib, expanded: !lib.expanded };
      }
      return lib;
    });
    setLibraries(newLibs);
  };



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
          <IonSegment value={segment}>
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

        <IonList>
          {libraries.map((library, index) => (
            <React.Fragment key={index}>
              <IonItem button detail={false} onClick={() => toggleLib(index)}>
                {library.name}
                <IonIcon
                  slot="start"
                  icon={
                    library.expanded ? chevronDownOutline : chevronForwardOutline
                  }
                />
              </IonItem>
              {library.expanded && <PhotosElement {...PhotosElementProps} />}
            </React.Fragment>
          ))}
        </IonList>
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
