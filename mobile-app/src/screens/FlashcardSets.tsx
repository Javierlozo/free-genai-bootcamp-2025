import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFlashcards } from "../hooks/useFlashcards";
import LanguageSelector, {
  SUPPORTED_LANGUAGES,
} from "../components/LanguageSelector";

type RootStackParamList = {
  Review: { flashcardId: string };
  Sets: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FlashcardSets() {
  const navigation = useNavigation<NavigationProp>();
  const { flashcards, loading, error, deleteFlashcard, refreshFlashcards } =
    useFlashcards();
  const [sourceLanguageFilter, setSourceLanguageFilter] = useState<
    string | null
  >(null);
  const [targetLanguageFilter, setTargetLanguageFilter] = useState<
    string | null
  >(null);

  // Apply language filters
  useEffect(() => {
    refreshFlashcards(
      sourceLanguageFilter || undefined,
      targetLanguageFilter || undefined
    );
  }, [sourceLanguageFilter, targetLanguageFilter]);

  const handleClearFilters = () => {
    setSourceLanguageFilter(null);
    setTargetLanguageFilter(null);
  };

  const handleDeleteFlashcard = (id: string) => {
    Alert.alert(
      "Delete Flashcard",
      "Are you sure you want to delete this flashcard?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFlashcard(id);
            } catch (error) {
              Alert.alert("Error", "Failed to delete flashcard.");
            }
          },
        },
      ]
    );
  };

  const getLanguageName = (code: string) => {
    const language = SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
    return language ? language.name : code;
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

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter by Language:</Text>

        <View style={styles.languageFilters}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() =>
              setSourceLanguageFilter(
                sourceLanguageFilter === null ? "en" : null
              )
            }
          >
            <Text style={styles.filterButtonText}>
              {sourceLanguageFilter
                ? `Source: ${getLanguageName(sourceLanguageFilter)}`
                : "Source: Any"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() =>
              setTargetLanguageFilter(
                targetLanguageFilter === null ? "es" : null
              )
            }
          >
            <Text style={styles.filterButtonText}>
              {targetLanguageFilter
                ? `Target: ${getLanguageName(targetLanguageFilter)}`
                : "Target: Any"}
            </Text>
          </TouchableOpacity>

          {(sourceLanguageFilter || targetLanguageFilter) && (
            <TouchableOpacity
              style={[styles.filterButton, styles.clearButton]}
              onPress={handleClearFilters}
            >
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {flashcards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No flashcards found</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate("Creator" as any)}
          >
            <Text style={styles.createButtonText}>Create Flashcard</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={flashcards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate("Review", { flashcardId: item.id })
              }
            >
              <View style={styles.cardContent}>
                <View style={styles.wordContainer}>
                  <Text style={styles.word}>{item.word}</Text>
                  {item.translation && (
                    <Text style={styles.translation}>{item.translation}</Text>
                  )}
                  <Text style={styles.languageInfo}>
                    {getLanguageName(item.source_language)} →{" "}
                    {getLanguageName(item.target_language)}
                  </Text>
                </View>
                <View style={styles.thumbnailContainer}>
                  {item.images[0] && (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.thumbnail}
                    />
                  )}
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.reviewCount}>
                  Reviewed: {item.review_count} times
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteFlashcard(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("Creator" as any)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardContent: {
    flexDirection: "row",
    padding: 15,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "center",
  },
  wordText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  reviewCount: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  deleteButton: {
    backgroundColor: "#ff4444",
    padding: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  filterContainer: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  languageFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterButtonText: {
    color: "#333",
    fontWeight: "500",
  },
  clearButton: {
    backgroundColor: "#ffebee",
    borderColor: "#ffcdd2",
  },
  clearButtonText: {
    color: "#d32f2f",
  },
  translation: {
    fontSize: 14,
    color: "#6C63FF",
    marginTop: 4,
  },
  languageInfo: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  createButton: {
    padding: 15,
    backgroundColor: "#6C63FF",
    borderRadius: 20,
    marginTop: 20,
  },
  createButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  wordContainer: {
    flex: 1,
    justifyContent: "center",
  },
  word: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  thumbnailContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#6C63FF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: {
    color: "white",
    fontSize: 24,
    fontWeight: "600",
  },
});
