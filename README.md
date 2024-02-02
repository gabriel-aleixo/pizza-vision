# PizzaVision

>I accidentally bought the same terrible frozen pizza brand twice 😖 and vowed never to let that happen again to me or anyone else! 🥶🍕🙌

## Introduction

PizzaVision is a cross-platform mobile app where you can snap pictures of product packages and tag them as either "👍" or "👎".

Forget if you've tried a product before? Just snap a pic of the packaging, and the app will search your photos and show similar ones you've had in the past.

**Download** [PizzaVision on the App Store](https://apps.apple.com/us/app/pizzavision/id1662732466)

**Live Demo** [PizzaVision Web App](https://pizzavision.onrender.com/)

(Android version to come)

## Description

With so many products in stores, frozen pizza stands out as one of the most cluttered category. They all look alike with Italian-sounding names and picturesque images, but few are worth their price.

How do we remember which ones we've liked and which to avoid?

Enter **PizzaVision**: snap a pic of the package, tag it "👍" or "👎", and never forget your preferences again.

## Motivation

As my final project for the [Harvard CS50x course](https://pll.harvard.edu/course/cs50-introduction-computer-science), I wanted to learn new technologies and hone my product developement skills, while tackling a meaningfull problem for society.

PizzaVision allowed me to learn new technologies, particularly mobile development and computer vision, by tackling a common problem: remembering product preferences.

While I had postpone the broader societal impact bits, I certainly solved my own problem!

## Installation

### Clone the repository

- ``git clone``
- ``cd pizza-vision\ionic-app``
- ``npm i``

### Supabase

You don't need to sign up for a Supabase account to run this code locally. Just run Supabase locally on your machine.

#### Run Supabase locally

- Install the [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started), along with Docker.
- Skip ``supabase init`` as the supabase folder is included.
- ``supabase start``
- add a .env file to the ionic-app folder with the following:
````
REACT_APP_SUPABASE_URL=http://localhost:54321
REACT_APP_SUPABASE_ANON_KEY=(the anon key displayed when you start Supabase)
````
- Open Supabase Studio on your localhost, go to "Storage" and add a bucket called "photos".

#### Deploy to Supabase platform

This project doesn't allow direct collaboration on backend code yet, but you can deploy to your own Supabase project.

More details [here](https://supabase.com/docs/guides/cli/local-development)

### Run the App

- ``npm run start`` from the ionic-app directory

## Tech Stack

### Frontend

- [Ionic](https://ionicframework.com/docs/react): mature framework with large community support.
- [Capacitor](https://capacitorjs.com/docs): cross-platform runtime for accessing mobile features.
- [React](https://react.dev/): popular library well integrated with Ionic.
- [@tensorflow/tfjs](https://www.tensorflow.org/js/tutorials/setup?hl=en) with [@tensorflow-models/mobilenet](https://www.npmjs.com/package/@tensorflow-models/mobilenet).

### Backend

- [Supabase](https://supabase.com/docs): relational database, Auth, object storage, basic CRUD API, realtime API.

## Features

- User authentication via one-time password with email.
- Basic user profile management.
- Snap pictures with the phone's camera.
- Upload directly from the camera or from the phone's photo library.
- Tag pictures as "👍" or "👎".
- View similar images ordered by degree of similarity.
- Library view ordered by date taken.
- Filter library by tags.
- Sync local images with cloud.

## TODO

- Improve performance of image processing.
- Implement infinite scroll on home feed.
- Add account management options.
- Image optimization.
- Library sharing.
- Automatically classify images using EfficientNet (predictions from MobileNet aren't accurate enough for our use case).
- Filter and reorder library view.

## References

- [Ionic Framework Docs](https://ionicframework.com/docs/react/your-first-app)
- [TensorFlow Models Mobilenet](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet)
- [Mobile Development with React Native or Ionic](https://blog.devgenius.io/mobile-development-with-react-native-or-ionic-a9ea855749f6)
- [Image Similarity with Deep Learning](https://towardsdatascience.com/image-similarity-with-deep-learning-c17d83068f59)
- [Supabase Docs](https://supabase.com/docs/guides/with-ionic-react)
- [Choosing a Data Storage Solution](https://ionic.io/blog/choosing-a-data-storage-solution-ionic-storage-capacitor-storage-sqlite-or-ionic-secure-storage)
