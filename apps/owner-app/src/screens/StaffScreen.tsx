import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, RefreshControl
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

const STAFF_ROLES = [
  { key: "cleaner", label: "Cleaner", icon: "🧹" },
  { key: "cook", label: "Cook", icon: "👨‍🍳" },
  { key: "security", label: "Security", icon: "💂" },
  { key: "receptionist", label: "Receptionist", icon: "💼" },
  { key: "manager", label: "Manager", icon: "👔" },
  { key: "other", label: "Other", icon: "👤" },
];

const ATTENDANCE_STATUSES = [
  { key: "present", label: "Present", color: COLORS.success, icon: "✅" },
  { key: "absent", label: "Absent", color: COLORS.danger, icon: "❌" },
  { key: "half_day", label: "Half Day", color: COLORS.warning, icon: "⚡" },
  { key: "leave", label: "Leave", color: "#8B5CF6", icon: "🏖️" },
];

interface StaffScreenProps {
  apiBase: string;
  token: string;
  buildings: any[];
}

export const StaffScreen: React.FC<StaffScreenProps> = ({ apiBase, token, buildings }) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(buildings[0]?.id || "");
  
  // Add staff modal state
  const [addModal, setAddModal] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("cleaner");
  const [phone, setPhone] = useState("");
  const [salary, setSalary] = useState("");
  const [saving, setSaving] = useState(false);

  // Quick attendance check modal
  const [attendanceModal, setAttendanceModal] = useState<any>(null);

  // Payroll modal state
  const [payrollModal, setPayrollModal] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [recording, setRecording] = useState(false);

  const fetchStaff = async () => {
    try {
      const url = selectedBuilding
        ? `${apiBase}/api/staff?building_id=${selectedBuilding}`
        : `${apiBase}/api/staff`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStaff();
  }, [selectedBuilding]);

  const addStaff = async () => {
    if (!name) { Alert.alert("Error", "Name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({
          building_id: selectedBuilding || null,
          name,
          role,
          phone,
          monthly_salary: salary ? parseFloat(salary) : 0
        })
      });
      const data = await res.json();
      if (data.error) Alert.alert("Error", data.error);
      else {
        setAddModal(false);
        setName("");
        setPhone("");
        setSalary("");
        fetchStaff();
      }
    } catch {
      Alert.alert("Error", "Failed to add staff");
    }
    setSaving(false);
  };

  const markAttendance = async (staffId: string, status: string) => {
    try {
      await fetch(`${apiBase}/api/staff/${staffId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ status })
      });
      setAttendanceModal(null);
      fetchStaff();
    } catch {
      Alert.alert("Error", "Failed to log attendance");
    }
  };

  const fetchAttendanceLogs = async (staffId: string) => {
    setLoadingLogs(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const res = await fetch(`${apiBase}/api/staff/${staffId}/attendance?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    }
    setLoadingLogs(false);
  };

  const openPayroll = (s: any) => {
    setPayrollModal(s);
    fetchAttendanceLogs(s.id);
  };

  const recordSalaryExpense = async () => {
    if (!payrollModal) return;
    setRecording(true);
    try {
      const now = new Date();
      const monthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const presentCount = logs.filter(l => l.status === "present").length;
      const halfDayCount = logs.filter(l => l.status === "half_day").length;
      
      const rate = presentCount + halfDayCount * 0.5;
      const monthlySalary = parseFloat(payrollModal.monthly_salary || 0);
      const calculatedPayout = Math.round(rate * (monthlySalary / monthDays));

      const res = await fetch(`${apiBase}/api/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({
          building_id: payrollModal.building_id || selectedBuilding || null,
          category: "Salary",
          amount: calculatedPayout,
          description: `Salary Payout for ${payrollModal.name} (${now.toLocaleString("default", { month: "short" })})`
        })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Success", `Salary expense of ₹${calculatedPayout.toLocaleString("en-IN")} logged!`);
        setPayrollModal(null);
      }
    } catch {
      Alert.alert("Error", "Could not record salary expense.");
    } finally {
      setRecording(false);
    }
  };

  const deleteStaff = (id: string, staffName: string) => {
    Alert.alert("Remove Staff", `Remove ${staffName}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        await fetch(`${apiBase}/api/staff/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
        });
        fetchStaff();
      }}
    ]);
  };

  const totalSalary = staff.filter(s => s.status === "active").reduce((sum, s) => sum + (parseFloat(s.monthly_salary) || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>👥 Staff Directory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)}>
          <Text style={styles.addBtnText}>+ Add Staff</Text>
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
          <TouchableOpacity key={b.id} style={[styles.filterChip, selectedBuilding === b.id && styles.filterChipActive]} onPress={() => setSelectedBuilding(b.id)}>
            <Text style={[styles.filterChipText, selectedBuilding === b.id && styles.filterChipTextActive]} numberOfLines={1}>{b.building_name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Salary Summary */}
      {staff.length > 0 && (
        <View style={styles.salaryCard}>
          <Text style={styles.salaryLabel}>Monthly Salary Outflow</Text>
          <Text style={styles.salaryAmount}>₹{totalSalary.toLocaleString("en-IN")}</Text>
          <Text style={styles.salarySub}>{staff.filter(s => s.status === "active").length} active staff members</Text>
        </View>
      )}

      {loading ? <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} /> : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStaff(); }} tintColor={COLORS.accent} />}
        >
          {staff.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No staff added yet.</Text>
              <Text style={styles.emptySubText}>Add cleaners, security, cooks and more.</Text>
            </View>
          ) : (
            staff.map(s => {
              const roleConfig = STAFF_ROLES.find(r => r.key === s.role) || { icon: "👤", label: s.role };
              return (
                <View key={s.id} style={styles.staffCard}>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                    onPress={() => setAttendanceModal(s)}
                    onLongPress={() => deleteStaff(s.id, s.name)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.staffIconBox}>
                      <Text style={styles.staffRoleIcon}>{roleConfig.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.staffName}>{s.name}</Text>
                      <Text style={styles.staffRole}>{roleConfig.label}</Text>
                      {s.phone ? <Text style={styles.staffPhone}>📞 {s.phone}</Text> : null}
                    </View>
                  </TouchableOpacity>

                  <View style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.staffSalary}>₹{parseFloat(s.monthly_salary || 0).toLocaleString("en-IN")}</Text>
                      <Text style={styles.staffSalarySub}>/month</Text>
                    </View>

                    <TouchableOpacity style={styles.payrollBtn} onPress={() => openPayroll(s)}>
                      <Text style={styles.payrollBtnText}>📅 Attendance & Payout</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
          <Text style={styles.hint}>Tap card to check in today · Long press to remove</Text>
        </ScrollView>
      )}

      {/* Add Staff Modal */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Staff Member</Text>
 
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} placeholderTextColor={COLORS.textMuted} />
 
            <Text style={styles.inputLabel}>Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {STAFF_ROLES.map(r => (
                <TouchableOpacity key={r.key} style={[styles.roleChip, role === r.key && styles.roleChipActive]} onPress={() => setRole(r.key)}>
                  <Text style={styles.roleChipIcon}>{r.icon}</Text>
                  <Text style={[styles.roleChipText, role === r.key && styles.roleChipTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
 
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput style={styles.input} placeholder="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />
 
            <Text style={styles.inputLabel}>Monthly Salary (₹)</Text>
            <TextInput style={styles.input} placeholder="e.g. 12000" value={salary} onChangeText={setSalary} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
 
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addStaff} disabled={saving}><Text style={styles.saveBtnText}>{saving ? "Saving..." : "Add Staff"}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Attendance Modal */}
      <Modal visible={!!attendanceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Mark Daily Attendance</Text>
            <Text style={styles.modalSub}>{attendanceModal?.name} · {new Date().toDateString()}</Text>
            {ATTENDANCE_STATUSES.map(as => (
              <TouchableOpacity key={as.key} style={styles.attendanceOption} onPress={() => markAttendance(attendanceModal?.id, as.key)}>
                <Text style={styles.attendanceIcon}>{as.icon}</Text>
                <Text style={[styles.attendanceLabel, { color: as.color }]}>{as.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAttendanceModal(null)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payroll Payout Report Modal */}
      <Modal visible={!!payrollModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📅 Attendance & Payroll Report</Text>
            <Text style={styles.modalSub}>{payrollModal?.name} · {new Date().toLocaleString("default", { month: "long", year: "numeric" })}</Text>

            {loadingLogs ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 30 }} />
            ) : (
              <View>
                {/* Statistics Grid */}
                <View style={styles.payrollStatsGrid}>
                  <View style={styles.payrollStatItem}>
                    <Text style={styles.payrollStatVal}>{logs.filter(l => l.status === "present").length}</Text>
                    <Text style={styles.payrollStatLbl}>Present</Text>
                  </View>
                  <View style={styles.payrollStatItem}>
                    <Text style={styles.payrollStatVal}>{logs.filter(l => l.status === "half_day").length}</Text>
                    <Text style={styles.payrollStatLbl}>Half Days</Text>
                  </View>
                  <View style={styles.payrollStatItem}>
                    <Text style={styles.payrollStatVal}>{logs.filter(l => l.status === "absent").length}</Text>
                    <Text style={styles.payrollStatLbl}>Absent</Text>
                  </View>
                  <View style={styles.payrollStatItem}>
                    <Text style={styles.payrollStatVal}>{logs.filter(l => l.status === "leave").length}</Text>
                    <Text style={styles.payrollStatLbl}>On Leave</Text>
                  </View>
                </View>

                {/* Calculator Sheet */}
                <View style={styles.calcSheet}>
                  <Text style={styles.calcTitle}>Salary Calculation Statement</Text>
                  
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLbl}>Staff Base Salary</Text>
                    <Text style={styles.calcVal}>₹{parseFloat(payrollModal?.monthly_salary || 0).toLocaleString("en-IN")}/mo</Text>
                  </View>
                  
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLbl}>Effective Attendance Rate</Text>
                    <Text style={styles.calcVal}>
                      {logs.filter(l => l.status === "present").length} + {logs.filter(l => l.status === "half_day").length}*0.5 ={" "}
                      {logs.filter(l => l.status === "present").length + logs.filter(l => l.status === "half_day").length * 0.5} Days
                    </Text>
                  </View>
                  
                  <View style={styles.divider} />

                  <View style={[styles.calcRow, { marginTop: 6 }]}>
                    <Text style={[styles.calcLbl, { fontWeight: "bold", color: COLORS.textDark }]}>Estimated Payout</Text>
                    <Text style={styles.payoutAmount}>
                      ₹{Math.round(
                        (logs.filter(l => l.status === "present").length + logs.filter(l => l.status === "half_day").length * 0.5) *
                        (parseFloat(payrollModal?.monthly_salary || 0) / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())
                      ).toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayrollModal(null)}>
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={recordSalaryExpense}
                disabled={loadingLogs || recording || logs.length === 0}
              >
                <Text style={styles.saveBtnText}>{recording ? "Processing..." : "💸 Record Expense"}</Text>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  screenTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  filterRow: { marginBottom: 14, maxHeight: 38 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.cardBg },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  salaryCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 16, marginBottom: 14, ...SHADOWS.medium },
  salaryLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  salaryAmount: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 2 },
  salarySub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 },
  staffCard: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: "row", ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.border },
  staffIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.accent + "15", justifyContent: "center", alignItems: "center", marginRight: 12 },
  staffRoleIcon: { fontSize: 22 },
  staffName: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  staffRole: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  staffPhone: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  staffSalary: { fontSize: 15, fontWeight: "800", color: COLORS.accent },
  staffSalarySub: { fontSize: 10, color: COLORS.textMuted },
  payrollBtn: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, marginTop: 8 },
  payrollBtnText: { fontSize: 10, fontWeight: "bold", color: COLORS.primary },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "700", color: COLORS.textDark },
  emptySubText: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  hint: { textAlign: "center", fontSize: 11, color: COLORS.textMuted, marginTop: 8, marginBottom: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 2 },
  modalSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 15, color: COLORS.textDark, marginBottom: 14, backgroundColor: COLORS.background },
  roleChip: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, alignItems: "center", backgroundColor: COLORS.cardBg },
  roleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleChipIcon: { fontSize: 18, marginBottom: 2 },
  roleChipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  roleChipTextActive: { color: "#fff" },
  attendanceOption: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  attendanceIcon: { fontSize: 22 },
  attendanceLabel: { fontSize: 16, fontWeight: "700" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 14 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: "700" },
  saveBtn: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 12, padding: 14, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  payrollStatsGrid: { flexDirection: "row", gap: 8, marginVertical: 12 },
  payrollStatItem: { flex: 1, backgroundColor: COLORS.background, padding: 10, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  payrollStatVal: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  payrollStatLbl: { fontSize: 9, color: COLORS.textMuted, marginTop: 2 },
  calcSheet: { backgroundColor: COLORS.primaryLight + "18", borderRadius: 16, padding: 14, marginVertical: 12, borderWidth: 1, borderColor: COLORS.primaryLight },
  calcTitle: { fontSize: 11, fontWeight: "800", color: COLORS.primary, textTransform: "uppercase", marginBottom: 8 },
  calcRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 4 },
  calcLbl: { fontSize: 12, color: COLORS.textMuted },
  calcVal: { fontSize: 12, color: COLORS.textDark, fontWeight: "600" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  payoutAmount: { fontSize: 16, fontWeight: "900", color: COLORS.accent },
});
