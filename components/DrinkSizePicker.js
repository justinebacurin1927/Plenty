/**
 * DrinkSizePicker — Visual drink size selector modal
 *
 * Shows a grid of common drink sizes with icons. User taps one to
 * log that amount directly, or closes to cancel.
 *
 * Inspired by the idea.jpeg reference in __tests__/screenshot-results/.
 */

import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { type } from "../constants/typography";

const DRINK_OPTIONS = [
  { ml: 100, label: "Small",   icon: "cafe-outline" },
  { ml: 200, label: "Regular", icon: "water-outline" },
  { ml: 250, label: "Standard", icon: "water",        recommended: true },
  { ml: 330, label: "Can",     icon: "flask-outline" },
  { ml: 500, label: "Bottle",  icon: "wine-outline" },
  { ml: 750, label: "Large",   icon: "flask" },
];

export default function DrinkSizePicker({ visible, onSelect, onDismiss }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onDismiss}>
        <View style={[s.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[s.title, { color: colors.text }]}>How much did you drink?</Text>

          <View style={s.grid}>
            {DRINK_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.ml}
                style={[
                  s.option,
                  { backgroundColor: colors.surfaceSecondary },
                  opt.recommended && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                activeOpacity={0.7}
                onPress={() => onSelect(opt.ml)}
              >
                <View style={[s.iconWrap, { backgroundColor: colors.primaryBg }]}>
                  <Ionicons name={opt.icon} size={28} color={colors.primary} />
                </View>
                <Text style={[s.optionMl, { color: colors.text }]}>{opt.ml}<Text style={s.mlUnit}>ml</Text></Text>
                <Text style={[s.optionLabel, { color: colors.textSecondary }]}>{opt.label}</Text>
                {opt.recommended && (
                  <View style={[s.badge, { backgroundColor: colors.primary }]}>
                    <Text style={s.badgeText}>Default</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.cancelBtn} onPress={onDismiss} activeOpacity={0.7}>
            <Text style={[s.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    sheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 24,
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    title: {
      ...type.title,
      textAlign: "center",
      marginBottom: 20,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "center",
    },
    option: {
      width: "30%",
      alignItems: "center",
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: "transparent",
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    optionMl: {
      ...type.label,
      fontSize: 18,
    },
    mlUnit: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    optionLabel: {
      ...type.small,
      marginTop: 2,
    },
    badge: {
      position: "absolute",
      top: -6,
      right: -6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    badgeText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "700",
    },
    cancelBtn: {
      alignItems: "center",
      paddingVertical: 14,
      marginTop: 12,
    },
    cancelText: {
      ...type.label,
    },
  });
}
