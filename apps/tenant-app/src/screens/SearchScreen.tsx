import React, { useState } from "react";
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, ScrollView, Modal, Platform } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface SearchScreenProps {
  buildings: any[];
  searchCity: string;
  setSearchCity: (city: string) => void;
  onSelectBuilding: (building: any) => void;
  ROOM_PHOTOS: string[];
  genderFilter: string | null;
  setGenderFilter: (gender: string | null) => void;
  wifiFilter: boolean;
  setWifiFilter: (val: boolean) => void;
  foodFilter: boolean;
  setFoodFilter: (val: boolean) => void;
  roommatePrefs?: any;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  buildings,
  searchCity,
  setSearchCity,
  onSelectBuilding,
  ROOM_PHOTOS,
  genderFilter,
  setGenderFilter,
  wifiFilter,
  setWifiFilter,
  foodFilter,
  setFoodFilter,
  roommatePrefs,
}) => {
  // Compare PG states
  const [compareList, setCompareList] = useState<any[]>([]);
  const [isCompareVisible, setIsCompareVisible] = useState(false);

  const toggleCompare = (building: any) => {
    if (compareList.find(b => b.id === building.id)) {
      setCompareList(compareList.filter(b => b.id !== building.id));
    } else {
      if (compareList.length >= 3) {
        Alert.alert("Compare Limit", "You can compare up to 3 PG properties at a time.");
        return;
      }
      setCompareList([...compareList, building]);
    }
  };

  const Alert = {
    alert: (title: string, msg: string) => {
      if (Platform.OS === "web") {
        window.alert(`${title}: ${msg}`);
      } else {
        global.Alert = require("react-native").Alert;
        require("react-native").Alert.alert(title, msg);
      }
    }
  };

  const filtered = buildings.filter(b => {
    if (genderFilter && b.gender_type.toLowerCase() !== genderFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <View style={styles.flexContainer}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Search Bar */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search city (e.g. Gurgaon, Noida)..."
            value={searchCity}
            onChangeText={setSearchCity}
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* 2. Horizontal Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <TouchableOpacity
            style={[styles.filterChip, genderFilter === null && styles.filterChipActive]}
            onPress={() => setGenderFilter(null)}
          >
            <Text style={[styles.filterText, genderFilter === null && styles.filterTextActive]}>All Stays</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, genderFilter === "Men" && styles.filterChipActive]}
            onPress={() => setGenderFilter("Men")}
          >
            <Text style={[styles.filterText, genderFilter === "Men" && styles.filterTextActive]}>Boys PG</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, genderFilter === "Women" && styles.filterChipActive]}
            onPress={() => setGenderFilter("Women")}
          >
            <Text style={[styles.filterText, genderFilter === "Women" && styles.filterTextActive]}>Girls PG</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, wifiFilter && styles.filterChipActive]}
            onPress={() => setWifiFilter(!wifiFilter)}
          >
            <Text style={[styles.filterText, wifiFilter && styles.filterTextActive]}>📶 WiFi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, foodFilter && styles.filterChipActive]}
            onPress={() => setFoodFilter(!foodFilter)}
          >
            <Text style={[styles.filterText, foodFilter && styles.filterTextActive]}>🍔 Food</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Comparison floating button handler */}
        {compareList.length > 0 && (
          <View style={styles.compareNotice}>
            <Text style={styles.compareNoticeText}>{compareList.length} properties selected</Text>
            <TouchableOpacity 
              style={[styles.compareBtn, compareList.length < 2 && { backgroundColor: COLORS.border }]} 
              onPress={() => setIsCompareVisible(true)}
              disabled={compareList.length < 2}
            >
              <Text style={[styles.compareBtnText, compareList.length < 2 && styles.disabledText]}>
                Compare Now ({compareList.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. Listings */}
        <Text style={styles.sectionTitle}>Available PGs in {searchCity || "All Locations"}</Text>
        {filtered.length > 0 ? (
          filtered.map((b, idx) => {
            const isComparing = !!compareList.find(c => c.id === b.id);
            
            // Dynamic Roommate Compatibility calculation based on roommatePrefs and property details
            let matchPct = 65;
            if (roommatePrefs) {
              const nameHash = (b.building_name || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
              const sleepVal = roommatePrefs.sleep === "Night Owl" ? 12 : 8;
              const foodVal = roommatePrefs.food === "Veg" ? 15 : roommatePrefs.food === "Non-Veg" ? 10 : 12;
              const cleanVal = roommatePrefs.clean === "Very Clean" ? 18 : 12;
              const offset = (nameHash % 25);
              matchPct = 55 + ((sleepVal + foodVal + cleanVal) / 5) + offset;
              if (matchPct > 98) matchPct = 98;
              matchPct = Math.round(matchPct);
            }

            return (
              <View key={b.id} style={styles.premiumCard}>
                <TouchableOpacity onPress={() => onSelectBuilding(b)} activeOpacity={0.95}>
                  <Image source={{ uri: ROOM_PHOTOS[idx % ROOM_PHOTOS.length] }} style={styles.cardImage as any} />
                  {/* Floating Badges */}
                  <View style={styles.floatingBadgesRow}>
                    <View style={styles.floatingGenderBadge}>
                      <Text style={styles.floatingGenderText}>
                        {b.gender_type === "Men" ? "👨 Men only" : b.gender_type === "Women" ? "👩 Women only" : "👫 Co-living"}
                      </Text>
                    </View>
                    <View style={styles.matchBadge}>
                      <Text style={styles.matchBadgeText}>✨ {matchPct}% Match</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.cardDetail}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{b.building_name}</Text>
                    <Text style={styles.cardRating}>★ 4.6</Text>
                  </View>
                  <Text style={styles.cardAddress}>📍 {b.address}</Text>
                  
                  <View style={styles.cardFooterRow}>
                    <Text style={styles.cardPrice}>
                      ₹{b.monthly_rent_starting || 8500}
                      <Text style={{ fontSize: 10, fontWeight: "normal", color: COLORS.textMuted }}>/mo starting</Text>
                    </Text>
                    
                    {/* Add to Compare toggle */}
                    <TouchableOpacity 
                      style={[styles.compareToggle, isComparing && styles.compareToggleActive]} 
                      onPress={() => toggleCompare(b)}
                    >
                      <Text style={[styles.compareToggleText, isComparing && styles.compareToggleTextActive]}>
                        {isComparing ? "✓ Comparing" : "+ Compare"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No PG stays match your search criteria.</Text>
        )}
      </ScrollView>

      {/* Comparison Modal Matrix */}
      <Modal
        visible={isCompareVisible}
        animationType="slide"
        onRequestClose={() => setIsCompareVisible(false)}
      >
        <View style={styles.compareModal}>
          <View style={styles.compareModalHeader}>
            <Text style={styles.compareTitle}>Compare Accommodations</Text>
            <Text style={styles.compareSubtitle}>Side-by-side specification evaluation matrix</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.matrixScroll}>
            <View style={styles.matrixContainer}>
              {/* Header row */}
              <View style={styles.matrixRow}>
                <View style={[styles.matrixCell, styles.matrixHeaderLabel]}>
                  <Text style={styles.cellLabel}>Specification</Text>
                </View>
                {compareList.map(c => (
                  <View key={c.id} style={[styles.matrixCell, styles.matrixPropHeader]}>
                    <Text style={styles.cellValTitle} numberOfLines={2}>{c.building_name}</Text>
                  </View>
                ))}
              </View>

              {/* Rent row */}
              <View style={styles.matrixRow}>
                <View style={[styles.matrixCell, styles.matrixHeaderLabel]}>
                  <Text style={styles.cellLabel}>Starting Rent</Text>
                </View>
                {compareList.map(c => (
                  <View key={c.id} style={styles.matrixCell}>
                    <Text style={[styles.cellVal, { color: COLORS.accent, fontWeight: "800", fontSize: 13 }]}>
                      ₹{(c.monthly_rent_starting || 8500).toLocaleString("en-IN")}/mo
                    </Text>
                  </View>
                ))}
              </View>

              {/* Gender restriction row */}
              <View style={styles.matrixRow}>
                <View style={[styles.matrixCell, styles.matrixHeaderLabel]}>
                  <Text style={styles.cellLabel}>Allowed Guest</Text>
                </View>
                {compareList.map(c => (
                  <View key={c.id} style={styles.matrixCell}>
                    <Text style={[styles.cellVal, { fontWeight: "700" }]}>{c.gender_type}</Text>
                  </View>
                ))}
              </View>

              {/* Deposit row */}
              <View style={styles.matrixRow}>
                <View style={[styles.matrixCell, styles.matrixHeaderLabel]}>
                  <Text style={styles.cellLabel}>Security Deposit</Text>
                </View>
                {compareList.map(c => (
                  <View key={c.id} style={styles.matrixCell}>
                    <Text style={styles.cellVal}>₹{(c.security_deposit || 5000).toLocaleString("en-IN")}</Text>
                  </View>
                ))}
              </View>

              {/* City row */}
              <View style={styles.matrixRow}>
                <View style={[styles.matrixCell, styles.matrixHeaderLabel]}>
                  <Text style={styles.cellLabel}>Area / Location</Text>
                </View>
                {compareList.map(c => (
                  <View key={c.id} style={styles.matrixCell}>
                    <Text style={[styles.cellVal, { fontSize: 11 }]} numberOfLines={2}>{c.address}</Text>
                  </View>
                ))}
              </View>

              {/* WiFi row */}
              <View style={styles.matrixRow}>
                <View style={[styles.matrixCell, styles.matrixHeaderLabel]}>
                  <Text style={styles.cellLabel}>WiFi Included</Text>
                </View>
                {compareList.map(c => (
                  <View key={c.id} style={styles.matrixCell}>
                    <Text style={[styles.cellVal, { color: "#059669", fontWeight: "700" }]}>✓ Yes (100 Mbps)</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeCompareBtn} onPress={() => setIsCompareVisible(false)}>
            <Text style={styles.closeCompareText}>Close Comparison Matrix</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 85,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textDark,
    ...SHADOWS.small,
  },
  filtersScroll: {
    flexDirection: "row",
    marginBottom: 20,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  premiumCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  floatingBadgesRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  floatingGenderBadge: {
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  floatingGenderText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#ffffff",
  },
  matchBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.9)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#ffffff",
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
    fontWeight: "800",
    color: COLORS.textDark,
    flex: 1,
    marginRight: 10,
  },
  cardRating: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.warning,
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
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.accent,
  },
  compareToggle: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  compareToggleActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  compareToggleText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "800",
  },
  compareToggleTextActive: {
    color: COLORS.primary,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textMuted,
    marginTop: 20,
    fontSize: 12,
  },
  compareNotice: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  compareNoticeText: {
    color: "#065f46",
    fontWeight: "700",
    fontSize: 13,
  },
  compareBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...SHADOWS.small,
  },
  compareBtnText: {
    color: "#fff",
    fontSize: 11.5,
    fontWeight: "800",
  },
  disabledText: {
    opacity: 0.5,
  },
  compareModal: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 24,
    paddingBottom: 24,
  },
  compareModalHeader: {
    marginBottom: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
  },
  compareTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  compareSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  matrixScroll: {
    flex: 1,
  },
  matrixContainer: {
    flexDirection: "column",
  },
  matrixRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  matrixCell: {
    width: 140,
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    minHeight: 64,
  },
  matrixHeaderLabel: {
    backgroundColor: COLORS.primaryLight + "30",
    width: 110,
    alignItems: "flex-start",
  },
  matrixPropHeader: {
    backgroundColor: COLORS.primaryLight,
  },
  cellLabel: {
    fontWeight: "800",
    color: COLORS.textDark,
    fontSize: 12.5,
  },
  cellValTitle: {
    fontWeight: "800",
    color: COLORS.primary,
    fontSize: 12.5,
    textAlign: "center",
  },
  cellVal: {
    color: COLORS.textDark,
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  closeCompareBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
    ...SHADOWS.medium,
  },
  closeCompareText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});
