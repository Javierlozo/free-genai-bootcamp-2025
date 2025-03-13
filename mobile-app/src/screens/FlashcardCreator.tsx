import React, { useState } from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFlashcards } from "../hooks/useFlashcards";

export default function FlashcardCreator() {
  const navigation = useNavigation();
  const { createFlashcard } = useFlashcards();
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const generateImages = async () => {
    if (!word.trim()) return;

    setLoading(true);
    try {
      // TODO: Implement image generation API call
      // This is where we'll integrate with DALL-E or similar
      // For now, we'll use placeholder images
      const mockImages = [
        "https://via.placeholder.com/300",
        "https://via.placeholder.com/300",
        "https://via.placeholder.com/300",
        "https://via.placeholder.com/300",
      ];
      setImages(mockImages);
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
      setLoading(true);
      await createFlashcard(word.trim(), images);
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Enter a word or phrase:</Text>
        <TextInput
          style={styles.input}
          value={word}
          onChangeText={setWord}
          placeholder="e.g., 'mountain' or 'running'"
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.button, !word.trim() && styles.buttonDisabled]}
          onPress={generateImages}
          disabled={!word.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Generate Images</Text>
          )}
        </TouchableOpacity>

        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.subtitle}>Generated Images:</Text>
            <View style={styles.imageGrid}>
              {images.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveFlashcard}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Save Flashcard</Text>
              )}
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
  image: {
    width: "48%",
    height: 150,
    borderRadius: 10,
    backgroundColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    marginTop: 10,
  },
});
