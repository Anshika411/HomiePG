import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, RefreshControl
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface NoticesScreenProps {
  apiBase: string;
  token: string;
  buildings: any[];
}

export const NoticesScreen: React.FC<NoticesScreenProps> = ({ apiBase, token, buildings }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [selectedBuilding, setSelectedBuilding] = useState(buildings[0]?.id || "");
  const [saving, setSaving] = useState(false);

  const fetchNotices = async () => {
    try {
      const res = await fetch(`${apiBase}/api/notices`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setNotices(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchNotices(); }, []);

  const createNotice = async () => {
    if (!title || !message) {
      Alert.alert("Error", "Title and message are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/notices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ building_id: selectedBuilding || null, title, message, category })
      });
      const data = await res.json();
      if (data.error) Alert.alert("Error", data.error);
      else {
        setAddModal(false);
        setTitle(""); setMessage("");
        fetchNotices();
      }
    } catch { Alert.alert("Error", "Failed to broadcast notice"); }
    setSaving(false);
  };

  const deleteNotice = (id: string) => {
    Alert.alert("Delete", "Delete this notice announcement?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await fetch(`${apiBase}/api/notices/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
        });
        fetchNotices();
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>📢 Announcements</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} /> : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotices(); }} tintColor={COLORS.accent} />}
        >
          {notices.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📢</Text>
              <Text style={styles.emptyText}>No active notices.</Text>
            </View>
          ) : (
            notices.map(n => (
              <TouchableOpacity key={n.id} style={styles.noticeCard} onLongPress={() => deleteNotice(n.id)}>
                <View style={styles.noticeHeader}>
                  <View style={styles.titleRow}>
                    <Text style={styles.noticeCategory}>
                      {n.category === "urgent" ? "🚨 URGENT" : "📢 NOTICE"}
                    </Text>
                    <Text style={styles.noticeTitle}>{n.title}</Text>
                  </View>
                  <Text style={styles.noticeTime}>{new Date(n.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.noticeBody}>{n.message}</Text>
              </TouchableOpacity>
            ))
          )}
          <Text style={styles.hint}>Long press an announcement to delete</Text>
        </ScrollView>
      )}

      {/* Add Notice Modal */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Announcement</Text>

            <Text style={styles.inputLabel}>Property</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {buildings.map(b => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.filterChip, selectedBuilding === b.id && styles.filterChipActive]}
                  onPress={() => setSelectedBuilding(b.id)}
                >
                  <Text style={[styles.filterChipText, selectedBuilding === b.id && styles.filterChipTextActive]} numberOfLines={1}>
                    {b.building_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.catSelect}>
              {["general", "urgent"].map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catBtn, category === c && styles.catBtnActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.catBtnText, category === c && styles.catBtnTextActive]}>
                    {c === "urgent" ? "🚨 Urgent Alert" : "📢 General Notice"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Announcement Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Water Supply Shutdown"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.inputLabel}>Detailed Message</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Provide exact details for residents..."
              value={message}
              onChangeText={setMessage}
              multiline
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={createNotice} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? "Sending..." : "Publish Broadcast"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  screenTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  noticeCard: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, marginBottom: 10, ...SHADOWS.small },
  noticeHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  titleRow: { flex: 1 },
  noticeCategory: { fontSize: 9, fontWeight: "bold", color: COLORS.danger, letterSpacing: 1 },
  noticeTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textDark, marginTop: 2 },
  noticeTime: { fontSize: 10, color: COLORS.textMuted },
  noticeBody: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  hint: { textAlign: "center", fontSize: 11, color: COLORS.textMuted, marginTop: 12, marginBottom: 20 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: COLORS.textMuted },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 15, color: COLORS.textDark, marginBottom: 14, backgroundColor: COLORS.background },
  filterChip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.cardBg },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  catSelect: { flexDirection: "row", gap: 10, marginBottom: 14 },
  catBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 10, alignItems: "center", backgroundColor: COLORS.cardBg },
  catBtnActive: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerLight },
  catBtnText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  catBtnTextActive: { color: COLORS.danger, fontWeight: "700" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: "700" },
  saveBtn: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 12, padding: 14, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "800" },
});
