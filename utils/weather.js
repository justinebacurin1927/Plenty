import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "@plenty_weather_cache";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

// ─── Cache ───────────────────────────────────────────

async function getCache() {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function setCache(data) {
  const entry = {
    data,
    cachedAt: Date.now(),
  };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

export async function getCachedWeather() {
  const cache = await getCache();
  if (!cache) return null;
  if (Date.now() - cache.cachedAt > CACHE_TTL) return null; // expired
  return cache.data;
}

export async function clearWeatherCache() {
  await AsyncStorage.removeItem(CACHE_KEY);
}

// ─── API Call (D1) ───────────────────────────────────

export async function fetchWeather(lat, lon) {
  const url = `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max&timezone=auto&forecast_days=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    const json = await response.json();

    const result = {
      temp: json.current?.temperature_2m ?? null,
      weatherCode: json.current?.weather_code ?? null,
      maxTemp: json.daily?.temperature_2m_max?.[0] ?? json.current?.temperature_2m ?? null,
    };

    await setCache(result);
    return result;
  } catch (e) {
    console.error("🌤️ Weather fetch failed:", e.message);
    return null;
  }
}

// ─── Weather Descriptions ─────────────────────────────

export function weatherCodeToEmoji(code) {
  if (code === undefined || code === null) return "sunny";
  if (code === 0) return "sunny"; // clear
  if (code <= 3) return "partly-sunny"; // partly cloudy
  if (code <= 48) return "cloudy"; // foggy
  if (code <= 57) return "rainy"; // drizzle
  if (code <= 67) return "rainy"; // rain
  if (code <= 77) return "snow"; // snow
  if (code <= 82) return "rainy"; // showers
  if (code <= 86) return "thunderstorm"; // thunder
  return "rainy"; // default
}

// ─── Heat Adjustment (D3) ─────────────────────────────

export function getHeatAdjustedInterval(temp, baseIntervalSeconds) {
  if (temp === null || temp === undefined) return baseIntervalSeconds;
  if (temp > 35) return Math.min(baseIntervalSeconds, 600); // 10 min max
  if (temp > 30) return Math.min(baseIntervalSeconds, 900); // 15 min max
  return baseIntervalSeconds;
}

export function isHotDay(temp) {
  return temp !== null && temp >= 30;
}

// ─── Advisory (D4) ──────────────────────────────────

export function getWeatherAdvisory(temp, maxTemp) {
  const t = maxTemp ?? temp;
  if (t === null || t === undefined) return null;

  if (t >= 38) {
    return {
      level: "extreme",
      icon: "flame",
      text: `Extreme heat — ${Math.round(t)}°C! Drink extra water today.`,
    };
  }
  if (t >= 33) {
    return {
      level: "high",
      icon: "sunny",
      text: `${Math.round(t)}°C today — stay hydrated!`,
    };
  }
  if (t >= 30) {
    return {
      level: "warm",
      icon: "partly-sunny",
      text: `${Math.round(t)}°C — a bit warm, keep drinking!`,
    };
  }
  return null; // normal temps, no advisory
}
