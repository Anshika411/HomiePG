import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface AIInsightsScreenProps {
  apiBase: string;
  token: string;
}

export const AIInsightsScreen: React.FC<AIInsightsScreenProps> = ({ apiBase, token }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  const fetchInsights = async () => {
    try {
      const res = await fetch(`${apiBase}/api/owner/ai-insights`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setInsights(data.insights || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchInsights(); }, []);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInsights(); }} tintColor={COLORS.accent} />}
    >
      <View style={styles.header}>
        <Text style={styles.screenTitle}>🔮 AI Business Insights</Text>
        <Text style={styles.screenSub}>Gemini LLM Business Analytics Integration</Text>
      </View>

      {/* Main Insights Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sparkleIcon}>✨</Text>
          <Text style={styles.cardTitle}>Dynamic Recommendations</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 30 }} />
        ) : (
          <View style={styles.list}>
            {insights.map((insight, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.bulletBox}>
                  <Text style={styles.bulletText}>{idx + 1}</Text>
                </View>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Warning Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>💡 How Gemini Insight Modeling Works</Text>
        <Text style={styles.infoBoxPara}>
          HomiePG aggregates occupancy ratios, Wi-Fi connectivity support tickets, housekeeping backlogs, and seasonal price variables, passing them securely to Google Gemini-Pro model keys to suggest growth actions.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
  header: { marginBottom: 16 },
  screenTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark },
  screenSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 18, marginBottom: 16, ...SHADOWS.medium },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  sparkleIcon: { fontSize: 22 },
  cardTitle: { fontSize: 14, fontWeight: "800", color: COLORS.textDark },
  list: { gap: 16 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  bulletBox: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primaryLight, justifyContent: "center", alignItems: "center" },
  bulletText: { fontSize: 11, fontWeight: "800", color: COLORS.primary },
  insightText: { flex: 1, fontSize: 13, color: COLORS.textDark, lineHeight: 20, fontWeight: "500" },
  infoBox: { backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 16, marginBottom: 30 },
  infoBoxTitle: { fontSize: 12, fontWeight: "800", color: COLORS.primary, marginBottom: 6 },
  infoBoxPara: { fontSize: 12, color: COLORS.primary, lineHeight: 18 },
});
