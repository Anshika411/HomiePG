import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";
import { COLORS } from "../styles/theme";
import logoIcon from "../../assets/logo-icon.png";

interface HeaderProps {
  ownerName: string;
}

export const Header: React.FC<HeaderProps> = ({ ownerName }) => {
  const firstName = ownerName ? ownerName.split(" ")[0] : "Owner";

  return (
    <View style={styles.greetingRow}>
      <View>
        <Text style={styles.greetingHi}>Hi, {firstName} 👋</Text>
        <Text style={styles.greetingSub}>Welcome back!</Text>
      </View>
      <Image source={logoIcon} style={styles.headerLogo} />
    </View>
  );
};

const styles = StyleSheet.create({
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greetingHi: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  greetingSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerLogo: {
    width: 36,
    height: 36,
  },
});
