import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCachedWeather, fetchWeather, getWeatherAdvisory, weatherCodeToEmoji } from "../utils/weather";
import { useTheme } from "../context/ThemeContext";

export default function WeatherBanner({ hasLocation, lat, lon }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

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

  if (!advisory) {
    return (
      <View style={s.infoBanner}>
        <Text style={s.infoText}>
          {weatherCodeToEmoji(weatherCode)} {Math.round(temp)}°C
        </Text>
      </View>
    );
  }

  const bannerStyle = advisory.level === "extreme"
    ? s.extreme
    : advisory.level === "high"
      ? s.high
      : s.warm;

  return (
    <TouchableOpacity
      style={[s.advisoryBanner, bannerStyle]}
      onPress={loadWeather}
      activeOpacity={0.8}
    >
      <View style={s.advisoryContent}>
        <Text style={s.advisoryIcon}>{advisory.icon}</Text>
        <Text style={s.advisoryText}>{advisory.text}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    infoBanner: {
      alignItems: "center",
      marginTop: 4,
      marginBottom: 4,
    },
    infoText: {
      fontSize: 13,
      color: colors.textTertiary,
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
      backgroundColor: colors.extremeBg,
    },
    high: {
      backgroundColor: colors.highBg,
    },
    warm: {
      backgroundColor: colors.warmBg,
    },
  });
}
