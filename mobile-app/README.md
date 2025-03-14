# Visual Flashcard Immersion App

A mobile application that helps users learn new words through AI-generated imagery. The app creates multiple visual representations of words to enhance memory retention and understanding, with support for multiple languages.

## Features

- **AI-Powered Image Generation**: Create flashcards with DALL-E 3 generated images for any word or phrase
- **Multi-Language Support**: Learn vocabulary in 10+ languages with automatic translation
- **Graceful Fallbacks**: Automatically switches to placeholder images when API limits are reached
- **Visual Learning**: Multiple images per word to enhance memory retention
- **Progress Tracking**: Review flashcards with spaced repetition system
- **Organized Learning**: Group flashcards into sets for focused study
- **Offline Access**: Review previously created flashcards without internet connection
- **Language Filtering**: Filter flashcards by source or target language

## Implementation Details

### Image Generation

- Uses OpenAI's DALL-E 3 API to generate contextually relevant images for words
- Implements sequential image generation with progress tracking
- Provides graceful fallbacks to placeholder images when API limits are reached
- Handles image loading errors with fallback mechanisms

### Language Learning

- Supports 10+ languages including English, Spanish, French, German, and more
- Automatic translation using OpenAI's GPT-3.5 model
- Bidirectional learning (learn any language from any language)
- Visual association between words and images across languages

### User Experience

- Real-time progress indicators during image generation
- Smooth loading transitions with activity indicators
- Clear notifications when using placeholder images
- Responsive design for various screen sizes
- Intuitive language selection interface

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

## API Usage Notes

The app uses OpenAI's APIs which have the following limitations:

- DALL-E 3 only supports generating one image per API call
- API usage is subject to billing limits
- When limits are reached, the app automatically switches to placeholder images
- Translation uses GPT-3.5 Turbo for efficient and accurate translations

## Technologies Used

- **Frontend**: React Native, Expo
- **Backend**: Supabase (for database and authentication)
- **AI**: OpenAI DALL-E 3 (for image generation), GPT-3.5 (for translation)
- **Storage**: Supabase Storage (for saving flashcard data)

## Future Improvements

- Implement word categorization for better prompt generation
- Add pronunciation guides and audio
- Enhance spaced repetition algorithm
- Implement offline image caching
- Add export/import functionality for flashcard sets
- Support for idioms and phrases with contextual explanations

## License

MIT
