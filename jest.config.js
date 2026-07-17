module.exports = {
  preset: "jest-expo",
  testPathIgnorePatterns: ["/__mocks__/"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-reanimated|react-native-worklets)",
  ],
  moduleNameMapper: {
    "^expo-notifications$": "<rootDir>/__tests__/__mocks__/expo-notifications.js",
  },
};
