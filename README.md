# PizzaYah9 (name is WIP)

*We bought the same bad frozen pizza twice...* 😖

*Never again!* 🥶🍕🙌

## Introduction
PizzaYeah9 is a mobile app that lets you take pictures of the packages of the frozen pizza you eat, and tag them as either "Yah" or "Nein".

The next time you are buying frozen pizza and you can't remember if you already had or liked that particular type - a surprisingly common problem! - just take snapshot of the box and the app will show you if you tagged it in the past.

### Video Demo: [PizzaYah9 demo (soon)](https://)

### Description

There are way too many varieties of frozen pizza in your average grocery store. They usually all look the same, with their italian-sounding names, their nice pictures of red ripe tomatoes, fresh basil, and melted cheese.

However, they most certainly do not taste the same! We know good frozen pizza from bad frozen pizza when we eat it, right?

But how can we remember and keep track of the ones we bought before and liked, versus the ones we should steer away from?

To solve this fundamental problem, I'm building this app.

You simply take a snapshot of a pizza's box and select "Yah" or "Nein" (same as "Yes" or "No", but different) to indicate whether you would buy it again or not.

The next time you're in the supermarket, and you can't remember if you had that particular forzen pizza before, just take a snapshot of the package and the app will show you all the similar pizzas you had, which were Yesses, and which were Noes.

### Background

This is my final project for the Harvard CS50x course I took this year. I wanted to build something that would allow me to learn and use new technologies, go through all the step of planning, designing and building a product, and at the same, tackle a consequential and meaningful challenge affecting the lives of many people.

That last part ended up meaning tackling a funny and silly problem affecting the lives of at least two people, my wife and I. But that seems good enough for me!

#### So many frozen pizzas 😨

For a while now, we have been trying differe

#### Scrambling through imperfect methods

Shared Google Photos album, Notion page...

## Installation

TODO

## Specifications

### Tech Stack

#### Frontend

- Ionic: cross-platform mature framework, large community support, many available plugins to interact with mobile platform features, UI components built in, familiar development experience using HTML, CSS and JavaScript.
- React: well supported and integrated with Ionic, extremely mature and popular.

#### Backend

- Supabase: relational database (PostgreSQL), Auth, object storage, basic CRUD API, realtime API (which is really cool). Very easy to set-up, growing community, based on open source software, strong row-level security built-in, free tier available.
- REST API to run Computer Vision tasks using Python, Flask or FastAPI (TBD). Python has a bunch of CV and ML librarires to make it easier to analyze the images


#### Hosting
- Probably Render https://render.com/pricing


### Features
- User authentication via Magic Link or - better yet - one time password with phone number
- Basic user profile management (name, update email, update phone number)
- Take pictures with your phone's camera
- Upload picture from your phone's photo library
- Search the user's picture catalog for similar images. Results ordered by image similarity
- Tag a picture as "Yah"👍 or "Nein"👎
- Tap an existing picture to change its tag or remove from catalog
- Gallery view ordered by date taken or by image similarity
- Filter catalog by 👍 / 👎 tags

## TODO

Everything...

Plus:
- [ ] How to maintain a local copy of all the users' images to avoid load them via the network each time they are needed
    - https://ionicframework.com/docs/react/your-first-app/saving-photos
- [ ] Design a data structure to save the similarity results, so that the algorithms need to be run only once, when a photo is taken. Otherwiser, it will be too slow to use
    - Something like similarity[i][j], but will depend on how I implement the gallery and what type of pointers to the files are stored


## FAQs
TODO

## References
- https://blog.devgenius.io/mobile-development-with-react-native-or-ionic-a9ea855749f6
- https://www.youtube.com/c/DigitalSreeni/search?query=ORB
- https://supabase.com/docs/guides/with-ionic-react
### Reading list
- https://ionic.io/blog/choosing-a-data-storage-solution-ionic-storage-capacitor-storage-sqlite-or-ionic-secure-storage