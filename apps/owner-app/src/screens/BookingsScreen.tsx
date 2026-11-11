import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { COLORS } from "../styles/theme";
import { BookingRow } from "../components/BookingRow";

interface BookingsScreenProps {
  bookings: any[];
  onApproveBooking: (booking: any) => void;
  onRejectBooking: (id: string) => void;
}

export const BookingsScreen: React.FC<BookingsScreenProps> = ({
  bookings,
  onApproveBooking,
  onRejectBooking,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.tabTitle}>All Booking Requests</Text>
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {bookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings found.</Text>
        ) : (
          bookings.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              onApprove={onApproveBooking}
              onReject={onRejectBooking}
            />
          ))
        )}
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
  },
});
