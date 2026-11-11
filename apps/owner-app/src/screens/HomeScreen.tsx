import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Linking, Image, Modal } from "react-native";
import { COLORS } from "../styles/theme";
import { Header } from "../components/Header";
import { StatCard } from "../components/StatCard";
import { BookingRow } from "../components/BookingRow";

interface HomeScreenProps {
  ownerName: string;
  buildings: any[];
  bookings: any[];
  invoices: any[];
  pendingKycList: any[];
  onApproveBooking: (booking: any) => void;
  onRejectBooking: (id: string) => void;
  onExploreBookings: () => void;
  onVerifyInvoice: (invoiceId: string, status: "Paid" | "Failed") => void;
  onVerifyKyc: (docId: string, action: "approve" | "reject") => void;
  onOpenPgosApp: (appKey: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  ownerName,
  buildings,
  bookings,
  invoices,
  pendingKycList,
  onApproveBooking,
  onRejectBooking,
  onExploreBookings,
  onVerifyInvoice,
  onVerifyKyc,
  onOpenPgosApp,
}) => {
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  // Compute earnings
  const monthlyEarnings = buildings.reduce(
    (sum, b) => sum + (b.monthly_rent_starting ?? 0) * (b.occupied_beds ?? 1),
    0
  );

  const totalRooms = buildings.reduce((sum, b) => sum + (b.total_rooms ?? 0), 0);
  const pendingBookings = bookings.filter((b) => b.booking_status === "Pending").length;
  const recentBookings = bookings.slice(0, 3);
  const pendingPayments = invoices.filter((i) => i.status === "Pending");

  return (
    <View style={styles.container}>
      <Header ownerName={ownerName} />

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Total Monthly Rent</Text>
          <Text style={styles.earningsAmount}>
            ₹{monthlyEarnings.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.earningsSub}>Across {buildings.length} properties</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <StatCard label="Properties" value={buildings.length} icon="🏘️" />
          <StatCard label="Rooms" value={totalRooms || "—"} icon="🚪" />
          <StatCard label="Pending" value={pendingBookings} icon="📋" />
        </View>

        {/* PG Operating System App Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PG Operating System</Text>
        </View>
        <View style={styles.pgosGrid}>
          {[
            { key: "dashboard", label: "Dashboard", icon: "📊", color: "#10B981" },
            { key: "heatmap", label: "Rent Map", icon: "📅", color: "#6366F1" },
            { key: "housekeeping", label: "Housekeep", icon: "🧹", color: "#F59E0B" },
            { key: "staff", label: "Staff Hub", icon: "👥", color: "#3B82F6" },
            { key: "expenses", label: "Expenses", icon: "💰", color: "#EF4444" },
            { key: "maintenance", label: "Tickets AI", icon: "🔧", color: "#EC4899" },
            { key: "notices", label: "Broadcast", icon: "📢", color: "#8B5CF6" },
            { key: "prediction", label: "Predict AI", icon: "🔮", color: "#F59E0B" },
            { key: "pricing", label: "Smart Price", icon: "🏷️", color: "#0F172A" },
            { key: "kpi", label: "Biz KPIs", icon: "📈", color: "#2563EB" },
            { key: "visitor", label: "Security QR", icon: "💂", color: "#10B981" },
            { key: "residents", label: "Residents", icon: "🔑", color: "#D946EF" },
          ].map((app) => (
            <TouchableOpacity
              key={app.key}
              style={styles.pgosGridApp}
              onPress={() => onOpenPgosApp(app.key)}
            >
              <View style={[styles.pgosAppIconBox, { backgroundColor: app.color + "18" }]}>
                <Text style={[styles.pgosAppIcon, { color: app.color }]}>{app.icon}</Text>
              </View>
              <Text style={styles.pgosAppLabel} numberOfLines={1}>{app.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rent Payments to Verify */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Verify Rent Payments</Text>
        </View>

        {pendingPayments.length === 0 ? (
          <Text style={[styles.emptyText, { marginBottom: 20 }]}>No pending rent payments to verify.</Text>
        ) : (
          pendingPayments.map((i) => (
            <View key={i.id} style={styles.paymentVerifyCard}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTenantName}>🏠 {i.buildings?.building_name || "PG Accommodation"}</Text>
                <Text style={styles.paymentDetails}>Period: {i.billing_period || "Monthly Rent"} · Due: {i.due_date}</Text>
                <Text style={styles.paymentAmount}>Rent Paid: ₹{i.amount}</Text>
                <Text style={styles.paymentMethod}>UPI Txn Code: {i.transaction_id || "None"}</Text>
                {i.receipt_url ? (
                  <TouchableOpacity onPress={() => setSelectedReceiptUrl(i.receipt_url)}>
                    <Text style={styles.receiptPreviewLink}>🔍 View Payment Receipt Screenshot</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.btnColumn}>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => onVerifyInvoice(i.id, "Paid")}
                >
                  <Text style={styles.confirmBtnText}>✓ Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => onVerifyInvoice(i.id, "Failed")}
                >
                  <Text style={styles.rejectBtnText}>✕ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Unpaid Rent Invoices Ledger (Cash Payments Bypass) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Unpaid Invoices Ledger</Text>
        </View>

        {invoices.filter((i) => i.status !== "Paid" && i.status !== "Pending").length === 0 ? (
          <Text style={[styles.emptyText, { marginBottom: 20 }]}>All resident accounts are cleared! 🎉</Text>
        ) : (
          invoices
            .filter((i) => i.status !== "Paid" && i.status !== "Pending")
            .map((i) => (
              <View key={i.id} style={styles.paymentVerifyCard}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTenantName}>🏠 {i.buildings?.building_name || "PG Accommodation"}</Text>
                  <Text style={styles.paymentDetails}>Period: {i.billing_period || "Monthly Rent"} · Due: {i.due_date}</Text>
                  <Text style={styles.paymentAmount}>Due: ₹{i.amount} · Status: <Text style={{ color: COLORS.danger, fontWeight: "bold" }}>{i.status.toUpperCase()}</Text></Text>
                </View>
                <View style={styles.btnColumn}>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: "#10b981" }]}
                    onPress={() => {
                      Alert.alert(
                        "Collect Cash Rent",
                        `Directly mark this ₹${i.amount} invoice (${i.billing_period || "Rent"}) as paid via cash?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Mark Paid",
                            onPress: () => onVerifyInvoice(i.id, "Paid"),
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.confirmBtnText}>💵 Paid Cash</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
        )}

        {/* Tenant KYC Document Verification */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Verify Tenant KYC Documents</Text>
        </View>

        {(!pendingKycList || pendingKycList.length === 0) ? (
          <Text style={[styles.emptyText, { marginBottom: 20 }]}>No pending KYC documents to verify.</Text>
        ) : (
          pendingKycList.map((doc) => (
            <View key={doc.id} style={styles.paymentVerifyCard}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTenantName}>👤 {doc.tenants?.profiles?.name || "Resident Tenant"}</Text>
                <Text style={styles.paymentDetails}>{doc.document_type || "Aadhaar Card"} No: {doc.document_number || "—"}</Text>
                {doc.file_url ? (
                  <TouchableOpacity onPress={() => setSelectedReceiptUrl(doc.file_url)}>
                    <Text style={{ fontSize: 10, color: COLORS.primary, marginTop: 6, fontWeight: "700", textDecorationLine: "underline" }}>
                      📄 View Uploaded Aadhaar File
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.btnColumn}>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => onVerifyKyc(doc.id, "approve")}
                >
                  <Text style={styles.confirmBtnText}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => onVerifyKyc(doc.id, "reject")}
                >
                  <Text style={styles.rejectBtnText}>✕ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Recent Booking Requests */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Bookings</Text>
          <TouchableOpacity onPress={onExploreBookings}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings yet.</Text>
        ) : (
          recentBookings.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              onApprove={onApproveBooking}
              onReject={onRejectBooking}
            />
          ))
        )}
      </ScrollView>

      {/* Verification Screenshot/Document Preview Modal */}
      <Modal
        visible={!!selectedReceiptUrl}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedReceiptUrl(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verification Document / Receipt</Text>
            {selectedReceiptUrl ? (
              <Image source={{ uri: selectedReceiptUrl }} style={styles.previewImage as any} />
            ) : null}
            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => setSelectedReceiptUrl(null)}
            >
              <Text style={styles.closeModalText}>Close Preview</Text>
            </TouchableOpacity>
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
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  earningsCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  earningsLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  earningsAmount: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 6,
  },
  earningsSub: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  seeAll: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "bold",
  },
  pgosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pgosGridApp: {
    width: "22%",
    alignItems: "center",
    marginBottom: 14,
  },
  pgosAppIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  pgosAppIcon: {
    fontSize: 20,
  },
  pgosAppLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.textDark,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: 30,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentVerifyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentInfo: {
    flex: 1,
    marginRight: 12,
  },
  paymentTenantName: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  paymentDetails: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.accent,
    marginTop: 4,
  },
  paymentMethod: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  btnColumn: {
    gap: 8,
  },
  confirmBtn: {
    backgroundColor: "#10b981",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  rejectBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  rejectBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 16,
  },
  previewImage: {
    width: "100%",
    height: 350,
    borderRadius: 10,
    resizeMode: "contain",
    backgroundColor: "#f8fafc",
  },
  closeModalBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
  closeModalText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  receiptPreviewLink: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 6,
    textDecorationLine: "underline",
  },
});
