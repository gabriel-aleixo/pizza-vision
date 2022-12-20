import {
  IonCard,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonGrid,
  IonIcon,
  IonImg,
  IonLoading,
  IonRow,
} from "@ionic/react";
import { camera } from "ionicons/icons";
import { createRef, useContext } from "react";
import { usePhotoGallery } from "../hooks/usePhotoGallery";
import Context from "../Context";
import "./Feed.css";

const Feed: React.FC = () => {
  const { takePhoto } = usePhotoGallery();
  const { photos, isLoadingData } = useContext(Context);
  const feedContentRef = createRef<HTMLIonContentElement>();

  photos.sort(
    (a, b) =>
      parseInt(b.filepath.substring(0, b.filepath.lastIndexOf("."))) -
      parseInt(a.filepath.substring(0, a.filepath.lastIndexOf(".")))
  );

  return (
    <IonContent fullscreen ref={feedContentRef}>
      <IonLoading
        isOpen={isLoadingData}
        // duration={100}
        // onDidDismiss={() => setShowLoading(false)}
        message={"Loading pictures..."}
      />

      <IonGrid>
        <IonRow>
          {photos.map((photo, index) => (
            <IonCol size="12" key={index}>
              <IonCard
                className="photo-card"
                button
                routerLink={
                  "/feed/details/" +
                  photo.filepath.substring(0, photo.filepath.lastIndexOf("."))
                }
              >
                <IonImg src={photo.webviewPath} />
                {!photo.flag ? (
                  <>
                    <h2 className="photo-flag">🤷</h2>
                  </>
                ) : (
                  <h2 className="photo-flag">
                    {photo.flag === "yes" ? <>👍</> : <>👎</>}
                  </h2>
                )}
              </IonCard>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid>

      <IonFab vertical="bottom" horizontal="center" slot="fixed">
        <IonFabButton
          color="secondary"
          onClick={() => {
            takePhoto();
            feedContentRef.current?.scrollToTop(500);
          }}
        >
          <IonIcon icon={camera}></IonIcon>
        </IonFabButton>
      </IonFab>
    </IonContent>
  );
};

export default Feed;
