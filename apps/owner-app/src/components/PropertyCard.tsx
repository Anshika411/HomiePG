import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Animated } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface PropertyCardProps {
  building: any;
  onPress: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ building, onPress }) => {
  const occupied = building.occupied_beds ?? 0;
  const total = building.total_beds ?? 0;
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barWidth = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <TouchableOpacity style={styles.propertyCard} onPress={onPress}>
      <View style={styles.propertyImgPlaceholder}>
        <Text style={styles.propertyImgText}>🏠</Text>
      </View>
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyName} numberOfLines={1}>
          {building.building_name}
        </Text>
        <Text style={styles.propertyAddr} numberOfLines={1}>
          {building.address}, {building.city}
        </Text>
        <View style={styles.occupancyRow}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: barWidth }]} />
          </View>
          <Text style={styles.occupancyPct}>{pct}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  propertyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  propertyImgPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  propertyImgText: {
    fontSize: 24,
  },
  propertyInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  propertyName: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  propertyAddr: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  occupancyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  occupancyPct: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.textMuted,
    marginLeft: 10,
    minWidth: 28,
    textAlign: "right",
  },
});
