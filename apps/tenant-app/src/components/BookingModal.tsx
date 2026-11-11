import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Image, ActivityIndicator, Alert, ScrollView } from "react-native";
import { COLORS } from "../styles/theme";
import { UploadService } from "../utils/UploadService";

interface BookingModalProps {
  visible: boolean;
  bookingRoom: any;
  onClose: () => void;
  confirmBooking: (receiptUrl?: string, transactionId?: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  apiBase?: string;
  token?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  visible,
  bookingRoom,
  onClose,
  confirmBooking,
  paymentMethod,
  setPaymentMethod,
  apiBase,
  token,
}) => {
  const [receiptUrl, setReceiptUrl] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  if (!bookingRoom) return null;

  const rentAmount = bookingRoom.rent || bookingRoom.double_sharing_rent || 8500;
  const securityDeposit = 5000;
  const totalAmount = rentAmount + securityDeposit;

  const handlePickReceipt = async () => {
    if (!apiBase || !token) {
      Alert.alert("Error", "Server connection issue. Try again later.");
      return;
    }
    setIsUploading(true);
    try {
      const url = await UploadService.pickAndUploadImage("tenant_documents", apiBase, token);
      if (url) {
        setReceiptUrl(url);
        Alert.alert("Receipt Attached", "Your advance deposit payment screenshot has been uploaded!");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Upload Failed", "Could not upload payment receipt.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmPress = () => {
    if (paymentMethod === "UPI") {
      if (!receiptUrl) {
        Alert.alert("Required", "Please upload your UPI transaction screenshot receipt.");
        return;
      }
      if (!transactionId.trim()) {
        Alert.alert("Required", "Please enter the UPI transaction code / reference number.");
        return;
      }
    }
    confirmBooking(receiptUrl, transactionId.trim());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.modalTitle}>Confirm Your Booking</Text>
            <Text style={styles.modalSubtitle}>Verify your details and choose payment option.</Text>

            <View style={styles.modalReceipt}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Room Cost</Text>
                <Text style={styles.receiptVal}>₹{rentAmount}/mo</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Security Deposit</Text>
                <Text style={styles.receiptVal}>₹{securityDeposit}</Text>
              </View>
              <View style={[styles.receiptRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Booking Advance Due</Text>
                <Text style={styles.totalVal}>₹{securityDeposit}</Text>
              </View>
            </View>

            <Text style={styles.paymentMethodTitle}>Select Payment Method</Text>
            <View style={styles.paymentSelectorRow}>
              {["UPI", "Card", "Net Banking"].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethodBtn,
                    paymentMethod === method && styles.paymentMethodBtnActive,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === method && styles.paymentMethodTextActive,
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* UPI Dynamic Details Panel */}
            {paymentMethod === "UPI" && (
              <View style={upiStyles.upiContainer}>
                <Text style={upiStyles.upiTitle}>Scan QR Code to Transfer ₹{securityDeposit}</Text>
                <View style={upiStyles.qrCodeWrapper}>
                  <Image
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=owner@upi&am=${securityDeposit}&cu=INR` }}
                    style={upiStyles.qrCodeImage as any}
                  />
                </View>
                <Text style={upiStyles.upiAddressText}>UPI ID: <Text style={{ fontWeight: "bold" }}>owner@upi</Text></Text>

                <Text style={upiStyles.inputLabel}>UPI Transaction reference ID</Text>
                <TextInput
                  style={upiStyles.textInput}
                  placeholder="Enter 12-digit transaction ID (e.g. 2341...)"
                  placeholderTextColor="#94a3b8"
                  value={transactionId}
                  onChangeText={setTransactionId}
                />

                <TouchableOpacity 
                  style={[upiStyles.uploadReceiptBtn, receiptUrl ? upiStyles.uploadReceiptSuccess : null]}
                  onPress={handlePickReceipt}
                  disabled={isUploading}
                >
                  <Text style={upiStyles.uploadReceiptText}>
                    {isUploading ? "⏳ Uploading..." : receiptUrl ? "✓ Receipt Screenshot Attached" : "📸 Upload Payment Screenshot"}
                  </Text>
                </TouchableOpacity>

                {receiptUrl ? (
                  <View style={upiStyles.screenshotPreviewContainer}>
                    <Image source={{ uri: receiptUrl }} style={upiStyles.screenshotPreviewImage as any} />
                    <TouchableOpacity onPress={() => setReceiptUrl("")} style={upiStyles.removeScreenshotBtn}>
                      <Text style={upiStyles.removeScreenshotText}>✕ Remove Attachment</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalConfirmBtn, isUploading && { backgroundColor: "#cbd5e1" }]} 
                onPress={handleConfirmPress}
                disabled={isUploading}
              >
                <Text style={styles.confirmBtnText}>{isUploading ? "Uploading..." : "Pay & Confirm"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  modalReceipt: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  receiptLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  receiptVal: {
    color: COLORS.textDark,
    fontWeight: "500",
    fontSize: 13,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 5,
    marginBottom: 0,
  },
  totalLabel: {
    fontWeight: "bold",
    color: COLORS.textDark,
    fontSize: 14,
  },
  totalVal: {
    fontWeight: "bold",
    color: COLORS.primary,
    fontSize: 16,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 10,
  },
  paymentSelectorRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  paymentMethodBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  paymentMethodBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  paymentMethodText: {
    color: COLORS.textMuted,
    fontWeight: "500",
    fontSize: 13,
  },
  paymentMethodTextActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelBtnText: {
    color: COLORS.textMuted,
    fontWeight: "bold",
  },
  modalConfirmBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

const upiStyles = StyleSheet.create({
  upiContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  upiTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 12,
  },
  qrCodeWrapper: {
    alignItems: "center",
    marginBottom: 8,
  },
  qrCodeImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
  },
  upiAddressText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textDark,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  uploadReceiptBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.primaryLight + "15",
  },
  uploadReceiptSuccess: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight + "15",
  },
  uploadReceiptText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  screenshotPreviewContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  screenshotPreviewImage: {
    width: "100%" as any,
    height: 160,
    borderRadius: 8,
    marginBottom: 6,
  },
  removeScreenshotBtn: {
    paddingVertical: 4,
  },
  removeScreenshotText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: "600",
  },
});
