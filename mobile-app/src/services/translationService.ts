import OpenAI from "openai";
import { EXPO_PUBLIC_OPENAI_API_KEY } from "@env";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for React Native
});

// Import LlamaTranslationService (with lazy loading to avoid circular dependencies)
let LlamaTranslationService: any = null;
const getLlamaService = async () => {
  if (!LlamaTranslationService) {
    try {
      // Use require instead of dynamic import to avoid TypeScript module issues
      LlamaTranslationService =
        require("./llamaTranslationService").LlamaTranslationService;
    } catch (error) {
      console.warn("Failed to import LlamaTranslationService:", error);
    }
  }
  return LlamaTranslationService;
};

// Basic dictionary for common words in different languages
// This serves as a fallback when the API is unavailable
const translationDictionary: Record<
  string,
  Record<string, Record<string, string>>
> = {
  en: {
    es: {
      hello: "hola",
      goodbye: "adiós",
      "thank you": "gracias",
      please: "por favor",
      yes: "sí",
      no: "no",
      water: "agua",
      food: "comida",
      house: "casa",
      car: "coche",
      book: "libro",
      dog: "perro",
      cat: "gato",
      friend: "amigo",
      family: "familia",
      love: "amor",
      time: "tiempo",
      day: "día",
      night: "noche",
      good: "bueno",
      bad: "malo",
      big: "grande",
      small: "pequeño",
    },
    fr: {
      hello: "bonjour",
      goodbye: "au revoir",
      "thank you": "merci",
      please: "s'il vous plaît",
      yes: "oui",
      no: "non",
      water: "eau",
      food: "nourriture",
      house: "maison",
      car: "voiture",
      book: "livre",
      dog: "chien",
      cat: "chat",
      friend: "ami",
      family: "famille",
      love: "amour",
      time: "temps",
      day: "jour",
      night: "nuit",
      good: "bon",
      bad: "mauvais",
      big: "grand",
      small: "petit",
    },
    de: {
      hello: "hallo",
      goodbye: "auf wiedersehen",
      "thank you": "danke",
      please: "bitte",
      yes: "ja",
      no: "nein",
      water: "wasser",
      food: "essen",
      house: "haus",
      car: "auto",
      book: "buch",
      dog: "hund",
      cat: "katze",
      friend: "freund",
      family: "familie",
      love: "liebe",
      time: "zeit",
      day: "tag",
      night: "nacht",
      good: "gut",
      bad: "schlecht",
      big: "groß",
      small: "klein",
    },
  },
};

export class TranslationService {
  // Flag to indicate if we should use Llama for translations
  private static useLlama = false;

  /**
   * Translates a word from source language to target language
   * @param word The word to translate
   * @param sourceLanguage The source language code (e.g., 'en', 'es')
   * @param targetLanguage The target language code
   * @returns The translated word
   */
  static async translateWord(
    word: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    // If source and target are the same, return the original word
    if (sourceLanguage === targetLanguage) {
      return word;
    }

    // Try dictionary-based translation first for common words
    const dictionaryTranslation = this.getDictionaryTranslation(
      word.toLowerCase().trim(),
      sourceLanguage,
      targetLanguage
    );

    // If we have a dictionary translation, use it
    if (dictionaryTranslation) {
      console.log("Using dictionary translation");
      return dictionaryTranslation;
    }

    // If Llama is enabled, use it instead of OpenAI
    if (this.useLlama) {
      const llamaService = await getLlamaService();
      if (llamaService) {
        console.log("Using Llama for translation");
        return llamaService.translateWithLlama(
          word,
          sourceLanguage,
          targetLanguage
        );
      }
    }

    // If no API key or API key is invalid, try to use Llama
    if (!EXPO_PUBLIC_OPENAI_API_KEY) {
      console.warn("OpenAI API key is not configured, trying Llama");

      const llamaService = await getLlamaService();
      if (llamaService) {
        return llamaService.translateWithLlama(
          word,
          sourceLanguage,
          targetLanguage
        );
      }

      return word; // Return original if Llama is not available
    }

    try {
      // Get language names for better prompting
      const sourceLangName = this.getLanguageName(sourceLanguage);
      const targetLangName = this.getLanguageName(targetLanguage);

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the given word from ${sourceLangName} to ${targetLangName}. Provide only the translated word without any additional text or explanation.`,
          },
          {
            role: "user",
            content: word,
          },
        ],
        temperature: 0.3,
        max_tokens: 50,
      });

      const translation = response.choices[0]?.message?.content?.trim();
      return translation || word;
    } catch (error) {
      console.error("Translation error:", error);

      // Check if the error is related to quota or API limits
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("quota") ||
        errorMessage.includes("429") ||
        errorMessage.includes("limit")
      ) {
        console.warn("API quota exceeded, trying Llama translation");

        // Enable Llama for future translations to avoid hitting the quota again
        this.useLlama = true;

        // Try Llama translation
        const llamaService = await getLlamaService();
        if (llamaService) {
          return llamaService.translateWithLlama(
            word,
            sourceLanguage,
            targetLanguage
          );
        }

        // If Llama is not available, use dictionary fallback
        if (dictionaryTranslation) {
          return dictionaryTranslation;
        }

        // Otherwise, return the original word with a note
        return `${word} (translation unavailable)`;
      }

      return word; // Return original word for other errors
    }
  }

  /**
   * Get a translation from the dictionary if available
   */
  static getDictionaryTranslation(
    word: string,
    sourceLanguage: string,
    targetLanguage: string
  ): string | null {
    // Check if we have translations for this language pair
    if (
      translationDictionary[sourceLanguage] &&
      translationDictionary[sourceLanguage][targetLanguage] &&
      translationDictionary[sourceLanguage][targetLanguage][word]
    ) {
      return translationDictionary[sourceLanguage][targetLanguage][word];
    }

    // Try the reverse direction with some language pairs
    if (
      translationDictionary[targetLanguage] &&
      translationDictionary[targetLanguage][sourceLanguage]
    ) {
      // Find the key by value
      const reverseDict = translationDictionary[targetLanguage][sourceLanguage];
      for (const [key, value] of Object.entries(reverseDict)) {
        if (value.toLowerCase() === word) {
          return key;
        }
      }
    }

    return null;
  }

  /**
   * Get the full language name from a language code
   * @param languageCode The ISO language code (e.g., 'en', 'es')
   * @returns The full language name
   */
  static getLanguageName(languageCode: string): string {
    const languageMap: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      ru: "Russian",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
    };

    return languageMap[languageCode] || languageCode;
  }

  /**
   * Enable or disable Llama for translations
   * @param enable Whether to enable Llama
   */
  static enableLlama(enable: boolean): void {
    this.useLlama = enable;
  }
}
