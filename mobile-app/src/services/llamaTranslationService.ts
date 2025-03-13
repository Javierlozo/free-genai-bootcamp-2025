import { TranslationService } from "./translationService";

// Import expo-file-system with error handling
let FileSystem: any = null;
try {
  FileSystem = require("expo-file-system");
} catch (error) {
  console.warn("Failed to import expo-file-system:", error);
}

// Import llama.rn
let Llama: any;
try {
  Llama = require("llama.rn").default;
} catch (error) {
  console.warn("Failed to import llama.rn:", error);
}

// Directory to store downloaded models (if FileSystem is available)
const MODELS_DIR = FileSystem ? `${FileSystem.documentDirectory}models/` : null;

// Model information
const TRANSLATION_MODEL = {
  name: "tiny-llama-2-1b-translation.gguf",
  url: "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
  size: "Q4_K_M", // Quantization level
};

export class LlamaTranslationService {
  private static llamaContext: any = null;
  private static isModelDownloaded = false;
  private static isInitializing = false;

  /**
   * Initialize the Llama model for translation
   */
  static async initialize(): Promise<boolean> {
    // If already initializing, wait for it to complete
    if (this.isInitializing) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isInitializing) {
            clearInterval(checkInterval);
            resolve(this.llamaContext !== null);
          }
        }, 100);
      });
    }

    // If already initialized, return true
    if (this.llamaContext !== null) {
      return true;
    }

    this.isInitializing = true;

    try {
      // Check if Llama and FileSystem are available
      if (!Llama) {
        console.warn("Llama.rn is not available");
        this.isInitializing = false;
        return false;
      }

      if (!FileSystem) {
        console.warn(
          "expo-file-system is not available, cannot download or access models"
        );
        this.isInitializing = false;
        return false;
      }

      // Ensure models directory exists
      await this.ensureModelDirectory();

      // Check if model is downloaded
      const modelPath = `${MODELS_DIR}${TRANSLATION_MODEL.name}`;
      this.isModelDownloaded = await this.checkModelExists(modelPath);

      // Download model if not already downloaded
      if (!this.isModelDownloaded) {
        console.log("Downloading translation model...");
        await this.downloadModel(
          TRANSLATION_MODEL.url,
          modelPath,
          "Translation Model"
        );
        this.isModelDownloaded = true;
      }

      // Initialize Llama context
      console.log("Initializing Llama context...");
      this.llamaContext = await Llama.createContext({
        model: modelPath,
        contextSize: 2048, // Adjust based on model requirements
        batchSize: 512,
        gpuLayers: 0, // Set to higher number to use GPU if available
      });

      console.log("Llama translation service initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Llama translation service:", error);
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Translate text using the Llama model
   */
  static async translateWithLlama(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    // Try dictionary first (for common words)
    const dictionaryTranslation = TranslationService.getDictionaryTranslation(
      text.toLowerCase().trim(),
      sourceLanguage,
      targetLanguage
    );

    if (dictionaryTranslation) {
      console.log("Using dictionary translation");
      return dictionaryTranslation;
    }

    // If FileSystem or Llama is not available, return original text with a note
    if (!FileSystem || !Llama) {
      console.warn("Llama translation unavailable: missing dependencies");
      return `${text} (translation unavailable - missing dependencies)`;
    }

    // If Llama is not available or initialization failed, return original text
    if (!(await this.initialize())) {
      console.warn("Llama translation unavailable, using original text");
      return `${text} (translation unavailable)`;
    }

    try {
      // Get language names for better prompting
      const sourceLangName = TranslationService.getLanguageName(sourceLanguage);
      const targetLangName = TranslationService.getLanguageName(targetLanguage);

      // Create a translation prompt
      const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. 
Only provide the translation without any additional text or explanation.

Text: "${text}"
Translation:`;

      // Generate translation
      const result = await Llama.completion(this.llamaContext, {
        prompt,
        maxTokens: 256,
        temperature: 0.1,
        topP: 0.9,
        stopPrompts: ["\n", "Text:", "Translation:"],
      });

      // Clean up the result
      let translation = result.trim();

      // Remove quotes if present
      if (
        (translation.startsWith('"') && translation.endsWith('"')) ||
        (translation.startsWith("'") && translation.endsWith("'"))
      ) {
        translation = translation.substring(1, translation.length - 1);
      }

      return translation || text;
    } catch (error) {
      console.error("Llama translation error:", error);
      return `${text} (translation error)`;
    }
  }

  /**
   * Ensure the models directory exists
   */
  private static async ensureModelDirectory(): Promise<void> {
    if (!FileSystem) {
      throw new Error("FileSystem is not available");
    }

    try {
      const dirInfo = await FileSystem.getInfoAsync(MODELS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(MODELS_DIR, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error("Failed to create models directory:", error);
      throw error;
    }
  }

  /**
   * Check if a model file exists
   */
  private static async checkModelExists(modelPath: string): Promise<boolean> {
    if (!FileSystem) {
      return false;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(modelPath);
      return fileInfo.exists;
    } catch (error) {
      console.error("Failed to check if model exists:", error);
      return false;
    }
  }

  /**
   * Download a model file
   */
  private static async downloadModel(
    url: string,
    destination: string,
    modelName: string
  ): Promise<void> {
    if (!FileSystem) {
      throw new Error("FileSystem is not available");
    }

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        destination,
        {},
        (downloadProgress: {
          totalBytesWritten: number;
          totalBytesExpectedToWrite: number;
        }) => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          console.log(
            `Downloading ${modelName}: ${Math.round(progress * 100)}%`
          );
        }
      );

      await downloadResumable.downloadAsync();
      console.log(`${modelName} downloaded successfully`);
    } catch (error) {
      console.error(`Failed to download ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  static async cleanup(): Promise<void> {
    if (this.llamaContext && Llama) {
      try {
        await Llama.releaseContext(this.llamaContext);
        this.llamaContext = null;
        console.log("Llama context released");
      } catch (error) {
        console.error("Failed to release Llama context:", error);
      }
    }
  }
}
