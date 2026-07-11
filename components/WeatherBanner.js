import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCachedWeather, fetchWeather, getWeatherAdvisory, weatherCodeToEmoji } from "../utils/weather";

export default function WeatherBanner({ hasLocation, lat, lon }) {
  const [advisory, setAdvisory] = useState(null);
  const [temp, setTemp] = useState(null);
  const [weatherCode, setWeatherCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadWeather();
  }, [hasLocation, lat, lon]);

  const loadWeather = async () => {
    try {
      setLoading(true);
      setError(false);

      // Try cache first
      const cached = await getCachedWeather();
      if (cached) {
        setTemp(cached.temp);
        setWeatherCode(cached.weatherCode);
        setAdvisory(getWeatherAdvisory(cached.temp, cached.maxTemp));
        setLoading(false);
        return;
      }

      if (!hasLocation || lat === null || lon === null) {
        setLoading(false);
        return;
      }

      // Fetch fresh
      const weather = await fetchWeather(lat, lon);
      if (weather) {
        setTemp(weather.temp);
        setWeatherCode(weather.weatherCode);
        setAdvisory(getWeatherAdvisory(weather.temp, weather.maxTemp));
      }
    } catch (e) {
      console.error("Weather banner error:", e.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (error) return null;
  if (!advisory && temp === null) return null;
  if (!advisory && weatherCode === null) return null;

  // No advisory on normal days — still show current weather as a subtle info line
  if (!advisory) {
    return (
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          {weatherCodeToEmoji(weatherCode)} {Math.round(temp)}°C
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.advisoryBanner,
        advisory.level === "extreme" && styles.extreme,
        advisory.level === "high" && styles.high,
        advisory.level === "warm" && styles.warm,
      ]}
      onPress={loadWeather}
      activeOpacity={0.8}
    >
      <View style={styles.advisoryContent}>
        <Text style={styles.advisoryIcon}>{advisory.icon}</Text>
        <Text style={styles.advisoryText}>{advisory.text}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  infoBanner: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#A0B8D0",
  },
  advisoryBanner: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
  },
  advisoryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  advisoryIcon: {
    fontSize: 18,
  },
  advisoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  extreme: {
    backgroundColor: "#E8596E",
  },
  high: {
    backgroundColor: "#E67E22",
  },
  warm: {
    backgroundColor: "#F0A050",
  },
});
