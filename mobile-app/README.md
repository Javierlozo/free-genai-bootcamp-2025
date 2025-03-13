# Visual Flashcard Immersion App

A mobile application that helps users learn new words through AI-generated imagery. The app creates multiple visual representations of words to enhance memory retention and understanding.

## Features

- Create flashcards with AI-generated images for any word
- Review flashcards with spaced repetition
- Track learning progress
- Organize flashcards into sets

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, Mac only)

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/visual-flashcard-app.git
cd visual-flashcard-app
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
```

Then edit the `.env` file and add your:

- Supabase URL and anonymous key
- OpenAI API key

### Running the app

```bash
# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS (Mac only)
npm run ios
```

## Technologies Used

- React Native
- Expo
- Supabase (for database)
- OpenAI DALL-E (for image generation)

## License

MIT
