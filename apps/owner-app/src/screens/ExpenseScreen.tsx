import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, RefreshControl
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

const EXPENSE_CATEGORIES = [
  { key: "electricity", label: "Electricity", icon: "⚡" },
  { key: "salary", label: "Staff Salary", icon: "👥" },
  { key: "food", label: "Food", icon: "🍽️" },
  { key: "maintenance", label: "Maintenance", icon: "🔧" },
  { key: "internet", label: "Internet", icon: "📶" },
  { key: "other", label: "Other", icon: "📦" },
];

interface ExpenseScreenProps {
  apiBase: string;
  token: string;
  buildings: any[];
}

export const ExpenseScreen: React.FC<ExpenseScreenProps> = ({ apiBase, token, buildings }) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({ totalAmount: 0, categoryTotals: {} });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(buildings[0]?.id || "");
  const [category, setCategory] = useState("electricity");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const now = new Date();

  const fetchExpenses = async () => {
    try {
      const url = selectedBuilding
        ? `${apiBase}/api/expenses?building_id=${selectedBuilding}`
        : `${apiBase}/api/expenses`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setExpenses(data.expenses || []);
      setTotals({ totalAmount: data.totalAmount || 0, categoryTotals: data.categoryTotals || {} });
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchExpenses(); }, [selectedBuilding]);

  const addExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ building_id: selectedBuilding || null, category, amount: parseFloat(amount), description })
      });
      const data = await res.json();
      if (data.error) Alert.alert("Error", data.error);
      else {
        setAddModal(false);
        setAmount(""); setDescription("");
        fetchExpenses();
      }
    } catch { Alert.alert("Error", "Failed to save expense"); }
    setSaving(false);
  };

  const deleteExpense = (id: string) => {
    Alert.alert("Delete", "Remove this expense?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await fetch(`${apiBase}/api/expenses/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
        });
        fetchExpenses();
      }}
    ]);
  };

  // Revenue estimate based on expenses (placeholder if no real revenue data)
  const profitEstimate = 0; // Will be shown as "track revenue to calculate profit"

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💰 Expense Tracker</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Building Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !selectedBuilding && styles.filterChipActive]}
          onPress={() => setSelectedBuilding("")}
        >
          <Text style={[styles.filterChipText, !selectedBuilding && styles.filterChipTextActive]}>All Properties</Text>
        </TouchableOpacity>
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExpenses(); }} tintColor={COLORS.accent} />}
      >
        {/* Total Card */}
        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>{now.toLocaleString("default", { month: "long", year: "numeric" })}</Text>
            <Text style={styles.totalAmount}>₹{totals.totalAmount.toLocaleString("en-IN")}</Text>
            <Text style={styles.totalSub}>Total Expenses</Text>
          </View>
          <View style={styles.categoryBreakdown}>
            {EXPENSE_CATEGORIES.filter(c => totals.categoryTotals[c.key] > 0).map(c => (
              <View key={c.key} style={styles.catRow}>
                <Text style={styles.catIcon}>{c.icon}</Text>
                <Text style={styles.catLabel}>{c.label}</Text>
                <Text style={styles.catAmount}>₹{(totals.categoryTotals[c.key] || 0).toLocaleString("en-IN")}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Expense List */}
        {loading ? <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} /> : (
          expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No expenses logged this month.</Text>
              <Text style={styles.emptySubText}>Tap "+ Add" to log your first expense.</Text>
            </View>
          ) : (
            expenses.map(e => {
              const cat = EXPENSE_CATEGORIES.find(c => c.key === e.category);
              return (
                <TouchableOpacity key={e.id} style={styles.expenseRow} onLongPress={() => deleteExpense(e.id)}>
                  <View style={[styles.expenseIconBox, { backgroundColor: COLORS.accent + "18" }]}>
                    <Text style={styles.expenseIcon}>{cat?.icon || "📦"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseCat}>{cat?.label || e.category}</Text>
                    {e.description ? <Text style={styles.expenseDesc} numberOfLines={1}>{e.description}</Text> : null}
                    <Text style={styles.expenseDate}>{e.expense_date}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>₹{parseFloat(e.amount).toLocaleString("en-IN")}</Text>
                </TouchableOpacity>
              );
            })
          )
        )}
        <Text style={styles.longPressHint}>Long press an expense to delete</Text>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Log Expense</Text>

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {EXPENSE_CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catChip, category === c.key && styles.catChipActive]}
                  onPress={() => setCategory(c.key)}
                >
                  <Text style={styles.catChipIcon}>{c.icon}</Text>
                  <Text style={[styles.catChipText, category === c.key && styles.catChipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 42000"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. June electricity bill"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addExpense} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Expense"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  filterRow: { marginBottom: 14 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.cardBg },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  totalCard: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, marginBottom: 16, ...SHADOWS.large },
  totalLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 4 },
  totalAmount: { color: "#fff", fontSize: 36, fontWeight: "900" },
  totalSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 12 },
  categoryBreakdown: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", paddingTop: 10 },
  catRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  catIcon: { fontSize: 14, marginRight: 6 },
  catLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, flex: 1 },
  catAmount: { color: "#fff", fontWeight: "700", fontSize: 13 },
  expenseRow: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", ...SHADOWS.small },
  expenseIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  expenseIcon: { fontSize: 20 },
  expenseCat: { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  expenseDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  expenseDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: "800", color: COLORS.danger },
  longPressHint: { textAlign: "center", fontSize: 11, color: COLORS.textMuted, marginTop: 8, marginBottom: 20 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "700", color: COLORS.textDark },
  emptySubText: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 15, color: COLORS.textDark, marginBottom: 14, backgroundColor: COLORS.background },
  catChip: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, alignItems: "center", backgroundColor: COLORS.cardBg },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipIcon: { fontSize: 18, marginBottom: 2 },
  catChipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  catChipTextActive: { color: "#fff" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: "700" },
  saveBtn: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 12, padding: 14, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "800" },
});
