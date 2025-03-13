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
  /**
   * Generates multiple images for a given word using DALL-E
   * @param word The word to generate images for
   * @param count Number of images to generate (default: 4)
   * @returns Array of image URLs
   */
  static async generateImages(
    word: string,
    count: number = 4
  ): Promise<string[]> {
    if (!EXPO_PUBLIC_OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    try {
      const prompt = this.generatePrompt(word);

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: count,
        size: "1024x1024",
        quality: "standard",
        style: "natural",
      });

      const urls = response.data
        .map((image) => image.url)
        .filter((url): url is string => typeof url === "string");

      return this.validateImages(urls);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error generating images:", error.message);
        throw new Error(`Failed to generate images: ${error.message}`);
      }
      throw new Error("Failed to generate images");
    }
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
