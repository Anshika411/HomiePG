import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Alert, Linking, ActivityIndicator, Image } from "react-native";
import { COLORS } from "../styles/theme";
import { UploadService } from "../utils/UploadService";

interface PaymentModalProps {
  visible: boolean;
  invoice: any;
  onClose: () => void;
  onSubmitPayment: (transactionId: string, paymentMethod: string, receiptUrl: string, pointsDeducted?: number) => void;
  apiBase?: string;
  token?: string;
  rewardPoints?: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  invoice,
  onClose,
  onSubmitPayment,
  apiBase,
  token,
  rewardPoints = 0,
}) => {
  const [txnId, setTxnId] = useState("");
  const [method, setMethod] = useState("UPI");
  const [settlement, setSettlement] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Reset state when visible changes
  useEffect(() => {
    if (visible) {
      setTxnId("");
      setReceiptUrl("");
      setRedeemPoints(false);
    }
  }, [visible]);

  // Fetch payee details dynamically
  useEffect(() => {
    if (visible && invoice && apiBase && token) {
      setLoading(true);
      fetch(`${apiBase}/api/payments/invoices/${invoice.id}/settlement`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setSettlement(data);
          }
        })
        .catch(err => console.error("Error loading settlement details", err))
        .finally(() => setLoading(false));
    }
  }, [visible, invoice]);

  if (!invoice) return null;

  const handleConfirm = () => {
    if (method !== "Cash" && !txnId.trim()) {
      Alert.alert("Required", "Please enter the payment transaction reference ID.");
      return;
    }
    if (method !== "Cash" && !receiptUrl) {
      Alert.alert("Required", "Please upload a screenshot of your payment receipt.");
      return;
    }
    const pointsToDeduct = redeemPoints ? 500 : 0;
    onSubmitPayment(txnId.trim() || "CASH_PAYMENT", method, receiptUrl, pointsToDeduct);
    setTxnId("");
    setReceiptUrl("");
    setRedeemPoints(false);
    onClose();
  };

  const handleReceiptUpload = async () => {
    if (!apiBase || !token) {
      Alert.alert("Error", "Server connectivity issue. Try again later.");
      return;
    }
    setIsUploading(true);
    try {
      const url = await UploadService.pickAndUploadImage("receipts", apiBase, token);
      if (url) {
        setReceiptUrl(url);
        Alert.alert("Success", "Receipt screenshot uploaded successfully!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const targetVpa = settlement?.upi_vpa || "homiepgpayments@oksbi";
  const targetName = settlement?.payee_name || "Homie PG Properties";

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Submit Rent Payment</Text>
          <Text style={styles.modalSubtitle}>Please pay the amount, then enter transaction ID to verify.</Text>

          <View style={styles.invoiceSummary}>
            <Text style={styles.invoiceTitle}>Invoice Period: {invoice.billing_period}</Text>
            <Text style={styles.invoiceAmount}>
              Amount Due: {redeemPoints ? (
                <Text style={{ color: COLORS.primary }}>
                  <Text style={{ textDecorationLine: "line-through", color: COLORS.textMuted }}>₹{invoice.amount}</Text>
                  {" "}₹{invoice.amount - 250}
                </Text>
              ) : `₹${invoice.amount}`}
            </Text>
          </View>

          {/* Reward Points Deduction Widget */}
          {rewardPoints >= 500 && method !== "Cash" && (
            <TouchableOpacity 
              style={[styles.pointsDeductionCard, redeemPoints && styles.pointsDeductionCardActive]}
              onPress={() => setRedeemPoints(!redeemPoints)}
              activeOpacity={0.7}
            >
              <View style={styles.checkboxRow}>
                <View style={[styles.checkbox, redeemPoints && styles.checkboxChecked]}>
                  {redeemPoints && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.pointsRedeemTitle}>Redeem 500 HomiePoints</Text>
                  <Text style={styles.pointsRedeemSub}>Apply ₹250 discount using points (Balance: {rewardPoints} pts)</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          <Text style={styles.inputLabel}>Payment Method Used</Text>
          <View style={styles.methodSelector}>
            {["UPI", "Bank Transfer", "Cash"].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.methodBtn, method === m && styles.methodBtnActive]}
                onPress={() => setMethod(m)}
              >
                <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading && (
            <View style={{ paddingVertical: 10, alignItems: "center" }}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4 }}>Loading payment gateway info...</Text>
            </View>
          )}

          {!loading && method === "UPI" && (
            <TouchableOpacity
              style={styles.upiPayBtn}
              onPress={() => {
                const upiUrl = `upi://pay?pa=${targetVpa}&pn=${encodeURIComponent(targetName)}&am=${invoice.amount}&cu=INR&tn=Rent%20Period%20${invoice.billing_period}`;
                Linking.openURL(upiUrl).catch(() => {
                  Alert.alert(
                    "UPI Launch Error",
                    "No default UPI apps (GPay, PhonePe, Paytm, BHIM) found on this device.\n\nPlease transfer ₹" + invoice.amount + " manually to UPI: " + targetVpa
                  );
                });
              }}
            >
              <Text style={styles.upiPayBtnText}>⚡ Pay Instantly via GPay/PhonePe/Paytm</Text>
            </TouchableOpacity>
          )}

          {!loading && method === "Bank Transfer" && (
            <View style={styles.bankDetailsCard}>
              <Text style={styles.bankDetailHeader}>Beneficiary Bank Account Details:</Text>
              
              <Text style={styles.bankLabel}>Beneficiary Name</Text>
              <Text style={styles.bankValue}>{settlement?.payee_name || "Homie PG Properties"}</Text>
              
              <Text style={styles.bankLabel}>Account Number (Double tap to select)</Text>
              <Text style={styles.bankValue} selectable={true}>{settlement?.bank_account || "XXXXXXXX5912"}</Text>
              
              <Text style={styles.bankLabel}>Bank IFSC Code</Text>
              <Text style={styles.bankValue} selectable={true}>{settlement?.bank_ifsc || "SBIN0004928"}</Text>
              
              <Text style={styles.bankInstruction}>
                ⚠️ Please transfer ₹{invoice.amount} via NEFT/IMPS to this account, then enter the UTR/Reference code below.
              </Text>
            </View>
          )}

          {!loading && method === "Cash" && (
            <View style={styles.cashNoticeBox}>
              <Text style={styles.cashNoticeText}>
                💵 Please hand over ₹{invoice.amount} in cash directly to the PG Warden / Manager. The owner will mark it as paid in their console.
              </Text>
            </View>
          )}

          {method !== "Cash" && (
            <>
              <Text style={styles.inputLabel}>Transaction ID / Reference Number</Text>
              <TextInput
                style={styles.input}
                placeholder={method === "UPI" ? "e.g. UPI Ref: 3482718291..." : "e.g. UTR / IMPS Ref Code..."}
                value={txnId}
                onChangeText={setTxnId}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Payment Receipt Screenshot</Text>
              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  isUploading && styles.disabledBtn,
                  receiptUrl ? styles.uploadBtnSuccess : null
                ]}
                onPress={handleReceiptUpload}
                disabled={isUploading}
              >
                <Text style={styles.uploadBtnText}>
                  {isUploading 
                    ? "⏳ Uploading..." 
                    : receiptUrl 
                      ? "✓ Receipt Uploaded (Tap to Change)" 
                      : "📸 Select & Upload Screenshot"
                  }
                </Text>
              </TouchableOpacity>
              {receiptUrl ? (
                <View style={styles.screenshotPreviewContainer}>
                  <Image source={{ uri: receiptUrl }} style={styles.screenshotPreview as any} />
                  <TouchableOpacity style={styles.removeScreenshotBtn} onPress={() => setReceiptUrl("")}>
                    <Text style={styles.removeScreenshotBtnText}>✕ Remove Screenshot</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Submit Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 380,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  invoiceSummary: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  invoiceTitle: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: "600",
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 6,
  },
  methodSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  methodBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  methodBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  methodText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  methodTextActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 20,
    backgroundColor: COLORS.background,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontWeight: "bold",
    fontSize: 13,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  upiPayBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  upiPayBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  cashNoticeBox: {
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  cashNoticeText: {
    fontSize: 11,
    color: "#d97706",
    lineHeight: 16,
    fontWeight: "500",
  },
  bankDetailsCard: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  bankDetailHeader: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  bankLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 6,
  },
  bankValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginTop: 2,
  },
  bankInstruction: {
    fontSize: 9,
    color: COLORS.danger,
    marginTop: 10,
    lineHeight: 13,
    fontWeight: "500",
  },
  uploadBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  uploadBtnSuccess: {
    backgroundColor: "rgba(16,185,129,0.08)",
    borderColor: "#10b981",
    borderStyle: "solid",
  },
  uploadBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
  },
  uploadedUrlText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  disabledBtn: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
  },
  pointsDeductionCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  pointsDeductionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxTick: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  pointsRedeemTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  pointsRedeemSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  screenshotPreviewContainer: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  screenshotPreview: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    resizeMode: "contain",
    backgroundColor: "#f1f5f9",
  },
  removeScreenshotBtn: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeScreenshotBtnText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.danger,
  },
});
