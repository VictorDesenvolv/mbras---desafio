import "./global.css";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import ResultsScreen from "./src/screens/ResultsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#FFD43B",
            borderBottomWidth: 3,
            borderBottomColor: "#000",
          },
          headerTintColor: "#000",
          headerTitleStyle: { fontWeight: "900", fontSize: 18 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "#E8E4DC" },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{ title: "Resultados" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
