import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Platform
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface VacancyPredictionScreenProps {
  apiBase: string;
  token: string;
}

export const VacancyPredictionScreen: React.FC<VacancyPredictionScreenProps> = ({ apiBase, token }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);

  const fetchPredictions = async () => {
    try {
      const res = await fetch(`${apiBase}/api/owner/vacancy-predictions`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setPredictions(data.predictions || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchPredictions(); }, []);

  if (loading) return <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPredictions(); }} tintColor={COLORS.accent} />}
    >
      <Text style={styles.screenTitle}>🔮 Vacancy Prediction (AI Insights)</Text>

      {predictions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🔮</Text>
          <Text style={styles.emptyText}>No predicted vacancies found.</Text>
          <Text style={styles.emptySub}>All resident lease agreements are stable with no pending move-out notices.</Text>
        </View>
      ) : (
        predictions.map((p, idx) => {
          const isHighConfidence = p.confidence === "High";
          return (
            <View key={idx} style={[styles.predictCard, p.atRisk && styles.riskCard]}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.roomNo}>Room {p.roomNumber}</Text>
                  <Text style={styles.building}>🏠 {p.buildingName}</Text>
                </View>
                <View style={[
                  styles.confidenceBadge, 
                  { backgroundColor: isHighConfidence ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", borderColor: isHighConfidence ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)", borderWidth: 1 }
                ]}>
                  <Text style={[styles.confidenceText, { color: isHighConfidence ? "#059669" : "#d97706" }]}>
                    {p.confidence} Confidence
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Current Tenant</Text>
                  <Text style={styles.val}>{p.tenantName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Expected Vacant</Text>
                  <Text style={styles.val}>{p.predictedVacancyDate || "Immediate / Risk"}</Text>
                </View>
                {p.daysUntilVacant !== null ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Time Remaining</Text>
                    <Text style={[styles.val, { color: COLORS.danger, fontWeight: "800" }]}>{p.daysUntilVacant} Days</Text>
                  </View>
                ) : null}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Reason / Insight</Text>
                  <Text style={[styles.val, { fontWeight: "800", color: p.atRisk ? COLORS.danger : COLORS.textDark }]}>{p.reason}</Text>
                </View>
              </View>
            </View>
          );
        })
      )}

      {/* Suggestion alert */}
      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>💡 Actionable Advice</Text>
        <Text style={styles.tipPara}>
          Flagged rooms are expected to become vacant soon. You can pre-list these beds on the search portal today by setting their status to "Pre-Booking Allowed" to reduce vacancy losses.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
  screenTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textDark, marginBottom: 16 },
  predictCard: { 
    backgroundColor: COLORS.cardBg, 
    borderRadius: 18, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small 
  },
  riskCard: { 
    borderLeftWidth: 5,
    borderLeftColor: COLORS.danger,
    borderColor: COLORS.danger + "30",
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  roomNo: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  building: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  confidenceText: { fontSize: 9.5, fontWeight: "800" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  details: { gap: 8 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },
  val: { fontSize: 12, color: COLORS.textDark, fontWeight: "600" },
  emptyBox: { alignItems: "center", paddingVertical: 50 },
  emptyIcon: { fontSize: 54, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  emptySub: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginTop: 4, paddingHorizontal: 20, lineHeight: 18 },
  tipBox: { 
    backgroundColor: "#eff6ff", 
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 18, 
    padding: 16, 
    marginTop: 12, 
    marginBottom: 30 
  },
  tipTitle: { fontSize: 13, fontWeight: "800", color: "#1d4ed8", marginBottom: 6 },
  tipPara: { fontSize: 12, color: "#1e40af", lineHeight: 18 },
});
