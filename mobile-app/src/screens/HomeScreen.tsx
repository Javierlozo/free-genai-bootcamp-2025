import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  Home: undefined;
  Creator: undefined;
  Sets: undefined;
  Review: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Visual Flashcard Immersion</Text>
      <Text style={styles.subtitle}>Learn through AI-generated imagery</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Creator")}
        >
          <Text style={styles.buttonText}>Create New Flashcard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Sets")}
        >
          <Text style={styles.buttonText}>My Flashcard Sets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Review")}
        >
          <Text style={styles.buttonText}>Start Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginTop: 40,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
  },
  button: {
    backgroundColor: "#6C63FF",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
