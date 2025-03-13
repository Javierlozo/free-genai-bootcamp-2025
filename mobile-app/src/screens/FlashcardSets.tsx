import React from "react";
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

type RootStackParamList = {
  Review: { flashcardId: string };
  Sets: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FlashcardSets() {
  const navigation = useNavigation<NavigationProp>();
  const { flashcards, loading, error, deleteFlashcard } = useFlashcards();

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Flashcard",
      "Are you sure you want to delete this flashcard?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFlashcard(id);
            } catch (error) {
              Alert.alert("Error", "Failed to delete flashcard");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: (typeof flashcards)[0] }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigation.navigate("Review", { flashcardId: item.id })}
      >
        <Image source={{ uri: item.images[0] }} style={styles.thumbnail} />
        <View style={styles.cardInfo}>
          <Text style={styles.wordText}>{item.word}</Text>
          <Text style={styles.dateText}>
            Last reviewed:{" "}
            {item.last_reviewed
              ? new Date(item.last_reviewed).toLocaleDateString()
              : "Never"}
          </Text>
          <Text style={styles.reviewCount}>
            Reviewed {item.review_count} times
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

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
      {flashcards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No flashcard sets yet. Create your first set!
          </Text>
        </View>
      ) : (
        <FlatList
          data={flashcards}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
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
});
