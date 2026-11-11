import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, RefreshControl, Platform
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface RoomInventoryScreenProps {
  apiBase: string;
  token: string;
  roomId: string;
  roomNumber: string;
  buildingId: string;
  onClose: () => void;
}

const getItemIcon = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("conditioner") || lower.includes("ac") || lower === "ac") return "❄️";
  if (lower.includes("geyser") || lower.includes("heater") || lower.includes("water")) return "🔥";
  if (lower.includes("mattress") || lower.includes("bed") || lower.includes("cot")) return "🛏️";
  if (lower.includes("tv") || lower.includes("television") || lower.includes("screen")) return "📺";
  if (lower.includes("wifi") || lower.includes("internet") || lower.includes("router")) return "📶";
  if (lower.includes("fan") || lower.includes("cooler")) return "🌀";
  if (lower.includes("desk") || lower.includes("table") || lower.includes("chair")) return "🪑";
  if (lower.includes("wardrobe") || lower.includes("almirah") || lower.includes("locker")) return "🚪";
  return "📦";
};

export const RoomInventoryScreen: React.FC<RoomInventoryScreenProps> = ({
  apiBase, token, roomId, roomNumber, buildingId, onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [itemName, setItemName] = useState("");
  const [status, setStatus] = useState("working");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${apiBase}/api/inventory/${roomId}`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchInventory(); }, [roomId]);

  const createItem = async () => {
    if (!itemName) {
      Alert.alert("Error", "Item name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ room_id: roomId, building_id: buildingId, item_name: itemName, status, notes })
      });
      const data = await res.json();
      if (data.error) Alert.alert("Error", data.error);
      else {
        setAddModal(false);
        setItemName(""); setNotes(""); setStatus("working");
        fetchInventory();
      }
    } catch { Alert.alert("Error", "Failed to add inventory item"); }
    setSaving(false);
  };

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      await fetch(`${apiBase}/api/inventory/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ status: newStatus })
      });
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, status: newStatus, last_checked: new Date().toISOString().split("T")[0] } : item));
    } catch {
      Alert.alert("Error", "Failed to update item status");
    }
  };

  const deleteItem = (id: string) => {
    Alert.alert("Delete", "Remove this item from inventory?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await fetch(`${apiBase}/api/inventory/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
        });
        fetchInventory();
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backText}>◀ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🚪 Room {roomNumber} Inventory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)}>
          <Text style={styles.addBtnText}>+ Add Asset</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} /> : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInventory(); }} tintColor={COLORS.accent} />}
        >
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No Tracked Assets</Text>
              <Text style={styles.emptyText}>Add amenities, appliances, or furniture to track status.</Text>
            </View>
          ) : (
            items.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemMeta}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.itemIcon}>{getItemIcon(item.item_name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.item_name}</Text>
                    {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
                    <Text style={styles.itemChecked}>Last inspected: {item.last_checked}</Text>
                  </View>
                  <TouchableOpacity style={styles.delBtn} onPress={() => deleteItem(item.id)}>
                    <Text style={styles.delBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {/* Custom Styled Status Selectors Row */}
                <View style={styles.statusSelectors}>
                  {["working", "needs_service", "damaged"].map(s => {
                    const isActive = item.status === s;
                    let activeBg = "rgba(16,185,129,0.08)";
                    let activeBorder = "rgba(16,185,129,0.4)";
                    let activeTextCol = "#059669";
                    let label = "🟢 Working";

                    if (s === "needs_service") {
                      activeBg = "rgba(245,158,11,0.08)";
                      activeBorder = "rgba(245,158,11,0.4)";
                      activeTextCol = "#d97706";
                      label = "🟡 Service";
                    } else if (s === "damaged") {
                      activeBg = "rgba(239,68,68,0.08)";
                      activeBorder = "rgba(239,68,68,0.4)";
                      activeTextCol = "#dc2626";
                      label = "🔴 Broken";
                    }

                    return (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.statusBtn,
                          isActive ? { backgroundColor: activeBg, borderColor: activeBorder, borderWidth: 1.5 } : null
                        ]}
                        onPress={() => updateItemStatus(item.id, s)}
                      >
                        <Text style={[
                          styles.statusBtnText,
                          isActive ? { color: activeTextCol, fontWeight: "800" } : null
                        ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Item Modal */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Room Asset</Text>
              <TouchableOpacity style={styles.closeHeaderBtn} onPress={() => setAddModal(false)}>
                <Text style={styles.closeHeaderBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
              <Text style={styles.inputLabel}>Asset Name / Description</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Voltas 1.5 Ton AC, Havells Geyser"
                value={itemName}
                onChangeText={setItemName}
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Asset Status</Text>
              <View style={styles.statusGrid}>
                {["working", "needs_service", "damaged"].map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusOption, status === s && styles.statusOptionActive]}
                    onPress={() => setStatus(s)}
                  >
                    <Text style={[styles.statusOptionText, status === s && styles.statusOptionTextActive]}>
                      {s === "working" ? "🟢 Working" : s === "needs_service" ? "🟡 Service" : "🔴 Damaged"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Initial Notes</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Wardrobe lower drawer lock missing..."
                value={notes}
                onChangeText={setNotes}
                placeholderTextColor={COLORS.textMuted}
              />
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={createItem} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Add to Room"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === "ios" ? 50 : 20 
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
  },
  backBtn: { 
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  backText: { 
    fontSize: 12, 
    color: COLORS.primary, 
    fontWeight: "800" 
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: COLORS.textDark, 
    flex: 1, 
    textAlign: "center" 
  },
  addBtn: { 
    backgroundColor: COLORS.accent, 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    ...SHADOWS.small,
  },
  addBtnText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 12 
  },
  itemRow: { 
    backgroundColor: COLORS.cardBg, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  itemMeta: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: {
    fontSize: 22,
  },
  itemName: { 
    fontSize: 14, 
    fontWeight: "800", 
    color: COLORS.textDark 
  },
  itemNotes: { 
    fontSize: 12, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  itemChecked: { 
    fontSize: 10, 
    color: COLORS.textMuted, 
    marginTop: 6 
  },
  statusSelectors: { 
    flexDirection: "row", 
    gap: 8, 
    marginTop: 14, 
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  statusBtn: { 
    flex: 1,
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 10, 
    paddingVertical: 7,
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
  },
  statusBtnText: { 
    fontSize: 11, 
    color: COLORS.textMuted, 
    fontWeight: "600" 
  },
  delBtn: { 
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  delBtnText: { 
    fontSize: 14 
  },
  emptyState: { 
    alignItems: "center", 
    paddingVertical: 80,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  emptyIcon: { 
    fontSize: 54, 
    marginBottom: 16 
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  emptyText: { 
    fontSize: 12, 
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "flex-end" 
  },
  modalBox: { 
    backgroundColor: COLORS.cardBg, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: COLORS.textDark 
  },
  closeHeaderBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
  },
  closeHeaderBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textMuted,
  },
  inputLabel: { 
    fontSize: 11, 
    fontWeight: "700", 
    color: COLORS.textMuted, 
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: { 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 14, 
    color: COLORS.textDark, 
    marginBottom: 14, 
    backgroundColor: COLORS.primaryLight + "30" 
  },
  statusGrid: { 
    flexDirection: "row", 
    gap: 8, 
    marginBottom: 14 
  },
  statusOption: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 12, 
    paddingVertical: 10, 
    alignItems: "center", 
    backgroundColor: COLORS.cardBg 
  },
  statusOptionActive: { 
    borderColor: COLORS.accent, 
    backgroundColor: COLORS.accentLight 
  },
  statusOptionText: { 
    fontSize: 11, 
    color: COLORS.textMuted, 
    fontWeight: "600" 
  },
  statusOptionTextActive: { 
    color: COLORS.accent, 
    fontWeight: "800" 
  },
  modalBtns: { 
    flexDirection: "row", 
    gap: 12, 
    marginTop: 12 
  },
  cancelBtn: { 
    flex: 1, 
    borderWidth: 1.5, 
    borderColor: COLORS.border, 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: "center" 
  },
  cancelBtnText: { 
    color: COLORS.textMuted, 
    fontWeight: "800" 
  },
  saveBtn: { 
    flex: 1, 
    backgroundColor: COLORS.accent, 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: "center",
    ...SHADOWS.small,
  },
  saveBtnText: { 
    color: "#fff", 
    fontWeight: "800" 
  },
});

