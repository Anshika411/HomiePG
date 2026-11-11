import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface BookingsScreenProps {
  bookings: any[];
}

export const BookingsScreen: React.FC<BookingsScreenProps> = ({ bookings }) => {
  return (
    <ScrollView style={styles.scrollArea} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>My Booking Applications</Text>
      {bookings.length > 0 ? (
        bookings.map((b) => {
          const status = b.booking_status || b.status || "Pending";
          const isApproved = status === "Approved";
          const isRejected = status === "Rejected";

          let badgeStyle = styles.badgePending;
          if (isApproved) badgeStyle = styles.badgeSuccess;
          else if (isRejected) badgeStyle = styles.badgeDanger;

          return (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {b.buildings?.building_name || "PG Accommodation"}
                </Text>
                <Text style={[styles.badge, badgeStyle]}>
                  {status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.bodyText}>
                Room: {b.rooms?.room_number || "Pending Approval"} · Bed: {b.beds?.bed_number || "Pending"}
              </Text>
              <Text style={styles.bodyText}>Move-In Date: {b.move_in_date}</Text>
              <Text style={styles.bodyText}>Advance Deposit Paid: ₹{b.advance_amount || 0}</Text>

              {status === "Pending" && (
                <View style={styles.pendingActionBox}>
                  <Text style={styles.actionPromptText}>
                    Your booking request is pending. Please transfer the advance deposit directly to the owner and contact them below to verify your payment and activate your stay.
                  </Text>
                  {b.owner_mobile ? (
                    <TouchableOpacity
                      style={styles.callOwnerBtn}
                      onPress={() => {
                        const url = `tel:${b.owner_mobile}`;
                        Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open dialer."));
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.callOwnerText}>📞 Call Owner ({b.owner_name}) to Verify</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            </View>
          );
        })
      ) : (
        <Text style={styles.emptyText}>No active booking requests found.</Text>
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
    paddingBottom: 85,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  pendingActionBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionPromptText: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  callOwnerBtn: {
    backgroundColor: COLORS.success,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  callOwnerText: {
    color: "#fff",
    fontSize: 11.5,
    fontWeight: "bold",
  },
  badgePending: {
    backgroundColor: COLORS.warningLight,
    color: COLORS.warning,
  },
  badgeSuccess: {
    backgroundColor: COLORS.successLight,
    color: COLORS.success,
  },
  badgeDanger: {
    backgroundColor: COLORS.dangerLight,
    color: COLORS.danger,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textMuted,
    marginTop: 30,
    fontSize: 14,
  },
});
