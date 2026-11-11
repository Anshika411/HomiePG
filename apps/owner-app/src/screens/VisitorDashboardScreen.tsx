import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput, Modal
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { COLORS, SHADOWS } from "../styles/theme";

interface VisitorDashboardScreenProps {
  apiBase: string;
  token: string;
}

export const VisitorDashboardScreen: React.FC<VisitorDashboardScreenProps> = ({ apiBase, token }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [passes, setPasses] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // QR / Code scanner states
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scannedPass, setScannedPass] = useState<any | null>(null);

  const fetchPasses = async () => {
    try {
      const res = await fetch(`${apiBase}/api/visitors/owner-passes`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setPasses(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const updatePassStatus = async (passId: string, newStatus: string) => {
    setUpdatingId(passId);
    try {
      const res = await fetch(`${apiBase}/api/visitors/${passId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Success", `Visitor has been successfully ${newStatus.toLowerCase()}!`);
        // Update local list state
        setPasses(prev => prev.map(p => p.id === passId ? { ...p, status: newStatus } : p));
        // If we currently have this pass open in details modal, update it
        if (scannedPass && scannedPass.id === passId) {
          setScannedPass({ ...scannedPass, status: newStatus });
        }
      }
    } catch {
      Alert.alert("Error", "Failed to update visitor status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setShowScanner(false);
    
    // Look up code in passes
    const match = passes.find(p => p.pass_code === data);
    if (match) {
      setScannedPass(match);
    } else {
      Alert.alert("Invalid Pass", `Pass code ${data} is not registered or valid for this building.`);
    }
  };

  const handleManualVerify = () => {
    if (!manualCode.trim()) return;
    const code = manualCode.trim().toUpperCase();
    const match = passes.find(p => p.pass_code.toUpperCase() === code);
    if (match) {
      setScannedPass(match);
      setManualCode("");
    } else {
      Alert.alert("Invalid Pass", `Pass code ${code} is not registered or valid for this building.`);
    }
  };

  const handleStartScanner = async () => {
    if (!permission) {
      // Permission is still loading
      return;
    }
    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Permission Required", "Camera access is needed to scan QR passes.");
        return;
      }
    }
    setShowScanner(true);
  };

  // Compute stats
  const todayStr = new Date().toISOString().split("T")[0];
  const todayPasses = passes.filter(p => p.visit_date === todayStr);
  const insideCount = passes.filter(p => p.status === "Checked In").length;
  const checkedOutCount = passes.filter(p => p.status === "Checked Out").length;

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>💂 Visitor Security Desk</Text>

      {/* Verification Console */}
      <View style={styles.consoleCard}>
        <Text style={styles.consoleTitle}>⚡ Security Check-In Console</Text>
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.codeInput}
            placeholder="Type Pass Code (e.g. HP-3A9B2F)"
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="characters"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity style={styles.verifyBtn} onPress={handleManualVerify}>
            <Text style={styles.verifyBtnText}>Verify</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.scanBtn} onPress={handleStartScanner}>
          <Text style={styles.scanBtnText}>📷 Open Camera QR Scanner</Text>
        </TouchableOpacity>
      </View>

      {/* Traffic Summary Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.successLight }]}>
          <Text style={[styles.statVal, { color: COLORS.success }]}>{insideCount}</Text>
          <Text style={styles.statLbl}>Inside PG</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.primaryLight }]}>
          <Text style={[styles.statVal, { color: COLORS.primary }]}>{todayPasses.length}</Text>
          <Text style={styles.statLbl}>Expected Today</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.warningLight }]}>
          <Text style={[styles.statVal, { color: COLORS.warning }]}>{checkedOutCount}</Text>
          <Text style={styles.statLbl}>Checked Out</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPasses(); }} tintColor={COLORS.accent} />}
        >
          {passes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💂</Text>
              <Text style={styles.emptyText}>No visitor logs registered.</Text>
            </View>
          ) : (
            passes.map(p => (
              <View key={p.id} style={styles.passCard}>
                <View style={styles.passHeader}>
                  <View>
                    <Text style={styles.visitorName}>👤 {p.visitor_name}</Text>
                    <Text style={styles.passSub}>
                      Resident: {p.profiles?.name || "Unknown"} ({p.buildings?.building_name})
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, p.status === "Checked In" ? styles.badgeIn : p.status === "Checked Out" ? styles.badgeOut : styles.badgeActive]}>
                    <Text style={[styles.statusText, p.status === "Checked In" ? styles.textIn : p.status === "Checked Out" ? styles.textOut : styles.textActive]}>
                      {p.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>📅 Date: {p.visit_date} {p.visit_time ? `· Time: ${p.visit_time}` : ""}</Text>
                  <Text style={styles.codeText}>Pass: {p.pass_code}</Text>
                </View>

                {/* Scan Action Controls */}
                <View style={styles.actionRow}>
                  {p.status === "Active" ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnIn]}
                      onPress={() => updatePassStatus(p.id, "Checked In")}
                      disabled={updatingId === p.id}
                    >
                      <Text style={styles.btnText}>🟢 Check In</Text>
                    </TouchableOpacity>
                  ) : p.status === "Checked In" ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnOut]}
                      onPress={() => updatePassStatus(p.id, "Checked Out")}
                      disabled={updatingId === p.id}
                    >
                      <Text style={styles.btnText}>⚫ Check Out</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.completedText}>🔒 Visit Completed</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* QR Camera View Modal */}
      <Modal visible={showScanner} animationType="fade" transparent={false}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
          {/* Target Reticle Frame overlay */}
          <View style={styles.overlayFrame}>
            <View style={styles.reticle} />
            <Text style={styles.scanInstruction}>Align visitor QR pass code inside the frame</Text>
          </View>
          <TouchableOpacity style={styles.closeScannerBtn} onPress={() => setShowScanner(false)}>
            <Text style={styles.closeScannerText}>✕ Close Camera</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Scanned Pass Details Overlay Modal */}
      <Modal visible={!!scannedPass} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Visitor Verification Details</Text>
            <Text style={styles.modalSub}>Pass Code: {scannedPass?.pass_code}</Text>

            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLbl}>Visitor Name</Text>
                <Text style={styles.detailVal}>👤 {scannedPass?.visitor_name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLbl}>Resident Host</Text>
                <Text style={styles.detailVal}>🏠 {scannedPass?.profiles?.name || "Tenant"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLbl}>Visit Date & Time</Text>
                <Text style={styles.detailVal}>
                  📅 {scannedPass?.visit_date} {scannedPass?.visit_time ? `at ${scannedPass?.visit_time}` : ""}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLbl}>Purpose of Visit</Text>
                <Text style={styles.detailVal}>{scannedPass?.purpose || "Personal"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLbl}>Current Status</Text>
                <Text style={[styles.detailVal, { fontWeight: "bold", color: scannedPass?.status === "Checked In" ? COLORS.success : COLORS.primary }]}>
                  {scannedPass?.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setScannedPass(null)}>
                <Text style={styles.cancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
              
              {scannedPass?.status === "Active" && (
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: COLORS.success }]}
                  onPress={() => {
                    updatePassStatus(scannedPass.id, "Checked In");
                    setScannedPass(null);
                  }}
                  disabled={updatingId === scannedPass?.id}
                >
                  <Text style={styles.saveBtnText}>🟢 Check In</Text>
                </TouchableOpacity>
              )}

              {scannedPass?.status === "Checked In" && (
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}
                  onPress={() => {
                    updatePassStatus(scannedPass.id, "Checked Out");
                    setScannedPass(null);
                  }}
                  disabled={updatingId === scannedPass?.id}
                >
                  <Text style={styles.saveBtnText}>⚫ Check Out</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
  screenTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 12 },
  consoleCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14, marginBottom: 16, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.border },
  consoleTitle: { fontSize: 13, fontWeight: "800", color: COLORS.textDark, marginBottom: 10 },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  codeInput: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: COLORS.textDark, backgroundColor: COLORS.background },
  verifyBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  verifyBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  scanBtn: { backgroundColor: COLORS.primaryLight, borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  scanBtnText: { color: COLORS.primary, fontWeight: "bold", fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", ...SHADOWS.small },
  statVal: { fontSize: 22, fontWeight: "900" },
  statLbl: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, textAlign: "center" },
  passCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.small },
  passHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  visitorName: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  passSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeIn: { backgroundColor: COLORS.successLight },
  badgeOut: { backgroundColor: COLORS.border },
  badgeActive: { backgroundColor: COLORS.primaryLight },
  statusText: { fontSize: 10, fontWeight: "700" },
  textIn: { color: COLORS.success },
  textOut: { color: COLORS.textMuted },
  textActive: { color: COLORS.primary },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 10 },
  infoText: { fontSize: 11, color: COLORS.textMuted },
  codeText: { fontSize: 11, color: COLORS.primary, fontWeight: "700" },
  actionRow: { marginTop: 10, alignItems: "center" },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, width: "100%", alignItems: "center" },
  btnIn: { backgroundColor: COLORS.success },
  btnOut: { backgroundColor: COLORS.primary },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  completedText: { fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" },
  emptyState: { alignItems: "center", paddingVertical: 50 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
  scannerContainer: { flex: 1, backgroundColor: "#000", justifyContent: "flex-end", alignItems: "center" },
  overlayFrame: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  reticle: { width: 220, height: 220, borderWidth: 2, borderColor: COLORS.accent, borderRadius: 16, backgroundColor: "transparent" },
  scanInstruction: { color: "#fff", fontSize: 13, fontWeight: "bold", textAlign: "center", marginTop: 24, paddingHorizontal: 20 },
  closeScannerBtn: { backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, marginBottom: 40, ...SHADOWS.medium },
  closeScannerText: { color: "#000", fontSize: 14, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 2 },
  modalSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: 16 },
  detailsList: { gap: 12, marginBottom: 20, backgroundColor: COLORS.background, padding: 12, borderRadius: 12 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLbl: { fontSize: 12, color: COLORS.textMuted },
  detailVal: { fontSize: 12, color: COLORS.textDark, fontWeight: "600" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: "700" },
  saveBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
