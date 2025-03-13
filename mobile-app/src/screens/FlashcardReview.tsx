import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useFlashcards } from "../hooks/useFlashcards";

type RootStackParamList = {
  Review: { flashcardId?: string };
};

type ReviewScreenRouteProp = RouteProp<RootStackParamList, "Review">;

const { width } = Dimensions.get("window");

export default function FlashcardReview() {
  const route = useRoute<ReviewScreenRouteProp>();
  const { flashcards, loading, error, updateReviewStatus } = useFlashcards();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWord, setShowWord] = useState(false);

  // If flashcardId is provided, start with that card
  useEffect(() => {
    if (route.params?.flashcardId) {
      const index = flashcards.findIndex(
        (card) => card.id === route.params.flashcardId
      );
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [route.params?.flashcardId, flashcards]);

  const currentCard = flashcards[currentIndex];

  const handleNext = async () => {
    if (currentCard) {
      try {
        await updateReviewStatus(currentCard.id);
      } catch (error) {
        console.error("Error updating review status:", error);
      }
    }

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowWord(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowWord(false);
    }
  };

  const toggleWord = () => {
    setShowWord(!showWord);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!currentCard || flashcards.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.completeText}>No flashcards available! 🤔</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentIndex + 1) / flashcards.length) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.imageGrid}>
          {currentCard.images.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.wordContainer}
          onPress={toggleWord}
          activeOpacity={0.8}
        >
          {showWord ? (
            <Text style={styles.word}>{currentCard.word}</Text>
          ) : (
            <Text style={styles.tapText}>Tap to reveal word</Text>
          )}
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Reviewed {currentCard.review_count} times
          </Text>
          <Text style={styles.statsText}>
            Last reviewed:{" "}
            {currentCard.last_reviewed
              ? new Date(currentCard.last_reviewed).toLocaleDateString()
              : "Never"}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, currentIndex === 0 && styles.buttonDisabled]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            currentIndex === flashcards.length - 1 && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          <Text style={styles.buttonText}>
            {currentIndex === flashcards.length - 1 ? "Complete" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
    textAlign: "center",
    padding: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#ddd",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6C63FF",
  },
  cardContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  image: {
    width: (width - 50) / 2,
    height: (width - 50) / 2,
    borderRadius: 10,
    backgroundColor: "#ddd",
  },
  wordContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  word: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  tapText: {
    fontSize: 16,
    color: "#666",
  },
  statsContainer: {
    marginTop: 15,
    alignItems: "center",
  },
  statsText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: "#6C63FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#B4B4B4",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  completeText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
    color: "#333",
  },
});
