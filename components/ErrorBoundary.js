import React from "react";
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";

// Inline styles — no StyleSheet.create, to avoid crashes if that's the issue
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Use the original console.error if available
    try {
      console.error("🎯 ErrorBoundary caught:", error.message);
    } catch (_) {}
  }

  render() {
    if (this.state.error) {
      const e = this.state.error;
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#1A1D23" }}>
          <View style={{ padding: 24, paddingTop: 60, flex: 1 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#E8596E", marginBottom: 20 }}>
              🚨 Error
            </Text>
            <ScrollView style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#FF6B6B", marginBottom: 8 }}>
                {e.name || "Error"}
              </Text>
              <Text style={{ fontSize: 16, color: "#FFD1D1", marginBottom: 20, lineHeight: 24 }}>
                {e.message}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#8892A0", marginBottom: 8 }}>
                Stack:
              </Text>
              <Text style={{ fontSize: 12, color: "#B0B8C8", fontFamily: "monospace", lineHeight: 18 }}>
                {e.stack || "No stack trace available"}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={{
                backgroundColor: "#4A90D9",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
                marginTop: 16,
              }}
              onPress={() => this.setState({ error: null })}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                Dismiss & Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}
