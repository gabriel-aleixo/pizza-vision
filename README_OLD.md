# PizzaVision

> I bought the same terible brand of frozen pizza twice 😖 and vouched to never let that happen again to me or anyone else!  🥶🍕🙌

## Introduction

PizzaVision is a mobile app that lets you take pictures of the packages of the products you buy, and tag them as either "👍" or "👎".

The next time you are in the store and can't remember if you already had or liked a certain product - a surprisingly common problem! - just take snapshot of the packaging and the app will search all your product photos and show the similar ones you had in the past.

### Video Demo: [PizzaVision Video Demo](https://youtu.be/UvWqgWUDMGE)

### Live Demo: [pizzavision.onrender.com](https://pizzavision.onrender.com/)

## Description

There are way too many products in the grocery store, but few categories are more cluttered than frozen pizza. They all look the same, with  Italian-sounding names,  nice pictures of red ripe tomatoes, fresh basil, and melted cheese.

Despite their nice appearance, very few frozen pizzas are worth their price! We know good frozen pizza from bad frozen pizza when we eat it, right?

How can we remember and keep track of the ones we bought before and liked, versus the ones we should stay away from?

**I built PizzaVision to solve this existential problem in my life.**

You simply take a snapshot of a pizza or any other product's packaging and select "👍" or "👎" to indicate whether you would buy it again or not.

The next time you're in the supermarket, and you can't remember if you had that particular product before, just take a snapshot of the package and the app will show you all the similar products you had, which ones were "Yesses", and which ones were "Nos".

## Motivation

This is my final project for the Harvard CS50x course. I wanted to build something that would allow me to learn and use new technologies, go through all the step of planning, designing and building a product, and at the same, tackle a consequential and meaningful challenge affecting the lives of millions of people.

I succeeded in my goal of learning new tools and skills. The part about the consequential challenge had to be postponed for a future project. But hey, I solved my problem!

## Installation

### Clone the repository

- ``git clone``
- ``cd pizza-vision\ionic-app``
- ``npm i``

### Supabase

You don't need to sign-up for a supabase account to run this code locally. You just need to run the Supabase service locally on your machine

#### Run Supabase locally

- Install the [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started). Note that you'll need to run Docker locally as well.
- Do not run ``supabase init`` as the supabase folder is already included in this repository
- ``supabase start``

#### Deploy to the Supabase platform
At the moment, this project is not set-up to allow for direct collaboration on the backend code. You can still deploy to a project you control on Supabase:
- If you haven't used Supabase before, go to [supabase.com](https://supabase.com) and sign up for a free account
- Create a new project in your account called "pizza-vision" or any other name you like
- ``supabase login``
- ``supabase link`` and chose the project you created

More details [here](https://supabase.com/docs/guides/cli/local-development)

### Run the App

- ``npm run start`` from the ionic-app directory

## Tech Stack

### Frontend

- [Ionic](https://ionicframework.com/docs/react): cross-platform mature framework, large community support, many available plugins to interact with mobile platform features, built-in UI components, familiar development experience using HTML, CSS, JavaScript
- [Capacitor](https://capacitorjs.com/docs): the cross-platform runtime on top of which the Ionic app runs. Capacitor is mainly providing access to filesystem, camera and localstorage for the app
- [React](https://react.dev/): well supported and well integrated with Ionic, extremely mature and popular library
- [@tensorflow/tfjs](https://www.tensorflow.org/js/tutorials/setup?hl=en) with the [@tensorflow-models/mobilenet](https://www.npmjs.com/package/@tensorflow-models/mobilenet) for the computer vision bits. [Mobilenet](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet) is a small, low-latency and low-power model that can extract embeddings and and provide image classification. It is particularly adapted for use in mobile apps, and it is providing image vectors in this app, which are used to calculate image similarity.
- Thanks to this simple Cosine Similarity function by [Tomer Gabbai](https://gist.github.com/tomericco/14b5ceac90d6eed6f9ba6cb5305f8fab), we predict image similarity on the fly. In the future, it would be straightforward to let the user select the sensitivity of the similarity results they see.

### Backend

- [Supabase](https://supabase.com/docs): relational database (PostgreSQL), Auth, object storage, basic CRUD API, realtime API. Very easy to set-up, has a growing community, based on open source software, built-in strong row-level security, free tier available. I'm also leveraging Supabase Storage to sync the user's pictures to the cloud. This way, if the user uninstalls the app, the data is kept in the cloud and can be used in a new install.

## Features

- User authentication via one time password with email
- Basic user profile management (name, delete account request)
- Take pictures with the phone's camera
- Upload picture from the phone's photo library
- Tag a picture as 👍 or 👎
- Tap an existing picture to change its tag or remove from the library
- Display all similar images for the selected picture. Results are ordered by image similarity
- Libray view ordered by date taken
- Filter library by 👍 and 👎 tags
- Sync local images with cloud

## TODO

- Implement infinite scroll on the home feed
- Add account management options: change email, delete account
- Image optimization
- Library sharing, allowing users to see and add to a common library. Useful when more than one person in the household does the grocery shopping (i.e. useful for me and my wife :))
- Automatically tag images using Mobilenet's classification capability
- Filter and re-order library view

## References

- https://ionicframework.com/docs/react/your-first-app
- https://github.com/tensorflow/tfjs-models/tree/master/mobilenet
- https://blog.devgenius.io/mobile-development-with-react-native-or-ionic-a9ea855749f6
- https://towardsdatascience.com/image-similarity-with-deep-learning-c17d83068f59
- https://supabase.com/docs/guides/with-ionic-react
- https://ionic.io/blog/choosing-a-data-storage-solution-ionic-storage-capacitor-storage-sqlite-or-ionic-secure-storage
