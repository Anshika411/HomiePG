import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";
import { PropertyCard } from "../components/PropertyCard";

interface PropertiesScreenProps {
  buildings: any[];
  onSelectBuilding: (b: any) => void;
  onOpenAddModal: () => void;
}

export const PropertiesScreen: React.FC<PropertiesScreenProps> = ({
  buildings,
  onSelectBuilding,
  onOpenAddModal,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.tabTitle}>My Properties</Text>
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {buildings.length === 0 ? (
          <Text style={styles.emptyText}>No properties registered yet.</Text>
        ) : (
          buildings.map((b) => (
            <PropertyCard
              key={b.id}
              building={b}
              onPress={() => onSelectBuilding(b)}
            />
          ))
        )}
        <TouchableOpacity style={styles.addPropertyBtn} onPress={onOpenAddModal}>
          <Text style={styles.addPropertyBtnText}>+ Add New Property</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 16,
  },
  scrollArea: {
    flex: 1,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: 40,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  addPropertyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    ...SHADOWS.small,
  },
  addPropertyBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
