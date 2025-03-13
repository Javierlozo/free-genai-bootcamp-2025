import OpenAI from "openai";
import { EXPO_PUBLIC_OPENAI_API_KEY } from "@env";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for React Native
});

interface GeneratedImage {
  url: string;
  revised_prompt?: string;
}

export class ImageGenerationService {
  // Placeholder images to use when API limit is reached
  private static placeholderImages = [
    "https://via.placeholder.com/1024x1024?text=Image+1",
    "https://via.placeholder.com/1024x1024?text=Image+2",
    "https://via.placeholder.com/1024x1024?text=Image+3",
    "https://via.placeholder.com/1024x1024?text=Image+4",
  ];

  /**
   * Generates multiple images for a given word using DALL-E
   * @param word The word to generate images for
   * @param count Number of images to generate (default: 4)
   * @param onProgress Optional callback to report progress (0-100)
   * @returns Array of image URLs
   */
  static async generateImages(
    word: string,
    count: number = 4,
    onProgress?: (progress: number) => void
  ): Promise<string[]> {
    if (!EXPO_PUBLIC_OPENAI_API_KEY) {
      console.warn(
        "OpenAI API key is not configured, using placeholder images"
      );
      return this.getPlaceholderImages(count, onProgress, word);
    }

    try {
      const prompt = this.generatePrompt(word);
      const allUrls: string[] = [];

      // DALL-E 3 only supports n=1, so we need to make multiple requests
      // to generate multiple images
      for (let i = 0; i < count; i++) {
        // Report progress if callback is provided
        if (onProgress) {
          const progressPercent = Math.round((i / count) * 100);
          onProgress(progressPercent);
        }

        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1, // DALL-E 3 only supports n=1
          size: "1024x1024",
          quality: "standard",
          style: "natural",
        });

        const url = response.data[0]?.url;
        if (url) {
          allUrls.push(url);
        }
      }

      // Report 100% progress when done
      if (onProgress) {
        onProgress(100);
      }

      return this.validateImages(allUrls);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error generating images:", error.message);

        // Check if the error is related to billing limits
        if (
          error.message.includes("Billing") ||
          error.message.includes("limit")
        ) {
          console.warn("API billing limit reached, using placeholder images");
          return this.getPlaceholderImages(count, onProgress, word);
        }

        throw new Error(`Failed to generate images: ${error.message}`);
      }
      throw new Error("Failed to generate images");
    }
  }

  /**
   * Get placeholder images when API is unavailable
   * @param word The word to include in the placeholder
   * @param count Number of images to return
   * @param onProgress Optional progress callback
   * @returns Array of placeholder image URLs
   */
  private static getPlaceholderImages(
    count: number,
    onProgress?: (progress: number) => void,
    word: string = "Image"
  ): Promise<string[]> {
    return new Promise((resolve) => {
      // Simulate API delay for better UX
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        if (onProgress) {
          onProgress(Math.min(progress, 100));
        }
        if (progress >= 100) {
          clearInterval(interval);

          // Use Picsum Photos for reliable placeholder images
          // Each call will use a different random seed for variety
          const placeholders = [];
          for (let i = 0; i < count; i++) {
            // Use a combination of word and index to create a unique seed
            const seed = Math.floor(Math.random() * 1000);

            // Primary option: Picsum Photos
            const picsumUrl = `https://picsum.photos/seed/${seed}/1024/1024`;

            // Fallback options in case Picsum fails
            const fallbackUrls = [
              // Unsplash Source
              `https://source.unsplash.com/random/1024x1024?${encodeURIComponent(
                word
              )}`,
              // Placeholder.com (less reliable)
              `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(
                word
              )}`,
              // Absolute fallback - static color
              `https://dummyimage.com/1024x1024/3498db/ffffff&text=${encodeURIComponent(
                word
              )}`,
            ];

            // Use Picsum as primary, but include fallbacks in the image object
            placeholders.push(picsumUrl);
          }

          resolve(placeholders);
        }
      }, 500);
    });
  }

  /**
   * Generates a more specific prompt for the image generation
   * @param word The base word to generate a prompt for
   * @returns Enhanced prompt for better image generation
   */
  private static generatePrompt(word: string): string {
    // Add context and specificity to the prompt based on the word
    const basePrompts = {
      // Common categories and their prompt templates
      action: `Clear visualization of someone ${word} in a simple, educational style`,
      object: `Clear, centered image of a ${word} on a simple background`,
      animal: `Friendly, clear illustration of a ${word} in its natural habitat`,
      emotion: `Clear facial expression showing ${word} emotion`,
      place: `Simple, recognizable view of a ${word}`,
      // Default to a generic template
      default: `Clear, simple visualization of "${word}" in a minimalist style`,
    };

    // TODO: Implement word categorization logic
    // For now, return the default prompt
    return basePrompts.default;
  }

  /**
   * Validates and processes the generated images
   * @param urls Array of generated image URLs
   * @returns Processed and validated image URLs
   */
  private static validateImages(urls: string[]): string[] {
    // Remove any invalid or empty URLs
    return urls.filter((url: string) => {
      try {
        return url && new URL(url);
      } catch {
        return false;
      }
    });
  }
}
