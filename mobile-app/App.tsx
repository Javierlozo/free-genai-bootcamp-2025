import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

// We'll create these components next
import HomeScreen from "./src/screens/HomeScreen";
import FlashcardCreator from "./src/screens/FlashcardCreator";
import FlashcardReview from "./src/screens/FlashcardReview";
import FlashcardSets from "./src/screens/FlashcardSets";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#6C63FF", // Modern purple shade
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Visual Flashcards" }}
          />
          <Stack.Screen
            name="Creator"
            component={FlashcardCreator}
            options={{ title: "Create Flashcard" }}
          />
          <Stack.Screen
            name="Review"
            component={FlashcardReview}
            options={{ title: "Review Cards" }}
          />
          <Stack.Screen
            name="Sets"
            component={FlashcardSets}
            options={{ title: "My Sets" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
