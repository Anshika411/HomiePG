import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface KPIStatsScreenProps {
  apiBase: string;
  token: string;
}

export const KPIStatsScreen: React.FC<KPIStatsScreenProps> = ({ apiBase, token }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpi, setKpi] = useState<any>(null);

  const fetchKpi = async () => {
    try {
      const res = await fetch(`${apiBase}/api/owner/kpi-dashboard`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setKpi(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchKpi(); }, []);

  if (loading) return <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />;
  if (!kpi) return null;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchKpi(); }} tintColor={COLORS.accent} />}
    >
      <Text style={styles.screenTitle}>📈 Performance KPIs</Text>

      {/* Primary KPI Grid */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>₹{(kpi.revenueThisMonth || 0).toLocaleString("en-IN")}</Text>
          <Text style={styles.kpiLabel}>Revenue (June)</Text>
          <Text style={[styles.kpiSub, { color: kpi.revenueGrowth >= 0 ? COLORS.success : COLORS.danger }]}>
            {kpi.revenueGrowth >= 0 ? `+${kpi.revenueGrowth}%` : `${kpi.revenueGrowth}%`} vs last month
          </Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>₹{(kpi.profit || 0).toLocaleString("en-IN")}</Text>
          <Text style={styles.kpiLabel}>Calculated Profit</Text>
          <Text style={styles.kpiSub}>Expenses: ₹{(kpi.expensesThisMonth || 0).toLocaleString("en-IN")}</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{kpi.avgStayMonths || 0}m</Text>
          <Text style={styles.kpiLabel}>Average Length of Stay</Text>
          <Text style={styles.kpiSub}>Active residents: {kpi.totalTenants || 0}</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{kpi.renewalRate || 0}%</Text>
          <Text style={styles.kpiLabel}>Agreement Renewal Rate</Text>
          <Text style={styles.kpiSub}>Target benchmark: 80%</Text>
        </View>
      </View>

      {/* Resolutions Progress */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Maintenance Tickets Resolution</Text>
        <Text style={styles.progressValue}>{kpi.resolutionRate || 100}%</Text>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${kpi.resolutionRate || 100}%` as any }]} />
        </View>
        <Text style={styles.progressSub}>
          Resolved {kpi.resolvedComplaints || 0} out of {kpi.totalComplaints || 0} tickets this month
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
  screenTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 16 },
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  kpiCard: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14, ...SHADOWS.small },
  kpiValue: { fontSize: 20, fontWeight: "900", color: COLORS.primary },
  kpiLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  kpiSub: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  progressCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 30, ...SHADOWS.medium },
  progressTitle: { fontSize: 13, fontWeight: "800", color: COLORS.textDark, marginBottom: 6 },
  progressValue: { fontSize: 32, fontWeight: "900", color: COLORS.accent },
  progressBarTrack: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginVertical: 10, overflow: "hidden" },
  progressBarFill: { height: 8, backgroundColor: COLORS.accent, borderRadius: 4 },
  progressSub: { fontSize: 11, color: COLORS.textMuted },
});
