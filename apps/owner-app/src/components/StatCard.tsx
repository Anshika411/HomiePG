import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
});
