import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Linking } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";
import { PaymentModal } from "../components/PaymentModal";
import { UploadService } from "../utils/UploadService";

interface ManageScreenProps {
  invoices: any[];
  activeStay: any;
  visitorPasses: any[];
  onSubmitPayment: (invoiceId: string, amountPaid: number, method: string, transactionId: string, receiptUrl?: string, pointsDeducted?: number) => Promise<void>;
  onRegisterVisitor: (visitorName: string, visitDate: string, purpose: string) => Promise<void>;
  apiBase?: string;
  token?: string;
  notices?: any[];
  roommates?: any[];
  rewardPoints?: number;
}

export const ManageScreen: React.FC<ManageScreenProps> = ({
  invoices,
  activeStay,
  visitorPasses,
  onSubmitPayment,
  onRegisterVisitor,
  apiBase,
  token,
  notices = [],
  roommates = [],
  rewardPoints = 0,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Forms states
  const [visitorName, setVisitorName] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitorPurpose, setVisitorPurpose] = useState("");
  


  // Agreement Modal
  const [isAgreementVisible, setIsAgreementVisible] = useState(false);
  const [isSigned, setIsSigned] = useState(false); // Default unsigned for active stay to demo signing flow

  // Subsections toggle
  const [activeTabSection, setActiveTabSection] = useState<"visitors" | "agreement" | "roommates">("visitors");

  const handleSubmitTxn = async (transactionId: string, paymentMethod: string, receiptUrl?: string, pointsDeducted?: number) => {
    if (!selectedInvoice) return;
    const discount = pointsDeducted ? (pointsDeducted / 2) : 0;
    const actualAmount = Math.max(0, selectedInvoice.amount - discount);
    await onSubmitPayment(selectedInvoice.id, actualAmount, paymentMethod, transactionId, receiptUrl, pointsDeducted);
    setSelectedInvoice(null);
  };

  const [leaveDate, setLeaveDate] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [tenancyStatus, setTenancyStatus] = useState(activeStay?.status || "active");

  const handleCheckoutRequest = async () => {
    if (!leaveDate.trim()) {
      Alert.alert("Required", "Please enter your expected checkout date (YYYY-MM-DD).");
      return;
    }

    setIsSubmittingLeave(true);
    try {
      const res = await fetch(`${apiBase || "https://cia-headquarters-anyone-intend.trycloudflare.com"}/api/tenants/checkout-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({ expected_leave_date: leaveDate })
      });

      const data = await res.json();
      if (data.error) {
        Alert.alert("Checkout Request Failed", data.error);
      } else {
        Alert.alert("Success", `Move-out request registered for date: ${leaveDate}`);
        setTenancyStatus("notice_period");
        setLeaveDate("");
      }
    } catch (e) {
      Alert.alert("Error", "Could not connect to server.");
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleVisitorSubmit = () => {
    if (!visitorName || !visitDate) {
      Alert.alert("Input Required", "Please enter visitor name and visit date.");
      return;
    }
    onRegisterVisitor(visitorName, visitDate, visitorPurpose);
    setVisitorName("");
    setVisitDate("");
    setVisitorPurpose("");
  };



  return (
    <View style={styles.flexContainer}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1: MY ACTIVE STAY DASHBOARD */}
        {activeStay ? (
          <View style={styles.stayDashboard}>
            {/* GRADIENT MEMBER CARD */}
            <View style={styles.memberCardGradient}>
              <View style={styles.stayHeader}>
                <View>
                  <Text style={styles.memberCardBrand}>HOMIEPG MEMBER</Text>
                  <Text style={styles.stayPGName}>🏠 {activeStay.buildings?.building_name}</Text>
                  <Text style={styles.stayAddress}>{activeStay.buildings?.address}</Text>
                </View>
                <View style={styles.kycVerifiedBadge}>
                  <Text style={styles.kycVerifiedText}>✓ KYC Verified</Text>
                </View>
              </View>

              <View style={styles.stayDivider} />

              <View style={styles.stayMetaGrid}>
                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>ROOM</Text>
                  <Text style={styles.metaValue}>Room {activeStay.rooms?.room_number}</Text>
                  <Text style={styles.metaSub}>{activeStay.rooms?.room_type}</Text>
                </View>
                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>BED</Text>
                  <Text style={styles.metaValue}>Bed {activeStay.beds?.bed_number}</Text>
                  <Text style={styles.metaSub}>Status: Active</Text>
                </View>
                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>RENT</Text>
                  <Text style={[styles.metaValue, { color: "#fff" }]}>₹{activeStay.monthly_rent}</Text>
                  <Text style={styles.metaSub}>Deposit: ₹{activeStay.deposit}</Text>
                </View>
              </View>
            </View>

            {/* Notice Board Banner */}
            {notices && notices.length > 0 && (
              <View style={styles.noticeBanner}>
                <View style={styles.noticeHeader}>
                  <Text style={styles.noticeBadge}>📢 {notices[0].category?.toUpperCase() || "ANNOUNCEMENT"}</Text>
                  <Text style={styles.noticeDate}>{notices[0].created_at ? new Date(notices[0].created_at).toLocaleDateString() : ""}</Text>
                </View>
                <Text style={styles.noticeTitle}>{notices[0].title}</Text>
                <Text style={styles.noticeText}>{notices[0].message}</Text>
              </View>
            )}

            {/* Stay Quick Sub-Menu Tabs */}
            <View style={styles.stayMenuRow}>
              <TouchableOpacity
                style={[styles.stayMenuBtn, activeTabSection === "visitors" && styles.stayMenuBtnActive]}
                onPress={() => setActiveTabSection("visitors")}
              >
                <Text style={[styles.stayMenuBtnText, activeTabSection === "visitors" && styles.stayMenuBtnTextActive]}>
                  🎫 Guest Pass
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stayMenuBtn, activeTabSection === "agreement" && styles.stayMenuBtnActive]}
                onPress={() => setActiveTabSection("agreement")}
              >
                <Text style={[styles.stayMenuBtnText, activeTabSection === "agreement" && styles.stayMenuBtnTextActive]}>
                  📝 Agreement
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stayMenuBtn, activeTabSection === "roommates" && styles.stayMenuBtnActive]}
                onPress={() => setActiveTabSection("roommates")}
              >
                <Text style={[styles.stayMenuBtnText, activeTabSection === "roommates" && styles.stayMenuBtnTextActive]}>
                  👥 Roommates
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB CONTENT: GUEST VISITOR PASSES */}
            {activeTabSection === "visitors" && (
              <View style={styles.menuTabBody}>
                <Text style={styles.tabHeading}>Register Visitor Pass</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Guest Full Name (e.g. Ramesh Sharma)"
                  value={visitorName}
                  onChangeText={setVisitorName}
                  placeholderTextColor={COLORS.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Visit Date (YYYY-MM-DD)"
                  value={visitDate}
                  onChangeText={setVisitDate}
                  placeholderTextColor={COLORS.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Purpose of Visit (Optional)"
                  value={visitorPurpose}
                  onChangeText={setVisitorPurpose}
                  placeholderTextColor={COLORS.textMuted}
                />
                <TouchableOpacity style={styles.submitActionBtn} onPress={handleVisitorSubmit}>
                  <Text style={styles.submitActionText}>Generate Access Pass</Text>
                </TouchableOpacity>

                {/* List Active Passes */}
                {visitorPasses.length > 0 && (
                  <View style={styles.visitorList}>
                    <Text style={styles.subListHeading}>Active Guest Passes:</Text>
                    {visitorPasses.map((pass: any) => (
                      <View key={pass.id} style={styles.passCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.passName}>👤 {pass.visitor_name}</Text>
                          <Text style={styles.passDate}>Valid: {pass.visit_date} · {pass.purpose || "General"}</Text>
                        </View>
                        <View style={styles.passCodeBadge}>
                          <Text style={styles.passCode}>{pass.pass_code}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB CONTENT: RENTAL AGREEMENT */}
            {activeTabSection === "agreement" && (
              <View style={styles.menuTabBody}>
                <Text style={styles.tabHeading}>Digital Rental Agreement</Text>
                <View style={styles.agreementInfoCard}>
                  <Text style={styles.agreementInfoTitle}>📄 e-Agreement Status</Text>
                  <Text style={styles.agreementInfoText}>
                    {isSigned 
                      ? "Your digital co-living agreement is locked and active for the duration of your stay."
                      : "Your digital co-living agreement is generated and pending your legal signature."
                    }
                  </Text>
                  <View style={[styles.signedStatusBadge, !isSigned && { backgroundColor: "rgba(245,158,11,0.08)" }]}>
                    <Text style={[styles.signedStatusText, !isSigned && { color: "#d97706" }]}>
                      {isSigned ? "✓ Signed & Verified" : "⚠️ Signature Pending"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewAgreementBtn}
                    onPress={() => setIsAgreementVisible(true)}
                  >
                    <Text style={styles.viewAgreementBtnText}>
                      {isSigned ? "Read Full Agreement" : "Review & Sign Agreement"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* TAB CONTENT: ROOMMATES DIRECTORY */}
            {activeTabSection === "roommates" && (
              <View style={styles.menuTabBody}>
                <Text style={styles.tabHeading}>Roommates Directory</Text>
                {roommates && roommates.length > 0 ? (
                  roommates.map((rm: any) => (
                    <View key={rm.id} style={styles.roommateCard}>
                      <View style={styles.avatarMini}>
                        <Text style={styles.avatarMiniText}>{(rm.name || "R")[0].toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.roommateName}>{rm.name} <Text style={{ fontSize: 10, fontWeight: "normal", color: COLORS.textMuted }}>· Bed {rm.bed_number}</Text></Text>
                        <Text style={rm.email ? styles.roommateEmail : styles.roommateEmailEmpty}>{rm.email || "No email address"}</Text>
                        <View style={styles.habitRowMini}>
                          <Text style={styles.habitBadgeMini}>🌅 {rm.habits?.sleep || "Flexible"}</Text>
                          <Text style={styles.habitBadgeMini}>🥦 {rm.habits?.food || "Any"}</Text>
                          <Text style={styles.habitBadgeMini}>🧼 {rm.habits?.clean || "Standard"}</Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyTabText}>No other active roommates checked into your room yet.</Text>
                )}
              </View>
            )}

            {/* Vacate Stay Section */}
            {tenancyStatus === "active" && (
              <View style={[styles.menuTabBody, { marginTop: 16, backgroundColor: "rgba(239, 68, 68, 0.03)", borderColor: "rgba(239, 68, 68, 0.15)" }]}>
                <Text style={[styles.tabHeading, { color: COLORS.danger }]}>Vacate Stay Request</Text>
                <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12 }}>
                  Vacate requires a 30-day notice period. Enter expected leave date.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Expected Leave Date (YYYY-MM-DD)"
                  value={leaveDate}
                  onChangeText={setLeaveDate}
                  placeholderTextColor={COLORS.textMuted}
                />
                <TouchableOpacity
                  style={[styles.submitActionBtn, { backgroundColor: COLORS.danger }]}
                  onPress={handleCheckoutRequest}
                  disabled={isSubmittingLeave}
                >
                  <Text style={styles.submitActionText}>
                    {isSubmittingLeave ? "Submitting Notice..." : "Submit Move-out Notice"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {tenancyStatus === "notice_period" && (
              <View style={[styles.menuTabBody, { marginTop: 16, backgroundColor: "rgba(245, 158, 11, 0.03)", borderColor: "rgba(245, 158, 11, 0.15)" }]}>
                <Text style={[styles.tabHeading, { color: "#d97706" }]}>Notice Period Active</Text>
                <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                  Your checkout notice request is registered. The PG management is processing your exit formalities.
                </Text>
              </View>
            )}

          </View>
        ) : (
          <View style={styles.noStayCard}>
            <Text style={styles.noStayIcon}>🏠</Text>
            <Text style={styles.noStayTitle}>No Active Stay</Text>
            <Text style={styles.noStaySubtitle}>
              You don't have an active PG stay checked-in yet. Book a stay from the Search tab to activate your resident utilities panel!
            </Text>
          </View>
        )}

        {/* Warden & Property Support Help Desk Contacts (Always Visible) */}
        <View style={{ marginTop: 12, marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Property Help Desk</Text>
          <View style={styles.helpDeskRow}>
            {activeStay ? (
              <>
                <TouchableOpacity 
                  style={styles.helpDeskCard}
                  onPress={() => Linking.openURL("tel:+919876543210")}
                  activeOpacity={0.75}
                >
                  <View style={styles.helpDeskIconContainer}>
                    <Text style={styles.helpDeskIcon}>👤</Text>
                  </View>
                  <Text style={styles.helpDeskTitle}>Warden (Amit)</Text>
                  <Text style={styles.helpDeskAction}>📞 Call Warden</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.helpDeskCard}
                  onPress={() => Linking.openURL("https://wa.me/919876543210")}
                  activeOpacity={0.75}
                >
                  <View style={styles.helpDeskIconContainer}>
                    <Text style={styles.helpDeskIcon}>💬</Text>
                  </View>
                  <Text style={styles.helpDeskTitle}>Emergency Support</Text>
                  <Text style={styles.helpDeskAction}>💬 WhatsApp</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.helpDeskCard}
                  onPress={() => Linking.openURL("tel:+918001234567")}
                  activeOpacity={0.75}
                >
                  <View style={styles.helpDeskIconContainer}>
                    <Text style={styles.helpDeskIcon}>📞</Text>
                  </View>
                  <Text style={styles.helpDeskTitle}>HomiePG Support</Text>
                  <Text style={styles.helpDeskAction}>📞 Call Support</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.helpDeskCard}
                  onPress={() => Linking.openURL("https://wa.me/918001234567")}
                  activeOpacity={0.75}
                >
                  <View style={styles.helpDeskIconContainer}>
                    <Text style={styles.helpDeskIcon}>💬</Text>
                  </View>
                  <Text style={styles.helpDeskTitle}>General Inquiry</Text>
                  <Text style={styles.helpDeskAction}>💬 WhatsApp</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* SECTION 2: RENT INVOICES & PAYMENTS */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Rent Invoices</Text>
        {invoices.length > 0 ? (
          invoices.map((i) => {
            const isPaid = i.status === "Paid";
            const isOverdue = i.status === "Overdue";
            const isPending = i.status === "Pending";

            let badgeStyle = styles.badgePending;
            let cardBorderColor = COLORS.border;
            if (isPaid) {
              badgeStyle = styles.badgeSuccess;
              cardBorderColor = "rgba(16,185,129,0.2)";
            } else if (isOverdue) {
              badgeStyle = styles.badgeDanger;
              cardBorderColor = "rgba(239,68,68,0.2)";
            } else if (isPending) {
              cardBorderColor = "rgba(245,158,11,0.2)";
            }

            return (
              <View key={i.id} style={[styles.card, { borderColor: cardBorderColor }]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Billing Period: {i.month || i.billing_period}</Text>
                    <Text style={styles.buildingText}>🏠 {i.buildings?.building_name || "PG Stay"}</Text>
                  </View>
                  {!isPaid && !isPending && (
                    <View style={styles.reminderBadge}>
                      <Text style={styles.reminderText}>⚠️ Overdue</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailRow}>
                  <View>
                    <Text style={styles.bodyText}>Rent Amount: ₹{i.amount.toLocaleString("en-IN")}</Text>
                    <Text style={styles.bodyText}>Due Date: {i.due_date}</Text>
                  </View>
                  <Text style={[styles.badge, badgeStyle]}>
                    {i.status.toUpperCase()}
                  </Text>
                </View>

                {!isPaid && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.payBtn, isPending && styles.pendingPayBtn]}
                      onPress={() => setSelectedInvoice(i)}
                      disabled={isPending}
                    >
                      <Text style={styles.payBtnText}>
                        {isPending ? "Verification Pending..." : "Pay Rent Now ➔"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No pending invoices found.</Text>
        )}
      </ScrollView>

      {/* Invoice payment details popup */}
      <PaymentModal
        visible={selectedInvoice !== null}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onSubmitPayment={handleSubmitTxn}
        apiBase={apiBase}
        token={token}
        rewardPoints={rewardPoints}
      />

      {/* Full Agreement Preview Modal */}
      <Modal visible={isAgreementVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Co-Living Rental Agreement</Text>
            <ScrollView style={styles.agreementScroll}>
              <Text style={styles.agreementLegalText}>
                This digital agreement is entered into on the Joining Date by and between the resident (tenant) and Amit PG Properties (owner).{"\n\n"}
                1. CO-LIVING ROOM PREMISES:{"\n"}
                The resident occupies the designated shared room and bed inside the Co-Living PG facility. Common shared amenities (WiFi, Kitchen, Living lounge, Laundry) are provided.{"\n\n"}
                2. SECURITY DEPOSIT:{"\n"}
                A security deposit of ₹5,000 is maintained. Any damages will be deducted upon final checkout checkout.{"\n\n"}
                3. GENDER BOUND RULES:{"\n"}
                For co-living PG rooms, gender locking rules are enforced to restrict shared rooms to single-gender occupants only. Mixed gender bookings within a shared room are strictly prohibited.{"\n\n"}
                4. RENT PAYMENTS:{"\n"}
                Monthly rent of ₹8,500 is due on the 5th day of every calendar month. Overdue payments will incur flat interest charges.{"\n\n"}
                5. DIGITAL SIGNATURE CLAUSE:{"\n"}
                By ticking the agreement signature below, the resident consents to register this legal contract electronically on the HomiePG network.
              </Text>
            </ScrollView>

            {!isSigned ? (
              <View style={styles.signingContainer}>
                <Text style={styles.signatureInstruction}>
                  ✍️ Please sign electronically below:
                </Text>
                <TouchableOpacity 
                  style={styles.signatureBtn}
                  onPress={() => {
                    setIsSigned(true);
                    setIsAgreementVisible(false);
                    Alert.alert(
                      "Agreement Signed",
                      "Thank you! Your co-living rental agreement has been legally signed and registered on the HomiePG system."
                    );
                  }}
                >
                  <Text style={styles.signatureBtnText}>Accept & Sign Agreement</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: "transparent", marginTop: 4 }]} onPress={() => setIsAgreementVisible(false)}>
                  <Text style={[styles.closeModalBtnText, { color: COLORS.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setIsAgreementVisible(false)}>
                <Text style={styles.closeModalBtnText}>Close Preview</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 85,
  },
  stayDashboard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  memberCardGradient: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  memberCardBrand: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.accent,
    letterSpacing: 1.5,
  },
  stayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stayPGName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 4,
  },
  stayAddress: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  kycVerifiedBadge: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  kycVerifiedText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#34d399",
  },
  stayDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginVertical: 14,
  },
  stayMetaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  metaBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  metaLabel: {
    fontSize: 8,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginTop: 4,
  },
  metaSub: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  stayMenuRow: {
    flexDirection: "row",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
    gap: 8,
  },
  stayMenuBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  stayMenuBtnActive: {
    backgroundColor: COLORS.primaryLight,
  },
  stayMenuBtnText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  stayMenuBtnTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  menuTabBody: {
    marginTop: 14,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 11,
    color: COLORS.textDark,
    marginBottom: 8,
  },
  submitActionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  submitActionText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  visitorList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  subListHeading: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  passCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passName: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  passDate: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  passCodeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  passCode: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  categoryChip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  ticketCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ticketCat: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  ticketDesc: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  ticketBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ticketBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  agreementInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  agreementInfoTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  agreementInfoText: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: "center",
    marginVertical: 8,
    lineHeight: 14,
  },
  signedStatusBadge: {
    backgroundColor: "rgba(16,185,129,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  signedStatusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#10b981",
  },
  viewAgreementBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  viewAgreementBtnText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
  },
  noStayCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
    marginBottom: 20,
  },
  noStayIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noStayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  noStaySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  buildingText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  reminderBadge: {
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reminderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.danger,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bodyText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  badge: {
    fontSize: 9,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePending: {
    backgroundColor: COLORS.warningLight,
    color: COLORS.warning,
  },
  badgeSuccess: {
    backgroundColor: COLORS.successLight,
    color: COLORS.success,
  },
  badgeDanger: {
    backgroundColor: COLORS.dangerLight,
    color: COLORS.danger,
  },
  actionRow: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  payBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  pendingPayBtn: {
    backgroundColor: COLORS.border,
  },
  payBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 11,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textMuted,
    marginTop: 15,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  agreementScroll: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  agreementLegalText: {
    fontSize: 10,
    color: COLORS.textDark,
    lineHeight: 16,
  },
  closeModalBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeModalBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  signingContainer: {
    paddingTop: 10,
    alignItems: "stretch",
  },
  signatureInstruction: {
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  signatureBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 6,
  },
  signatureBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  noticeBanner: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  noticeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  noticeBadge: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#0369A1",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#7DD3FC",
  },
  noticeDate: {
    fontSize: 8,
    color: COLORS.textMuted,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 10,
    color: COLORS.textMuted,
    lineHeight: 14,
  },
  roommateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarMiniText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  roommateName: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  roommateEmail: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  roommateEmailEmpty: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontStyle: "italic",
    marginTop: 1,
  },
  habitRowMini: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
  },
  habitBadgeMini: {
    fontSize: 8,
    fontWeight: "500",
    color: COLORS.textMuted,
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  emptyTabText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: 10,
  },
  helpDeskRow: {
    flexDirection: "row",
    gap: 8,
  },
  helpDeskCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  helpDeskIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  helpDeskIcon: {
    fontSize: 16,
  },
  helpDeskTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textDark,
    textAlign: "center",
  },
  helpDeskAction: {
    fontSize: 9.5,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 8,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  uploadPhotoBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  uploadPhotoBtnSuccess: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  uploadPhotoBtnText: {
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: "600",
  },
  ticketPhotoLink: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 6,
    textDecorationLine: "underline",
  },
});
