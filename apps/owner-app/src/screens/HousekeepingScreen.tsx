import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Alert, RefreshControl
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

const HOUSEKEEPER_STATUS_CONFIG = {
  ready: { label: "Ready", color: COLORS.success, icon: "🟢", bg: COLORS.successLight },
  cleaning: { label: "Cleaning", color: COLORS.warning, icon: "🟡", bg: COLORS.warningLight },
  maintenance: { label: "Maintenance", color: COLORS.danger, icon: "🔴", bg: COLORS.dangerLight },
  vacant_ready: { label: "Vacant Ready", color: "#2563EB", icon: "🔵", bg: "#DBEAFE" },
};

type HkStatus = "ready" | "cleaning" | "maintenance" | "vacant_ready";

interface HousekeepingScreenProps {
  apiBase: string;
  token: string;
  buildings: any[];
  buildingDetail: any;
  onSelectBuilding: (building: any) => void;
}

export const HousekeepingScreen: React.FC<HousekeepingScreenProps> = ({
  apiBase, token, buildings, buildingDetail, onSelectBuilding
}) => {
  const [selectedBuildingId, setSelectedBuildingId] = useState(buildings[0]?.id || "");
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusModal, setStatusModal] = useState<{ roomId: string; buildingId: string; current: HkStatus } | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchRooms = async (buildingId: string) => {
    if (!buildingId) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/buildings/${buildingId}`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const detail = await res.json();
      // Flatten floors → rooms
      const allRooms: any[] = [];
      (detail.floors || []).forEach((fl: any) => {
        (fl.rooms || []).forEach((r: any) => {
          allRooms.push({ ...r, floor_number: fl.floor_number, building_id: buildingId });
        });
      });
      setRooms(allRooms);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (selectedBuildingId) fetchRooms(selectedBuildingId);
  }, [selectedBuildingId]);

  const updateStatus = async (roomId: string, buildingId: string, newStatus: HkStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`${apiBase}/api/buildings/${buildingId}/rooms/${roomId}/housekeeping-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({ housekeeping_status: newStatus })
      });
      const data = await res.json();
      if (data.error) Alert.alert("Error", data.error);
      else {
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, housekeeping_status: newStatus } : r));
        setStatusModal(null);
      }
    } catch { Alert.alert("Error", "Failed to update status"); }
    setUpdating(false);
  };

  const counts = Object.keys(HOUSEKEEPER_STATUS_CONFIG).reduce((acc, key) => {
    acc[key] = rooms.filter(r => (r.housekeeping_status || "ready") === key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>🧹 Housekeeping</Text>

      {/* Building Picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buildingRow}>
        {buildings.map(b => (
          <TouchableOpacity
            key={b.id}
            style={[styles.buildingChip, selectedBuildingId === b.id && styles.buildingChipActive]}
            onPress={() => setSelectedBuildingId(b.id)}
          >
            <Text style={[styles.buildingChipText, selectedBuildingId === b.id && styles.buildingChipTextActive]} numberOfLines={1}>
              {b.building_name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        {Object.entries(HOUSEKEEPER_STATUS_CONFIG).map(([key, cfg]) => (
          <View key={key} style={[styles.summaryCard, { backgroundColor: cfg.bg }]}>
            <Text style={styles.summaryIcon}>{cfg.icon}</Text>
            <Text style={[styles.summaryCount, { color: cfg.color }]}>{counts[key] || 0}</Text>
            <Text style={styles.summaryLabel}>{cfg.label}</Text>
          </View>
        ))}
      </View>

      {/* Room List */}
      {loading ? <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} /> : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRooms(selectedBuildingId); }} tintColor={COLORS.accent} />}
        >
          {rooms.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyText}>No rooms found.</Text>
            </View>
          ) : (
            rooms.map(room => {
              const status = (room.housekeeping_status || "ready") as HkStatus;
              const cfg = HOUSEKEEPER_STATUS_CONFIG[status] || HOUSEKEEPER_STATUS_CONFIG.ready;
              return (
                <TouchableOpacity
                  key={room.id}
                  style={styles.roomCard}
                  onPress={() => setStatusModal({ roomId: room.id, buildingId: room.building_id, current: status })}
                >
                  <View style={styles.roomLeft}>
                    <Text style={styles.roomNumber}>Room {room.room_number}</Text>
                    <Text style={styles.roomFloor}>Floor {room.floor_number} · {room.room_type || "Standard"}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={styles.statusIcon}>{cfg.icon}</Text>
                    <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Status Change Modal */}
      <Modal visible={!!statusModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Update Room Status</Text>
            <Text style={styles.modalSub}>Select new housekeeping status</Text>
            {Object.entries(HOUSEKEEPER_STATUS_CONFIG).map(([key, cfg]) => (
              <TouchableOpacity
                key={key}
                style={[styles.statusOption, statusModal?.current === key && styles.statusOptionActive]}
                onPress={() => statusModal && updateStatus(statusModal.roomId, statusModal.buildingId, key as HkStatus)}
                disabled={updating}
              >
                <Text style={styles.statusOptionIcon}>{cfg.icon}</Text>
                <Text style={[styles.statusOptionText, { color: cfg.color }]}>{cfg.label}</Text>
                {statusModal?.current === key && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setStatusModal(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
  screenTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textDark, marginBottom: 12 },
  buildingRow: { marginBottom: 14 },
  buildingChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.cardBg },
  buildingChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  buildingChipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "600" },
  buildingChipTextActive: { color: "#fff" },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 10, alignItems: "center" },
  summaryIcon: { fontSize: 18, marginBottom: 4 },
  summaryCount: { fontSize: 22, fontWeight: "900" },
  summaryLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, textAlign: "center" },
  roomCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    ...SHADOWS.small
  },
  roomLeft: {},
  roomNumber: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  roomFloor: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  statusIcon: { fontSize: 12 },
  statusLabel: { fontSize: 12, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.textMuted },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 4 },
  modalSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  statusOption: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  statusOptionActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  statusOptionIcon: { fontSize: 20 },
  statusOptionText: { fontSize: 15, fontWeight: "700", flex: 1 },
  checkmark: { fontSize: 16, color: COLORS.accent, fontWeight: "800" },
  cancelBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: "700" },
});
