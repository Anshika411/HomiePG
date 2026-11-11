import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface HeatmapScreenProps {
  apiBase: string;
  token: string;
}

export const RentHeatmapScreen: React.FC<HeatmapScreenProps> = ({ apiBase, token }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const fetchHeatmap = async () => {
    try {
      const res = await fetch(`${apiBase}/api/owner/rent-heatmap?month=${currentMonth}&year=${currentYear}`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setHeatmapData(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchHeatmap(); }, [currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const renderCalendar = () => {
    if (!heatmapData || !heatmapData.heatmap) return null;
    const days = [];
    const heatmap = heatmapData.heatmap;

    // Get starting day of the week
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();

    // Empty spaces before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    // Days in month
    for (let d = 1; d <= heatmapData.daysInMonth; d++) {
      const dateKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayData = heatmap[dateKey] || { paid: 0, pending: 0, overdue: 0, total: 0 };

      let bgColor = COLORS.background;
      let textColor = COLORS.textDark;

      if (dayData.total > 0) {
        if (dayData.overdue > 0) {
          bgColor = COLORS.danger;
          textColor = "#fff";
        } else if (dayData.pending > 0) {
          bgColor = COLORS.warning;
          textColor = "#fff";
        } else if (dayData.paid > 0) {
          bgColor = COLORS.success;
          textColor = "#fff";
        }
      }

      days.push(
        <View key={d} style={[styles.dayCell, { backgroundColor: bgColor }]}>
          <Text style={[styles.dayNumber, { color: textColor }]}>{d}</Text>
          {dayData.total > 0 ? (
            <Text style={styles.dayStatsText}>
              {dayData.paid}/{dayData.total}
            </Text>
          ) : null}
        </View>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>📅 Rent Collection Heatmap</Text>

      {/* Selector Header */}
      <View style={styles.selectorHeader}>
        <TouchableOpacity style={styles.arrowBtn} onPress={handlePrevMonth}>
          <Text style={styles.arrowText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthNames[currentMonth - 1]} {currentYear}</Text>
        <TouchableOpacity style={styles.arrowBtn} onPress={handleNextMonth}>
          <Text style={styles.arrowText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.legendText}>Fully Paid</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
          <Text style={styles.legendText}>Overdue</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border }]} />
          <Text style={styles.legendText}>No Invoices</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHeatmap(); }} tintColor={COLORS.accent} />}
        >
          {/* Weekday headers */}
          <View style={styles.calendarGrid}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <View key={day} style={styles.weekdayHeader}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
            {renderCalendar()}
          </View>

          {/* Collection Insights */}
          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>Collection Insights</Text>
            <Text style={styles.insightsPara}>
              Color-coded tiles represent due rent bills. Tapping or tracking calendar grids helps PG administrators visually pinpoint high-risk payment periods instantly.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
  screenTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 12 },
  selectorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 12, marginBottom: 16, ...SHADOWS.small },
  arrowBtn: { padding: 8 },
  arrowText: { fontSize: 16, color: COLORS.primary, fontWeight: "bold" },
  monthLabel: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  legendRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, paddingHorizontal: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 10, ...SHADOWS.medium },
  weekdayHeader: { width: "14.28%", alignItems: "center", paddingVertical: 8 },
  weekdayText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  dayCell: { width: "12.28%", height: 50, borderRadius: 8, margin: "1%", justifyContent: "center", alignItems: "center", padding: 2 },
  emptyDay: { width: "12.28%", height: 50, margin: "1%" },
  dayNumber: { fontSize: 13, fontWeight: "bold" },
  dayStatsText: { fontSize: 8, fontWeight: "bold", marginTop: 2 },
  insightsCard: { backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 24 },
  insightsTitle: { fontSize: 14, fontWeight: "800", color: COLORS.primary, marginBottom: 6 },
  insightsPara: { fontSize: 12, color: COLORS.primary, lineHeight: 18 },
});
