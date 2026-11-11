import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { COLORS } from "../styles/theme";

interface BookingRowProps {
  booking: any;
  onApprove: (booking: any) => void;
  onReject: (id: string) => void;
}

export const BookingRow: React.FC<BookingRowProps> = ({ booking, onApprove, onReject }) => {
  const profileName = booking.profiles?.full_name || "New Tenant";
  const avatarLetter = profileName[0] ? profileName[0].toUpperCase() : "T";
  const isPending = booking.booking_status === "Pending";

  return (
    <View style={styles.bookingRow}>
      <View style={styles.bookingAvatar}>
        <Text style={styles.bookingAvatarText}>{avatarLetter}</Text>
      </View>
      <View style={styles.bookingInfo}>
        <Text style={styles.bookingName}>{profileName}</Text>
        <Text style={styles.bookingMeta}>
          {booking.buildings?.building_name ?? "—"} · Move-in {booking.move_in_date ?? "—"}
        </Text>
      </View>
      {isPending ? (
        <View style={styles.bookingActions}>
          <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(booking)}>
            <Text style={styles.actionBtnText}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(booking.id)}>
            <Text style={styles.actionBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.statusBadge,
            booking.booking_status === "Approved" ? styles.badgeGreen : styles.badgeRed,
          ]}
        >
          <Text style={styles.statusBadgeText}>{booking.booking_status}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bookingRow: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookingAvatarText: {
    fontWeight: "bold",
    color: COLORS.primary,
    fontSize: 15,
  },
  bookingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bookingName: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  bookingMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bookingActions: {
    flexDirection: "row",
    gap: 8,
  },
  approveBtn: {
    backgroundColor: COLORS.success,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectBtn: {
    backgroundColor: COLORS.danger,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: COLORS.successLight,
  },
  badgeRed: {
    backgroundColor: COLORS.dangerLight,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
});
