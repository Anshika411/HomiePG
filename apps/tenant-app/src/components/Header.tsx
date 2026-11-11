import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { COLORS, TYPOGRAPHY } from "../styles/theme";

interface HeaderProps {
  userName: string;
  onAvatarPress: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userName, onAvatarPress }) => {
  const firstName = userName ? userName.split(" ")[0] : "Ananya";
  const avatarLetter = userName ? userName[0] : "A";

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.welcomeText}>Hi, {firstName} 👋</Text>
        <Text style={styles.subWelcomeText}>Find your perfect PG</Text>
      </View>
      <TouchableOpacity style={styles.profileAvatar} onPress={onAvatarPress}>
        <Text style={styles.avatarText}>{avatarLetter.toUpperCase()}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
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
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  subWelcomeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 18,
  },
});
