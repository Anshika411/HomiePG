import React, { useEffect, useState } from "react";
import {
  Modal, StyleSheet, View, Text, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface RoomAllocationModalProps {
  visible: boolean;
  booking: any;
  apiBase: string;
  token: string;
  onClose: () => void;
  onConfirm: (bookingId: string, status: "Approved", roomId?: string, bedId?: string) => void;
}

export const RoomAllocationModal: React.FC<RoomAllocationModalProps> = ({
  visible,
  booking,
  apiBase,
  token,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const gender = booking.profiles?.gender || "Male";
      const budget = booking.advance_amount || 0;
      const res = await fetch(
        `${apiBase}/api/buildings/${booking.building_id}/room-suggestions?gender=${gender}&budget=${budget}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "bypass-tunnel-reminder": "true"
          }
        }
      );
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not load room recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && booking) {
      setSelectedSuggestion(null);
      fetchSuggestions();
    }
  }, [visible, booking]);

  const handleApprove = () => {
    if (selectedSuggestion) {
      // Approve with alternative room allocation
      onConfirm(booking.id, "Approved", selectedSuggestion.roomId, selectedSuggestion.bedId);
    } else {
      // Approve with original requested room allocation
      onConfirm(booking.id, "Approved", booking.room_id, booking.bed_id);
    }
    onClose();
  };

  if (!booking) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Approve & Allocate Room</Text>
          <Text style={styles.modalSub}>
            Tenant: {booking.profiles?.full_name || "New Tenant"} ({booking.profiles?.email || ""})
          </Text>

          {/* Requested Details */}
          <View style={styles.requestedBox}>
            <Text style={styles.requestedTitle}>Requested Accommodation</Text>
            <Text style={styles.requestedVal}>
              🏢 {booking.buildings?.building_name}
            </Text>
            <Text style={styles.requestedVal}>
              🚪 Room: {booking.rooms?.room_number} (Bed: {booking.beds?.bed_number})
            </Text>
            <Text style={styles.requestedVal}>
              💵 Paid Deposit: ₹{booking.advance_amount || 0}
            </Text>
          </View>

          {/* AI Suggestions */}
          <Text style={styles.sectionHeader}>💡 AI-Recommended Alternative Rooms</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 30 }} />
          ) : suggestions.length === 0 ? (
            <Text style={styles.emptyText}>No vacant matching rooms found in this building.</Text>
          ) : (
            <ScrollView style={styles.suggestionsScroll} showsVerticalScrollIndicator={false}>
              {suggestions.map((s, idx) => {
                const isSelected = selectedSuggestion?.roomId === s.roomId;
                return (
                  <TouchableOpacity
                    key={s.roomId}
                    style={[styles.suggestCard, isSelected && styles.selectedCard]}
                    onPress={() => setSelectedSuggestion(isSelected ? null : s)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.suggestRoomNum}>🚪 Room {s.roomNumber}</Text>
                      <View style={[styles.badge, s.score >= 70 ? styles.badgeGreen : styles.badgeBlue]}>
                        <Text style={styles.badgeText}>{s.matchLabel}</Text>
                      </View>
                    </View>

                    <Text style={styles.suggestMeta}>
                      Type: {s.roomType} · Rent: ₹{s.rent}/mo
                    </Text>

                    <View style={styles.tagRow}>
                      {s.reasons.map((r: string, rIdx: number) => (
                        <View key={rIdx} style={styles.tag}>
                          <Text style={styles.tagText}>{r}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Actions */}
          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleApprove}>
              <Text style={styles.saveBtnText}>
                {selectedSuggestion ? "Allocate Selection" : "Keep Original & Approve"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%" },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 4 },
  modalSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  requestedBox: { backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 12, marginBottom: 16 },
  requestedTitle: { fontSize: 11, fontWeight: "800", color: COLORS.primary, textTransform: "uppercase", marginBottom: 6 },
  requestedVal: { fontSize: 13, color: COLORS.textDark, fontWeight: "600", marginTop: 2 },
  sectionHeader: { fontSize: 13, fontWeight: "700", color: COLORS.textDark, marginBottom: 10 },
  suggestionsScroll: { maxHeight: 200, marginBottom: 16 },
  emptyText: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginVertical: 20 },
  suggestCard: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  selectedCard: { borderColor: COLORS.primary, borderWidth: 1.5, backgroundColor: COLORS.primaryLight + "15" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  suggestRoomNum: { fontSize: 14, fontWeight: "bold", color: COLORS.textDark },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeGreen: { backgroundColor: COLORS.successLight },
  badgeBlue: { backgroundColor: COLORS.primaryLight },
  badgeText: { fontSize: 10, fontWeight: "bold", color: COLORS.textDark },
  suggestMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  tagRow: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  tag: { backgroundColor: COLORS.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 9, color: COLORS.textMuted, fontWeight: "600" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: "700" },
  saveBtn: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 12, padding: 14, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "800" },
});
