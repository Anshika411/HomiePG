import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface DashboardStats {
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyPct: number;
  revenueThisMonth: number;
  pendingRent: number;
  newBookingsToday: number;
  pendingBookings: number;
  checkoutsThisWeek: number;
  totalTenants: number;
  housekeepingAlerts: number;
}

interface SmartDashboardProps {
  apiBase: string;
  token: string;
}

export const SmartDashboard: React.FC<SmartDashboardProps> = ({ apiBase, token }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiBase}/api/owner/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      if (!data.error) setStats(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />;
  if (!stats) return null;

  const occupancyColor = stats.occupancyPct >= 80 ? COLORS.success : stats.occupancyPct >= 60 ? COLORS.warning : COLORS.danger;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor={COLORS.accent} />}
    >
      {/* Big Occupancy Ring Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>Today's Occupancy</Text>
          <Text style={[styles.heroValue, { color: occupancyColor }]}>{stats.occupancyPct}%</Text>
          <View style={styles.occupancyBar}>
            <View style={[styles.occupancyFill, { width: `${stats.occupancyPct}%` as any, backgroundColor: occupancyColor }]} />
          </View>
          <Text style={styles.heroSub}>{stats.occupiedBeds} occupied · {stats.vacantBeds} vacant</Text>
        </View>
        <View style={styles.heroRight}>
          <View style={styles.miniStatBox}>
            <Text style={styles.miniStatVal}>{stats.totalTenants}</Text>
            <Text style={styles.miniStatLbl}>Tenants</Text>
          </View>
          <View style={styles.miniStatBox}>
            <Text style={[styles.miniStatVal, { color: COLORS.warning }]}>{stats.pendingBookings}</Text>
            <Text style={styles.miniStatLbl}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Revenue Row */}
      <View style={styles.revenueRow}>
        <View style={[styles.revenueCard, { backgroundColor: COLORS.success + "18" }]}>
          <Text style={styles.revIcon}>💰</Text>
          <Text style={styles.revLabel}>Revenue This Month</Text>
          <Text style={[styles.revValue, { color: COLORS.success }]}>
            ₹{stats.revenueThisMonth.toLocaleString("en-IN")}
          </Text>
        </View>
        <View style={[styles.revenueCard, { backgroundColor: COLORS.danger + "18" }]}>
          <Text style={styles.revIcon}>⚠️</Text>
          <Text style={styles.revLabel}>Pending Rent</Text>
          <Text style={[styles.revValue, { color: COLORS.danger }]}>
            ₹{stats.pendingRent.toLocaleString("en-IN")}
          </Text>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.quickGrid}>
        {[
          { icon: "📅", label: "New Today", value: stats.newBookingsToday, color: COLORS.primary },
          { icon: "🚪", label: "Checkouts", value: stats.checkoutsThisWeek, color: COLORS.warning, sub: "this week" },
          { icon: "🧹", label: "Housekeeping", value: stats.housekeepingAlerts, color: stats.housekeepingAlerts > 0 ? COLORS.danger : COLORS.success, sub: "alerts" },
          { icon: "🛏️", label: "Total Beds", value: stats.totalBeds, color: COLORS.accent },
        ].map((item, idx) => (
          <View key={idx} style={styles.quickCard}>
            <Text style={styles.quickIcon}>{item.icon}</Text>
            <Text style={[styles.quickValue, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.quickLabel}>{item.label}</Text>
            {item.sub ? <Text style={styles.quickSub}>{item.sub}</Text> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    ...SHADOWS.large,
  },
  heroLeft: { flex: 1 },
  heroLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 4 },
  heroValue: { fontSize: 48, fontWeight: "900", lineHeight: 54 },
  occupancyBar: {
    height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3,
    marginTop: 8, marginBottom: 6, overflow: "hidden"
  },
  occupancyFill: { height: 6, borderRadius: 3 },
  heroSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  heroRight: { gap: 12, marginLeft: 16 },
  miniStatBox: {
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12,
    padding: 10, alignItems: "center", minWidth: 60
  },
  miniStatVal: { color: "#fff", fontSize: 20, fontWeight: "800" },
  miniStatLbl: { color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: 2 },
  revenueRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  revenueCard: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: "center", ...SHADOWS.small
  },
  revIcon: { fontSize: 22, marginBottom: 4 },
  revLabel: { fontSize: 11, color: COLORS.textMuted, textAlign: "center", marginBottom: 4 },
  revValue: { fontSize: 16, fontWeight: "800" },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  quickCard: {
    width: "47%", backgroundColor: COLORS.cardBg, borderRadius: 16,
    padding: 16, alignItems: "center", ...SHADOWS.small
  },
  quickIcon: { fontSize: 24, marginBottom: 6 },
  quickValue: { fontSize: 26, fontWeight: "900" },
  quickLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  quickSub: { fontSize: 10, color: COLORS.textMuted },
});
