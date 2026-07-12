import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// ═══ Logger — captures console.log/warn/error from boot ═══
import "./utils/logger";

// ═══ Theme ═══
import { ThemeProvider, useTheme } from "./context/ThemeContext";

// ═══ Notification response handler (snooze / quick-log) ═══
import { setupResponseHandler } from "./utils/notifications";
setupResponseHandler();

// ═══ Capture original console AFTER logger installs its override ═══
const _origConsoleError = console.error.bind(console);

// ═══ Global error handler — logs uncaught errors to Dev Log ═══
if (global.ErrorUtils) {
  const prevHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    try {
      const msg = `🚨 UNCAUGHT${isFatal ? " FATAL" : ""} ERROR: ${error.message}\n${error.stack}`;
      _origConsoleError(msg);
    } catch (_) {}
  });
}

if (global.ErrorUtils && typeof global.ErrorUtils.reportError === "function") {
  const origReportError = global.ErrorUtils.reportError.bind(global.ErrorUtils);
  global.ErrorUtils.reportError = (error) => {
    try {
      _origConsoleError(`🚨 REPORTED ERROR: ${error?.message}\n${error?.stack}`);
    } catch (_) {}
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

function AppNavigator() {
  const { isDark, colors } = useTheme();

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
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
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
