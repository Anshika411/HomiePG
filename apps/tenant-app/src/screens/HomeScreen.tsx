import React from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from "react-native";
import { COLORS, SHADOWS, TYPOGRAPHY } from "../styles/theme";

interface HomeScreenProps {
  buildings: any[];
  onSelectBuilding: (building: any) => void;
  onExploreStays: () => void;
  ROOM_PHOTOS: string[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  buildings,
  onSelectBuilding,
  onExploreStays,
  ROOM_PHOTOS,
}) => {
  // AI recommendation mock
  const aiRecommended = buildings.length > 1 ? buildings[1] : buildings[0];

  return (
    <ScrollView style={styles.scrollArea} contentContainerStyle={styles.container}>
      {/* 1. Promo Banner */}
      <View style={styles.promoBanner}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80" }}
          style={styles.promoBannerBg}
        />
        <View style={styles.promoOverlay}>
          <Text style={styles.promoBadge}>PREMIUM</Text>
          <Text style={styles.promoTitle}>Co-Living Reimagined</Text>
          <Text style={styles.promoSubtitle}>Book verified rooms with active communities</Text>
          <TouchableOpacity style={styles.promoBtn} onPress={onExploreStays}>
            <Text style={styles.promoBtnText}>Explore Stays</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. AI Recommendation Module */}
      {aiRecommended && (
        <View style={styles.aiSection}>
          <View style={styles.aiHeaderRow}>
            <Text style={styles.sectionTitle}>Smart Matches for You</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>🪄 AI Match</Text>
            </View>
          </View>
          <Text style={styles.aiSubText}>Based on your roommate and comfort profile</Text>
          
          <TouchableOpacity
            style={styles.aiCard}
            onPress={() => onSelectBuilding(aiRecommended)}
          >
            <Image
              source={{ uri: ROOM_PHOTOS[1 % ROOM_PHOTOS.length] }}
              style={styles.aiCardImage}
            />
            <View style={styles.aiCardContent}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{aiRecommended.building_name}</Text>
                <Text style={styles.cardGenderLabel}>{aiRecommended.gender_type}</Text>
              </View>
              <Text style={styles.cardAddress}>📍 {aiRecommended.address}</Text>
              <Text style={styles.aiReasonText}>💡 High roommate compatibility & within budget</Text>
              <View style={styles.cardFooterRow}>
                <Text style={styles.cardPrice}>
                  ₹{aiRecommended.monthly_rent_starting || 8500}
                  <Text style={{ fontSize: 11, fontWeight: "normal" }}>/mo</Text>
                </Text>
                <Text style={styles.cardRating}>★ 4.8 (85)</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Featured Accommodations */}
      <Text style={styles.sectionTitle}>Featured PG Accommodations</Text>
      {buildings.length > 0 ? (
        buildings.slice(0, 2).map((b, idx) => (
          <TouchableOpacity
            key={b.id}
            style={styles.premiumCard}
            onPress={() => onSelectBuilding(b)}
          >
            <Image
              source={{ uri: ROOM_PHOTOS[idx % ROOM_PHOTOS.length] }}
              style={styles.cardImage}
            />
            <View style={styles.cardDetail}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{b.building_name}</Text>
                <Text style={styles.cardGenderLabel}>{b.gender_type}</Text>
              </View>
              <Text style={styles.cardAddress}>📍 {b.address}</Text>
              <View style={styles.cardFooterRow}>
                <Text style={styles.cardPrice}>
                  ₹{b.monthly_rent_starting || 8500}
                  <Text style={{ fontSize: 11, fontWeight: "normal" }}>/month</Text>
                </Text>
                <Text style={styles.cardRating}>★ 4.6 (120)</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>No PG stays loaded.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
    paddingBottom: 85, // clear bottom navigation bar
  },
  promoBanner: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    position: "relative",
  },
  promoBannerBg: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    padding: 20,
    justifyContent: "center",
  },
  promoBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.accent,
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  promoTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  promoSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 16,
  },
  promoBtn: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  promoBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  premiumCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  cardImage: {
    width: "100%",
    height: 160,
  },
  cardDetail: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
    flex: 1,
    marginRight: 10,
  },
  cardGenderLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardAddress: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.accent,
  },
  cardRating: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.warning,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textMuted,
    marginTop: 20,
    fontSize: 14,
  },
  aiSection: {
    marginBottom: 24,
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  aiHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7DD3FC",
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0369A1",
  },
  aiSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: -8,
    marginBottom: 12,
  },
  aiCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  aiCardImage: {
    width: "100%",
    height: 120,
  },
  aiCardContent: {
    padding: 12,
  },
  aiReasonText: {
    fontSize: 11,
    color: "#0284C7",
    fontWeight: "600",
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
});
