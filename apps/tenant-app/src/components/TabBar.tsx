import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface TabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { key: "home", label: "home", icon: "🏠" },
    { key: "search", label: "search", icon: "🔍" },
    { key: "booking", label: "booking", icon: "📅" },
    { key: "manage", label: "manage", icon: "💳" },
    { key: "complaints", label: "complaints", icon: "🛠️" },
    { key: "profile", label: "profile", icon: "👤" },
  ];

  return (
    <View style={styles.footerNav}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.navItem}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  footerNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 82,
    ...SHADOWS.large,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  navText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    textTransform: "capitalize",
  },
  navTextActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
});
