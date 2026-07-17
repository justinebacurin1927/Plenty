import React, { useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getStreakData } from "../utils/storage";

const CELL_SIZE = 14;
const CELL_GAP = 2;
const WEEKS_TO_SHOW = 12;

/**
 * Compute cell data for the last 12 weeks.
 * Returns array of { dateStr, totalMl, goalMet, color, label, frozen } grouped by week.
 */
export function computeGridData(history, goalGlasses, frozenDays = []) {
  const goalMl = goalGlasses * 250;
  const today = new Date();
  const cells = [];

  // Build a lookup from streak history
  const dayMap = {};
  for (const entry of history) {
    dayMap[entry.date] = entry;
  }

  // Build 12 weeks × 7 days grid, ending at today
  for (let week = WEEKS_TO_SHOW - 1; week >= 0; week--) {
    const weekCells = [];
    for (let day = 6; day >= 0; day--) {
      const d = new Date(today);
      d.setDate(d.getDate() - (week * 7 + day));
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const dayEntry = dayMap[dateStr];
      const totalMl = dayEntry ? dayEntry.totalMl : 0;
      const goalMet = dayEntry ? dayEntry.goalMet : false;
      const logged = dayEntry !== undefined;
      const frozen = frozenDays.includes(dateStr);

      let color = "empty";
      if (frozen) {
        color = "frozen";
      } else if (logged && goalMet) {
        const ratio = totalMl / goalMl;
        if (ratio >= 2) color = "over200";
        else if (ratio >= 1.5) color = "over150";
        else if (ratio >= 1) color = "hit";
      } else if (logged && !goalMet) {
        color = "missed";
      }

      weekCells.push({
        dateStr,
        totalMl,
        goalMet,
        color,
        frozen,
        label: frozen ? `Protected (${Math.round(totalMl)}ml)` : (totalMl > 0 ? `${Math.round(totalMl)}ml` : "No data"),
      });
    }
    weekCells.reverse();
    cells.push(weekCells);
  }

  return cells; // 12 weeks × 7 days
}

export default function Heatmap({ goalGlasses = 8 }) {
  const { colors, isDark } = useTheme();
  const [gridData, setGridData] = React.useState([]);
  const [tooltip, setTooltip] = React.useState(null);
  const fadeAnims = useRef([]);

  useEffect(() => {
    (async () => {
      const data = await getStreakData(goalGlasses);
      const grid = computeGridData(data.history, goalGlasses, data.frozenDays);
      setGridData(grid);

      // Initialize fade animations for each row
      fadeAnims.current = Array.from({ length: 7 }, (_, i) => ({
        opacity: new Animated.Value(0),
        delay: i * 80,
      }));

      // Start staggered fade-in
      Animated.stagger(
        80,
        fadeAnims.current.map((a) =>
          Animated.timing(a.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        )
      ).start();
    })();
  }, [goalGlasses]);

  const cellColors = {
    empty: colors.surfaceTertiary || (isDark ? "#1E2D42" : "#F0F4F8"),
    hit: "#4ADE80",
    over150: "#3B82F6",
    over200: "#1D4ED8",
    missed: "#FBBF24",
    frozen: "#67E8F9", // cyan — frosty
  };

  // Week labels
  const weekLabels = useMemo(() => {
    const today = new Date();
    return Array.from({ length: WEEKS_TO_SHOW }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (WEEKS_TO_SHOW - 1 - i) * 7);
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    });
  }, []);

  if (gridData.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Column headers */}
          <View style={styles.weekRow}>
            <View style={styles.dayLabelCol} />
            {weekLabels.map((label, i) => (
              <Text
                key={i}
                style={[styles.weekLabel, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                {label}
              </Text>
            ))}
          </View>

          {/* Grid rows */}
          {Array.from({ length: 7 }, (_, row) => (
            <Animated.View
              key={row}
              style={[
                styles.weekRow,
                { opacity: fadeAnims.current[row]?.opacity || 1 },
              ]}
            >
              {/* Day-of-week label */}
              <Text
                style={[styles.dayLabel, { color: colors.textTertiary }]}
              >
                {["Mon", "", "Wed", "", "Fri", "", "Sun"][row]}
              </Text>

              {/* Cells */}
              {gridData.map((week, col) => (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: cellColors[week[row].color] || cellColors.empty,
                      borderColor:
                        week[row].color === "empty"
                          ? colors.border
                          : week[row].color === "frozen"
                          ? "#22D3EE"
                          : "transparent",
                    },
                    week[row].color === "empty" && styles.cellEmpty,
                    week[row].color === "frozen" && styles.cellFrozen,
                  ]}
                  onPress={() =>
                    setTooltip(
                      tooltip?.dateStr === week[row].dateStr
                        ? null
                        : week[row]
                    )
                  }
                >
                  {week[row].frozen && (
                    <Text style={styles.freezeIcon}>❄</Text>
                  )}
                </TouchableOpacity>
              ))}
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Tooltip */}
      {tooltip && (
        <View style={[styles.tooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.tooltipDate, { color: colors.textSecondary }]}>
            {tooltip.dateStr}
          </Text>
          <Text style={[styles.tooltipMl, { color: colors.text }]}>
            {tooltip.totalMl > 0 ? `${tooltip.totalMl}ml` : "No drinks logged"}
          </Text>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendCell, { backgroundColor: cellColors.empty, borderColor: colors.border }]} />
          <Text style={[styles.legendLabel, { color: colors.textTertiary }]}>No data</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendCell, { backgroundColor: cellColors.missed }]} />
          <Text style={[styles.legendLabel, { color: colors.textTertiary }]}>Missed</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendCell, { backgroundColor: cellColors.hit }]} />
          <Text style={[styles.legendLabel, { color: colors.textTertiary }]}>Goal met</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendCell, { backgroundColor: cellColors.over150 }]} />
          <Text style={[styles.legendLabel, { color: colors.textTertiary }]}>150%+</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendCell, { backgroundColor: cellColors.frozen, borderWidth: 1, borderColor: "#22D3EE" }]} />
          <Text style={[styles.legendLabel, { color: colors.textTertiary }]}>Frozen</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  dayLabelCol: {
    width: 32,
  },
  dayLabel: {
    width: 32,
    fontSize: 9,
    textAlign: "center",
  },
  weekLabel: {
    width: CELL_SIZE,
    fontSize: 8,
    textAlign: "center",
    marginHorizontal: CELL_GAP / 2,
    marginBottom: 4,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
    marginHorizontal: CELL_GAP / 2,
  },
  cellEmpty: {
    borderWidth: 1,
    opacity: 0.5,
  },
  cellFrozen: {
    borderWidth: 1.5,
  },
  freezeIcon: {
    fontSize: 8,
    textAlign: "center",
    lineHeight: 14,
    opacity: 0.9,
  },
  tooltip: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  tooltipDate: {
    fontSize: 12,
  },
  tooltipMl: {
    fontSize: 12,
    fontWeight: "600",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    gap: 12,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: "transparent",
  },
  legendLabel: {
    fontSize: 10,
  },
});
