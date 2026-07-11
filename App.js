import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// ═══ Logger — captures console.log/warn/error from boot ═══
import "./utils/logger";

// ═══ Notification response handler (snooze / quick-log) ═══
import { setupResponseHandler } from "./utils/notifications";
setupResponseHandler();

// ═══ Capture original console AFTER logger installs its override ═══
// The logger keeps a reference to the REAL console.error internally,
// so calling this goes through logger → real console.error
const _origConsoleError = console.error.bind(console);

// ═══ Global error handler — logs uncaught errors to Dev Log ═══
// NOTE: We intentionally do NOT call prevHandler to suppress the
// red error screen. The ErrorBoundary handles display instead.
if (global.ErrorUtils) {
  const prevHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    try {
      const msg = `🚨 UNCAUGHT${isFatal ? " FATAL" : ""} ERROR: ${error.message}\n${error.stack}`;
      _origConsoleError(msg);
    } catch (_) {
      // don't recursively crash
    }
    // Intentionally skip prevHandler to suppress red error screen
  });
}

// ═══ Catch unhandled promise rejections ═══
if (global.ErrorUtils && typeof global.ErrorUtils.reportError === "function") {
  const origReportError = global.ErrorUtils.reportError.bind(global.ErrorUtils);
  global.ErrorUtils.reportError = (error) => {
    try {
      _origConsoleError(`🚨 REPORTED ERROR: ${error?.message}\n${error?.stack}`);
    } catch (_) {
      // don't recursively crash
    }
    // Intentionally skip origReportError to suppress red error screen
  };
}

import ErrorBoundary from "./components/ErrorBoundary";
import HomeScreen from "./screens/HomeScreen";
import LogScreen from "./screens/LogScreen";
import AchievementsScreen from "./screens/AchievementsScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: "home",
  Log: "list",
  Achievements: "trophy",
  Settings: "settings",
};

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
            ),
            tabBarActiveTintColor: "#4A90D9",
            tabBarInactiveTintColor: "#B8D0E8",
            tabBarStyle: {
              backgroundColor: "#fff",
              borderTopColor: "#E8F0FE",
              paddingTop: 6,
              paddingBottom: 8,
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Log" component={LogScreen} />
          <Tab.Screen name="Achievements" component={AchievementsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
