import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Modal,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFlashcards } from "../hooks/useFlashcards";
import { ImageGenerationService } from "../services/imageGenerationService";
import { TranslationService } from "../services/translationService";
import LanguageSelector from "../components/LanguageSelector";

export default function FlashcardCreator() {
  const navigation = useNavigation();
  const { createFlashcard } = useFlashcards();
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState<string | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [loading, setLoading] = useState(false);
  const [loadingOperation, setLoadingOperation] = useState<
    "generating" | "saving" | "translating"
  >("generating");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [usingPlaceholders, setUsingPlaceholders] = useState(false);
  const [loadingImages, setLoadingImages] = useState<boolean[]>([]);
  const [usingDictionaryTranslation, setUsingDictionaryTranslation] =
    useState(false);
  const [useLlama, setUseLlama] = useState(false);

  // Add a fallback image URL to use if an image fails to load
  const fallbackImageUrl =
    "https://dummyimage.com/1024x1024/cccccc/ffffff&text=Image";

  // Remove the auto-translate effect
  // Instead, we'll translate only when the user clicks the translate button
  // or when they generate images
  useEffect(() => {
    // Only reset translation when languages change
    if (sourceLanguage === targetLanguage) {
      setTranslation(null);
    }
  }, [sourceLanguage, targetLanguage]);

  // Update TranslationService when useLlama changes
  useEffect(() => {
    TranslationService.enableLlama(useLlama);
  }, [useLlama]);

  const translateWord = async () => {
    if (!word.trim() || sourceLanguage === targetLanguage) return;

    setLoadingOperation("translating");
    setLoading(true);
    setUsingDictionaryTranslation(false);
    try {
      const translatedWord = await TranslationService.translateWord(
        word.trim(),
        sourceLanguage,
        targetLanguage
      );

      // Check if we're using a dictionary fallback
      if (translatedWord.includes("(translation unavailable)")) {
        setUsingDictionaryTranslation(true);
      }

      setTranslation(translatedWord);
    } catch (error) {
      console.error("Translation error:", error);
      // Don't show alert for translation errors, just log them
    } finally {
      setLoading(false);
    }
  };

  const generateImages = async () => {
    if (!word.trim()) return;

    // If we haven't translated yet and languages are different, translate first
    if (!translation && sourceLanguage !== targetLanguage) {
      await translateWord();
    }

    setLoadingOperation("generating");
    setLoading(true);
    setGenerationProgress(0);
    setUsingPlaceholders(false);
    try {
      // Use the ImageGenerationService to generate real images
      // Only request 2 images to reduce wait time
      const generatedImages = await ImageGenerationService.generateImages(
        word.trim(),
        2, // Reduced from default 4 to 2 for faster generation
        (progress) => setGenerationProgress(progress)
      );

      // Check if we're using placeholder images (now using picsum.photos)
      if (generatedImages.some((url) => url.includes("picsum.photos"))) {
        setUsingPlaceholders(true);
      }

      setImages(generatedImages);
      // Initialize all images as loading
      setLoadingImages(generatedImages.map(() => true));
    } catch (error) {
      Alert.alert("Error", "Failed to generate images. Please try again.");
      console.error("Error generating images:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveFlashcard = async () => {
    if (!word.trim() || images.length === 0) return;

    try {
      setLoadingOperation("saving");
      setLoading(true);
      await createFlashcard(
        word.trim(),
        images,
        sourceLanguage,
        targetLanguage,
        translation
      );
      Alert.alert("Success", "Flashcard saved successfully!", [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save flashcard. Please try again.");
      console.error("Error saving flashcard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle image loading errors
  const handleImageError = (index: number) => {
    // Create a new array with the fallback image at the specified index
    const newImages = [...images];
    newImages[index] = fallbackImageUrl;
    setImages(newImages);

    // Mark this image as no longer loading
    const newLoadingImages = [...loadingImages];
    newLoadingImages[index] = false;
    setLoadingImages(newLoadingImages);
  };

  // Handle image load success
  const handleImageLoad = (index: number) => {
    // Mark this image as no longer loading
    const newLoadingImages = [...loadingImages];
    newLoadingImages[index] = false;
    setLoadingImages(newLoadingImages);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Loading Modal Overlay */}
      <Modal visible={loading} transparent={true} animationType="fade">
        <View style={styles.loaderContainer}>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loaderText}>
              {loadingOperation === "generating"
                ? `Generating images... ${generationProgress}%`
                : loadingOperation === "translating"
                ? "Translating..."
                : "Saving flashcard..."}
            </Text>
            {loadingOperation === "generating" && (
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${generationProgress}%` },
                  ]}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        {/* Language Selectors */}
        <View style={styles.languageContainer}>
          <LanguageSelector
            selectedLanguage={sourceLanguage}
            onSelectLanguage={setSourceLanguage}
            label="Source Language"
          />
          <LanguageSelector
            selectedLanguage={targetLanguage}
            onSelectLanguage={setTargetLanguage}
            label="Target Language"
          />
        </View>

        {/* Llama Toggle */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleHeader}>
            <Text style={styles.toggleLabel}>Use Llama for translations:</Text>
            <Switch
              value={useLlama}
              onValueChange={setUseLlama}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={useLlama ? "#6C63FF" : "#f4f3f4"}
            />
          </View>

          {useLlama && (
            <View style={styles.llamaInfoContainer}>
              <Text style={styles.llamaNote}>
                Using local Llama model for translations
              </Text>
              <Text style={styles.llamaDescription}>
                • First use will download a small model (~500MB){"\n"}•
                Translations work offline after download{"\n"}• No API quota
                limits{"\n"}• Slower than cloud API but more reliable
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.label}>Enter a word or phrase:</Text>
        <TextInput
          style={styles.input}
          value={word}
          onChangeText={setWord}
          placeholder="e.g., 'mountain' or 'running'"
          placeholderTextColor="#999"
        />

        {sourceLanguage !== targetLanguage && (
          <View style={styles.translationSection}>
            {translation ? (
              <View style={styles.translationContainer}>
                <Text style={styles.translationLabel}>Translation:</Text>
                <Text style={styles.translationText}>{translation}</Text>

                {usingDictionaryTranslation && (
                  <Text style={styles.dictionaryNotice}>
                    Using offline dictionary due to API limits.
                  </Text>
                )}

                {useLlama && !usingDictionaryTranslation && translation && (
                  <Text style={styles.llamaTranslationNotice}>
                    Translated using local Llama model.
                  </Text>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.translateButton,
                  !word.trim() && styles.buttonDisabled,
                ]}
                onPress={translateWord}
                disabled={!word.trim() || loading}
              >
                <Text style={styles.buttonText}>Translate</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            !word.trim() && styles.buttonDisabled,
            styles.generateButton,
          ]}
          onPress={generateImages}
          disabled={!word.trim() || loading}
        >
          <Text style={styles.buttonText}>Generate Images</Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.subtitle}>Generated Images:</Text>

            {usingPlaceholders && (
              <View style={styles.placeholderNotice}>
                <Text style={styles.placeholderText}>
                  Using placeholder images due to API usage limits.
                </Text>
              </View>
            )}

            <View style={styles.imageGrid}>
              {images.map((url, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image
                    source={{ uri: url }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={() => handleImageError(index)}
                    onLoad={() => handleImageLoad(index)}
                  />
                  {loadingImages[index] && (
                    <ActivityIndicator
                      style={styles.imageLoader}
                      color="#6C63FF"
                    />
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveFlashcard}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Save Flashcard</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#6C63FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    backgroundColor: "#B4B4B4",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  imagesContainer: {
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  imageContainer: {
    width: "48%",
    height: 150,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  imageLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    marginTop: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  loaderContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  progressBarContainer: {
    width: "100%",
    height: 10,
    backgroundColor: "#ddd",
    borderRadius: 5,
    marginTop: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#6C63FF",
    borderRadius: 5,
  },
  placeholderNotice: {
    backgroundColor: "#FFF9C4",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#FBC02D",
  },
  placeholderText: {
    color: "#5D4037",
    fontSize: 14,
  },
  languageContainer: {
    marginBottom: 15,
  },
  translationContainer: {
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#6C63FF",
  },
  translationLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 5,
  },
  translationText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  translationSection: {
    marginBottom: 20,
  },
  translateButton: {
    backgroundColor: "#4A90E2",
  },
  generateButton: {
    marginTop: 10,
  },
  dictionaryNotice: {
    fontSize: 12,
    color: "#FF9800",
    marginTop: 5,
    fontStyle: "italic",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  toggleHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 10,
    flex: 1,
  },
  llamaInfoContainer: {
    marginLeft: 10,
  },
  llamaNote: {
    fontSize: 12,
    color: "#6C63FF",
    marginBottom: 5,
  },
  llamaDescription: {
    fontSize: 12,
    color: "#666",
  },
  llamaTranslationNotice: {
    fontSize: 12,
    color: "#6C63FF",
    marginTop: 5,
    fontStyle: "italic",
  },
});
