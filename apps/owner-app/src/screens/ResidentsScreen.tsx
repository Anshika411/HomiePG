import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, RefreshControl, Linking, TextInput } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface ResidentsScreenProps {
  apiBase: string;
  token: string;
}

export const ResidentsScreen: React.FC<ResidentsScreenProps> = ({ apiBase, token }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [residents, setResidents] = useState<any[]>([]);
  
  // Rating states
  const [ratingModal, setRatingModal] = useState<any | null>(null);
  const [score, setScore] = useState(5);
  const [behaviour, setBehaviour] = useState("good");
  const [paysOnTime, setPaysOnTime] = useState(true);
  const [noComplaints, setNoComplaints] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Checkout / Settlement States
  const [checkoutModal, setCheckoutModal] = useState<any | null>(null);
  const [unpaidDues, setUnpaidDues] = useState(0);
  const [loadingDues, setLoadingDues] = useState(false);
  const [deductions, setDeductions] = useState("");
  const [bedReleaseStatus, setBedReleaseStatus] = useState("Available");
  const [actualLeaveDate, setActualLeaveDate] = useState("");
  const [checkoutRemarks, setCheckoutRemarks] = useState("");
  const [processingCheckout, setProcessingCheckout] = useState(false);

  const fetchResidents = async () => {
    try {
      const res = await fetch(`${apiBase}/api/tenants/owner-residents`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setResidents(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  const openRating = (resident: any) => {
    setRatingModal(resident);
    setScore(resident.rating || 5);
    setBehaviour(resident.behaviour || "good");
    setPaysOnTime(resident.paysOnTime !== false);
    setNoComplaints(resident.noComplaints !== false);
    setNotes(resident.notes || "");
  };

  const submitRating = async () => {
    if (!ratingModal) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/tenants/${ratingModal.profileId}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({
          rating: score,
          behaviour,
          pays_on_time: paysOnTime,
          no_complaints: noComplaints,
          notes
        })
      });
      const data = await res.json();
      if (data.error) Alert.alert("Error", data.error);
      else {
        Alert.alert("Success", "Resident review submitted successfully!");
        setRatingModal(null);
        fetchResidents();
      }
    } catch {
      Alert.alert("Error", "Failed to submit rating");
    }
    setSaving(false);
  };

  const openCheckout = async (resident: any) => {
    setCheckoutModal(resident);
    setDeductions("");
    setBedReleaseStatus("Available");
    setCheckoutRemarks("");
    setActualLeaveDate(new Date().toISOString().split("T")[0]);
    
    // Fetch unpaid dues from invoices
    setLoadingDues(true);
    setUnpaidDues(0);
    try {
      const res = await fetch(`${apiBase}/api/payments/invoices`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const invoices = await res.json();
      if (Array.isArray(invoices)) {
        const unpaid = invoices
          .filter(inv => inv.tenant_id === resident.id && inv.status !== "Paid")
          .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
        setUnpaidDues(unpaid);
      }
    } catch {}
    setLoadingDues(false);
  };

  const submitCheckout = async () => {
    if (!checkoutModal) return;
    setProcessingCheckout(true);
    try {
      const res = await fetch(`${apiBase}/api/tenants/${checkoutModal.id}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({
          actual_leave_date: actualLeaveDate,
          bed_status: bedReleaseStatus
        })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Success", "Checkout processed and bed released successfully!");
        setCheckoutModal(null);
        fetchResidents();
      }
    } catch {
      Alert.alert("Error", "Failed to process checkout");
    } finally {
      setProcessingCheckout(false);
    }
  };

  const handleVerifyKyc = async (docId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`${apiBase}/api/tenants/verify-kyc/${docId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Success", `KYC document successfully ${action === "approve" ? "verified" : "rejected"}!`);
        fetchResidents();
      }
    } catch {
      Alert.alert("Error", "Failed to update KYC status");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>👥 Resident Hub</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchResidents(); }} tintColor={COLORS.accent} />}
        >
          {residents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No active occupants registered yet.</Text>
            </View>
          ) : (
            residents.map(r => (
              <View key={r.id} style={styles.residentCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.residentName}>👤 {r.name}</Text>
                    <Text style={styles.residentEmail}>{r.email}</Text>
                  </View>
                  <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.rateBtn} onPress={() => openRating(r)}>
                      <Text style={styles.rateBtnText}>⭐ Rate ({r.rating || 5}/5)</Text>
                    </TouchableOpacity>
                    {r.status !== "left" && (
                      <TouchableOpacity style={[styles.rateBtn, { backgroundColor: COLORS.warningLight }]} onPress={() => openCheckout(r)}>
                        <Text style={[styles.rateBtnText, { color: COLORS.warning }]}>🔑 Checkout</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {r.status === "notice_period" ? (
                  <View style={styles.noticeBanner}>
                    <Text style={styles.noticeBannerText}>
                      ⚠️ Notice Period (Check-out: {r.expectedLeaveDate || "pending"})
                    </Text>
                  </View>
                ) : r.status === "left" ? (
                  <View style={[styles.noticeBanner, { backgroundColor: COLORS.border + "60" }]}>
                    <Text style={[styles.noticeBannerText, { color: COLORS.textMuted }]}>
                      🔒 Checked Out / Left PG
                    </Text>
                  </View>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>PG Property</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{r.buildingName}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Room / Bed</Text>
                    <Text style={styles.detailValue}>
                      Room {r.roomNumber} {r.status !== "left" ? `(Bed ${r.bedNumber})` : ""}
                    </Text>
                  </View>
                </View>

                <View style={[styles.detailsGrid, { marginTop: 10 }]}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Monthly Rent</Text>
                    <Text style={[styles.detailValue, { color: COLORS.accent, fontWeight: "bold" }]}>₹{r.rent.toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Move-In Date</Text>
                    <Text style={styles.detailValue}>{r.moveInDate || "—"}</Text>
                  </View>
                </View>

                {/* Rating Tags */}
                <View style={styles.tagRow}>
                  <View style={[styles.tag, r.paysOnTime ? styles.tagGreen : styles.tagRed]}>
                    <Text style={[styles.tagText, r.paysOnTime ? styles.textGreen : styles.textRed]}>
                      {r.paysOnTime ? "✓ Pays Rent On-Time" : "⚠️ Delayed Payments"}
                    </Text>
                  </View>
                  <View style={[styles.tag, r.noComplaints ? styles.tagGreen : styles.tagRed]}>
                    <Text style={[styles.tagText, r.noComplaints ? styles.textGreen : styles.textRed]}>
                      {r.noComplaints ? "✓ Zero Behaviour Complaints" : "⚠️ Behavior Flagged"}
                    </Text>
                  </View>
                </View>

                {r.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>💬 Remarks: {r.notes}</Text>
                  </View>
                ) : null}

                {/* KYC Documents Section */}
                <View style={styles.kycSection}>
                  <Text style={styles.kycHeaderTitle}>📄 KYC Verification Status</Text>
                  {(!r.kycDocuments || r.kycDocuments.length === 0) ? (
                    <Text style={styles.noKycText}>⚠️ No KYC documents uploaded yet.</Text>
                  ) : (
                    r.kycDocuments.map((doc: any) => (
                      <View key={doc.id} style={styles.kycRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.kycDocName}>
                            {doc.document_type || "Aadhaar Card"} (No: {doc.document_number || "—"})
                          </Text>
                          <Text style={[styles.kycStatusText, { color: doc.verified ? COLORS.success : COLORS.danger }]}>
                            {doc.verified ? "🟢 Verified & Approved" : "🔴 Verification Pending"}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                          {doc.file_url ? (
                            <TouchableOpacity 
                              style={styles.viewDocBtn}
                              onPress={() => {
                                Linking.openURL(doc.file_url).catch(() => {
                                  Alert.alert("Error", "Could not open document link.");
                                });
                              }}
                            >
                              <Text style={styles.viewDocBtnText}>View File ↗</Text>
                            </TouchableOpacity>
                          ) : null}
                          {!doc.verified ? (
                            <View style={{ flexDirection: "row", gap: 4 }}>
                              <TouchableOpacity 
                                style={[styles.viewDocBtn, { backgroundColor: COLORS.successLight }]}
                                onPress={() => handleVerifyKyc(doc.id, "approve")}
                              >
                                <Text style={[styles.viewDocBtnText, { color: COLORS.success }]}>✓</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[styles.viewDocBtn, { backgroundColor: COLORS.dangerLight }]}
                                onPress={() => handleVerifyKyc(doc.id, "reject")}
                              >
                                <Text style={[styles.viewDocBtnText, { color: COLORS.danger }]}>✕</Text>
                              </TouchableOpacity>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Review Modal */}
      <Modal visible={!!ratingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rate Resident</Text>
            <Text style={styles.modalSub}>{ratingModal?.name} · Room {ratingModal?.roomNumber}</Text>

            <Text style={styles.inputLabel}>Uber-Style Rating (1 to 5 Stars)</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(num => (
                <TouchableOpacity key={num} onPress={() => setScore(num)} style={styles.starTouch}>
                  <Text style={[styles.starIcon, num <= score ? { color: COLORS.warning } : { color: COLORS.border }]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Payment Reliability</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Resident pays monthly rent on time?</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, paysOnTime ? styles.toggleOn : styles.toggleOff]}
                onPress={() => setPaysOnTime(!paysOnTime)}
              >
                <Text style={styles.toggleText}>{paysOnTime ? "Yes" : "No"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Behaviour Standards</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Zero house rule violations / complaints?</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, noComplaints ? styles.toggleOn : styles.toggleOff]}
                onPress={() => setNoComplaints(!noComplaints)}
              >
                <Text style={styles.toggleText}>{noComplaints ? "Yes" : "No"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Review Notes / Remarks</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. quiet resident, friendly roommates"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRatingModal(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={submitRating} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? "Submitting..." : "Save Rating"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Checkout Settlement Modal */}
      <Modal visible={!!checkoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🔑 Final Checkout & Settlement</Text>
            <Text style={styles.modalSub}>{checkoutModal?.name} · Room {checkoutModal?.roomNumber}</Text>

            {loadingDues ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                {/* Dues Sheet */}
                <View style={styles.checkoutStatement}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLbl}>Refundable Security Deposit</Text>
                    <Text style={[styles.calcVal, { color: COLORS.success, fontWeight: "bold" }]}>₹{(checkoutModal?.deposit || 0).toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLbl}>Unpaid Rent Invoices</Text>
                    <Text style={[styles.calcVal, { color: COLORS.danger }]}>- ₹{unpaidDues.toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLbl}>Operational Deductions</Text>
                    <TextInput
                      style={styles.inlineInput}
                      keyboardType="numeric"
                      placeholder="e.g. damages (₹)"
                      value={deductions}
                      onChangeText={setDeductions}
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>

                  <View style={styles.divider} />

                  <View style={[styles.calcRow, { marginTop: 6 }]}>
                    <Text style={[styles.calcLbl, { fontWeight: "bold", color: COLORS.textDark }]}>Net Refund Amount</Text>
                    <Text style={[styles.payoutAmount, { color: COLORS.accent }]}>
                      ₹{Math.max(0, (checkoutModal?.deposit || 0) - unpaidDues - parseFloat(deductions || "0")).toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>

                {/* Release settings */}
                <Text style={styles.inputLabel}>Bed Inventory Release Status</Text>
                <View style={styles.catSelect}>
                  {["Available", "Maintenance"].map(st => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.catBtn, bedReleaseStatus === st && styles.catBtnActive]}
                      onPress={() => setBedReleaseStatus(st)}
                    >
                      <Text style={[styles.catBtnText, bedReleaseStatus === st && styles.catBtnTextActive]}>
                        {st === "Available" ? "🟢 Set Available" : "🛠️ Set Maintenance"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Actual Checkout Date</Text>
                <TextInput
                  style={styles.notesInputCompact}
                  value={actualLeaveDate}
                  onChangeText={setActualLeaveDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.inputLabel}>Remarks</Text>
                <TextInput
                  style={styles.notesInputCompact}
                  value={checkoutRemarks}
                  onChangeText={setCheckoutRemarks}
                  placeholder="e.g. cleared all keys, room inspected"
                  placeholderTextColor={COLORS.textMuted}
                />
              </ScrollView>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCheckoutModal(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: COLORS.warning }]}
                onPress={submitCheckout}
                disabled={loadingDues || processingCheckout}
              >
                <Text style={styles.saveBtnText}>{processingCheckout ? "Processing..." : "Confirm Checkout"}</Text>
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
  screenTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 16 },
  residentCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.small },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  residentName: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  residentEmail: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 6, alignItems: "center" },
  rateBtn: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  rateBtnText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
  noticeBanner: { backgroundColor: COLORS.warningLight, padding: 8, borderRadius: 8, marginTop: 10 },
  noticeBannerText: { fontSize: 11, fontWeight: "700", color: COLORS.warning },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  detailsGrid: { flexDirection: "row", justifyContent: "space-between" },
  detailItem: { width: "48%" },
  detailLabel: { fontSize: 9, color: COLORS.textMuted, textTransform: "uppercase" },
  detailValue: { fontSize: 13, color: COLORS.textDark, fontWeight: "600", marginTop: 2 },
  tagRow: { flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagGreen: { backgroundColor: COLORS.successLight },
  tagRed: { backgroundColor: COLORS.dangerLight },
  tagText: { fontSize: 10, fontWeight: "700" },
  textGreen: { color: COLORS.success },
  textRed: { color: COLORS.danger },
  emptyState: { alignItems: "center", paddingVertical: 50 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 4 },
  modalSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: "800", color: COLORS.textMuted, marginBottom: 6, marginTop: 12, textTransform: "uppercase" },
  starRow: { flexDirection: "row", gap: 14, marginBottom: 16 },
  starTouch: { padding: 4 },
  starIcon: { fontSize: 32 },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  toggleLabel: { fontSize: 13, color: COLORS.textDark, flex: 1, marginRight: 10 },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, minWidth: 60, alignItems: "center" },
  toggleOn: { backgroundColor: COLORS.success },
  toggleOff: { backgroundColor: COLORS.danger },
  toggleText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: "700" },
  saveBtn: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 12, padding: 14, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  kycSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  kycHeaderTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 6,
  },
  noKycText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  kycRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kycDocName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  kycStatusText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "bold",
  },
  viewDocBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewDocBtnText: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  notesBox: {
    backgroundColor: COLORS.border + "40",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.textDark,
    backgroundColor: COLORS.background,
    height: 70,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  checkoutStatement: {
    backgroundColor: COLORS.primaryLight + "15",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    marginBottom: 12,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  calcLbl: { fontSize: 12, color: COLORS.textMuted },
  calcVal: { fontSize: 12, color: COLORS.textDark, fontWeight: "600" },
  inlineInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: COLORS.textDark,
    backgroundColor: COLORS.background,
    width: 100,
    textAlign: "right",
  },
  payoutAmount: { fontSize: 16, fontWeight: "900" },
  catSelect: { flexDirection: "row", gap: 10, marginVertical: 6 },
  catBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 8, alignItems: "center", backgroundColor: COLORS.cardBg },
  catBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + "15" },
  catBtnText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  catBtnTextActive: { color: COLORS.primary, fontWeight: "700" },
  notesInputCompact: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textDark,
    backgroundColor: COLORS.background,
    marginBottom: 8,
  },
});
