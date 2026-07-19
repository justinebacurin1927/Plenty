import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { getOnboarded } from "./utils/storage";
import { useReducedMotion } from "./utils/motion";
import { useFonts, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from "@expo-google-fonts/quicksand";
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";

// ═══ Logger — captures console.log/warn/error from boot ═══
import "./utils/logger";

// ═══ Theme ═══
import { ThemeProvider, useTheme } from "./context/ThemeContext";

// ═══ Notification init + response handler (snooze / quick-log) ═══
import { initNotifications, setupResponseHandler } from "./utils/notifications";
initNotifications().catch(() => {});
try {
  setupResponseHandler();
} catch (e) {
  console.log("ℹ️ Notification handler not available in this environment");
}

// ═══ Capture original console AFTER logger installs its override ═══
const _origConsoleError = console.error.bind(console);

// ═══ Global error handler — logs uncaught errors to Dev Log ═══
if (global.ErrorUtils) {
  const prevHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    try {
      const msg = `UNCAUGHT${isFatal ? " FATAL" : ""} ERROR: ${error.message}\n${error.stack}`;
      _origConsoleError(msg);
    } catch (_) {}
  });
}

if (global.ErrorUtils && typeof global.ErrorUtils.reportError === "function") {
  const origReportError = global.ErrorUtils.reportError.bind(global.ErrorUtils);
  global.ErrorUtils.reportError = (error) => {
    try {
      _origConsoleError(`REPORTED ERROR: ${error?.message}\n${error?.stack}`);
    } catch (_) {}
  };
}

import ErrorBoundary from "./components/ErrorBoundary";
import HomeScreen from "./screens/HomeScreen";
import LogScreen from "./screens/LogScreen";
import AchievementsScreen from "./screens/AchievementsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import OnboardingScreen from "./screens/OnboardingScreen";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: "home",
  Log: "list",
  Achievements: "trophy",
  Settings: "settings",
};

function AppNavigator() {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          ...(reducedMotion ? {} : { animation: "fade" }),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 8),
            height: 60 + Math.max(insets.bottom, 8),
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
  const [onboarded, setOnboarded] = useState(null); // null = loading
  const [fontsLoaded] = useFonts({
    "Quicksand-Bold": Quicksand_700Bold,
    "Quicksand-SemiBold": Quicksand_600SemiBold,
    "Quicksand-Medium": Quicksand_500Medium,
    "Quicksand-Regular": Quicksand_400Regular,
    "Nunito-Bold": Nunito_700Bold,
    "Nunito-SemiBold": Nunito_600SemiBold,
    "Nunito-Medium": Nunito_500Medium,
    "Nunito-Regular": Nunito_400Regular,
  });

  useEffect(() => {
    getOnboarded().then(setOnboarded);
  }, []);

  const handleOnboardingComplete = () => {
    setOnboarded(true);
  };

  if (!fontsLoaded || onboarded === null) {
    // Loading state — keep splash visible
    return null;
  }

  if (!onboarded) {
    return (
      <SafeAreaProvider>
        <ThemeProvider>
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
