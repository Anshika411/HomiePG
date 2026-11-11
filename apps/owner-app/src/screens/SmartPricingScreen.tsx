import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface SmartPricingScreenProps {
  apiBase: string;
  token: string;
}

export const SmartPricingScreen: React.FC<SmartPricingScreenProps> = ({ apiBase, token }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const fetchPricing = async () => {
    try {
      const res = await fetch(`${apiBase}/api/owner/pricing-suggestions`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchPricing(); }, []);

  const handleApplyPricing = (buildingName: string, suggestedRent: number) => {
    Alert.alert(
      "Apply Pricing Model",
      `Are you sure you want to adjust the dynamic rent pricing for ${buildingName} to ₹${suggestedRent.toLocaleString("en-IN")}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Apply Price", onPress: () => Alert.alert("Success", "Rent pricing adjusted successfully!") }
      ]
    );
  };

  if (loading) return <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPricing(); }} tintColor={COLORS.accent} />}
    >
      <Text style={styles.screenTitle}>🏷️ Smart Pricing Suggestions</Text>

      {suggestions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🏷️</Text>
          <Text style={styles.emptyText}>No pricing recommendations.</Text>
        </View>
      ) : (
        suggestions.map((s, idx) => {
          let badgeColor = COLORS.success;
          let badgeBg = COLORS.successLight;
          let cardBorderColor = "rgba(16,185,129,0.2)";

          if (s.type === "discount") {
            badgeColor = COLORS.danger;
            badgeBg = COLORS.dangerLight;
            cardBorderColor = "rgba(239,68,68,0.2)";
          } else if (s.type === "surge" || s.type === "increase") {
            badgeColor = COLORS.warning;
            badgeBg = COLORS.warningLight;
            cardBorderColor = "rgba(245,158,11,0.2)";
          }

          return (
            <View key={idx} style={[styles.suggestCard, { borderColor: cardBorderColor }]}>
              <View style={styles.headerRow}>
                <Text style={styles.buildingName}>{s.buildingName}</Text>
                <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.badgeText, { color: badgeColor }]}>{s.suggestedChange?.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.reason}>{s.icon} {s.reason}</Text>

              <View style={styles.divider} />

              <View style={styles.priceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.priceLabel}>Current Rent Base</Text>
                  <Text style={styles.currentPrice}>₹{s.currentRent.toLocaleString("en-IN")}</Text>
                </View>
                <View style={styles.arrowIconBox}>
                  <Text style={styles.arrowIcon}>➔</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.priceLabel}>Suggested Rent</Text>
                  <Text style={[styles.suggestedPrice, { color: badgeColor }]}>
                    ₹{s.suggestedRent.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>

              <Text style={styles.occupancyNote}>Current occupancy: {s.occupancyPct}%</Text>

              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: badgeColor }]}
                onPress={() => handleApplyPricing(s.buildingName, s.suggestedRent)}
              >
                <Text style={styles.applyBtnText}>Apply Adjusted Rent</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
  screenTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textDark, marginBottom: 16 },
  suggestCard: { 
    backgroundColor: COLORS.cardBg, 
    borderRadius: 18, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1.5,
    ...SHADOWS.small 
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  buildingName: { fontSize: 15, fontWeight: "800", color: COLORS.textDark },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 9.5, fontWeight: "800" },
  reason: { fontSize: 12.5, color: COLORS.textMuted, marginTop: 8, lineHeight: 18 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  priceRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  priceLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: "center", textTransform: "uppercase", fontWeight: "700" },
  currentPrice: { fontSize: 18, fontWeight: "800", color: COLORS.textDark, textAlign: "center", marginTop: 4 },
  arrowIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primaryLight, justifyContent: "center", alignItems: "center" },
  arrowIcon: { fontSize: 14, color: COLORS.primary, fontWeight: "800" },
  suggestedPrice: { fontSize: 18, fontWeight: "800", textAlign: "center", marginTop: 4 },
  occupancyNote: { fontSize: 11, color: COLORS.textMuted, marginTop: 12, textAlign: "center", fontWeight: "600" },
  applyBtn: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    ...SHADOWS.small,
  },
  applyBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: COLORS.textMuted, marginTop: 10 },
});
