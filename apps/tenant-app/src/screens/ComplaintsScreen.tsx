import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Linking, Image, Modal, Platform } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";
import { UploadService } from "../utils/UploadService";

interface ComplaintsScreenProps {
  activeStay: any;
  userProfile: any;
  maintenanceTickets: any[];
  onCreateTicket: (category: string, description: string, photoUrl?: string) => Promise<void>;
  apiBase?: string;
  token?: string;
}

export const ComplaintsScreen: React.FC<ComplaintsScreenProps> = ({
  activeStay,
  userProfile,
  maintenanceTickets = [],
  onCreateTicket,
  apiBase,
  token,
}) => {
  const [ticketCategory, setTicketCategory] = useState("WiFi");
  const [ticketDesc, setTicketDesc] = useState("");
  const [complaintPhoto, setComplaintPhoto] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const handlePhotoUpload = async () => {
    if (!apiBase || !token) {
      Alert.alert("Error", "Server connection issue. Try again later.");
      return;
    }
    setIsUploadingPhoto(true);
    try {
      const url = await UploadService.pickAndUploadImage("tenant_documents", apiBase, token);
      if (url) {
        setComplaintPhoto(url);
        Alert.alert("Success", "Complaint photo evidence attached!");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Upload Failed", "Could not upload photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!activeStay) {
      Alert.alert("Access Denied", "An active stay checked-in record is required to log complaints.");
      return;
    }
    if (!ticketDesc.trim()) {
      Alert.alert("Required", "Please describe the maintenance issue.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreateTicket(ticketCategory, ticketDesc.trim(), complaintPhoto);
      setTicketDesc("");
      setComplaintPhoto("");
    } catch (err) {
      Alert.alert("Error", "Failed to file ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeStay) {
    return (
      <View style={styles.noStayContainer}>
        <View style={styles.noStayCard}>
          <Text style={styles.noStayIcon}>🏠</Text>
          <Text style={styles.noStayTitle}>Active Stay Required</Text>
          <Text style={styles.noStaySubtitle}>
            You must be checked-in to a room to lodge maintenance complaints. Book a room from the Search tab to get started.
          </Text>
        </View>
      </View>
    );
  }

  const categoryEmojis: { [key: string]: string } = {
    WiFi: "📶",
    Electrical: "💡",
    Mechanical: "🔧",
    Cleaning: "🧹",
    Plumbing: "🚿",
    Other: "📦",
  };

  return (
    <View style={styles.flexContainer}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <Text style={styles.pageTitle}>Maintenance Concierge</Text>
        <Text style={styles.pageSubtitle}>Lodge housekeeping or repair requests for your accommodation.</Text>

        {/* Tenant & Room Info Panel */}
        <View style={styles.infoCard}>
          <Text style={styles.infoHeading}>Resident Assignment Context</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>RESIDENT</Text>
              <Text style={styles.infoValue}>{userProfile?.name || "Resident Tenant"}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>ROOM / BED</Text>
              <Text style={styles.infoValue}>
                Room {activeStay.rooms?.room_number || "?"} · Bed {activeStay.beds?.bed_number || "?"}
              </Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <Text style={styles.infoLabel}>PROPERTY LOCATION</Text>
          <Text style={[styles.infoValue, { marginTop: 4 }]}>🏠 {activeStay.buildings?.building_name || "PG Property"}</Text>
        </View>

        {/* Lodging Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionHeading}>Raise a Service Request</Text>
          
          <Text style={styles.fieldLabel}>Select Issue Category</Text>
          <View style={styles.categoryRow}>
            {["WiFi", "Electrical", "Mechanical", "Cleaning", "Plumbing", "Other"].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, ticketCategory === cat && styles.categoryChipActive]}
                onPress={() => setTicketCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryChipText, ticketCategory === cat && styles.categoryChipTextActive]}>
                  {categoryEmojis[cat] || "🛠️"} {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Problem Description</Text>
          <TextInput
            style={styles.descriptionInput}
            multiline
            numberOfLines={4}
            placeholder="Describe the complaint in detail (e.g. WiFi not connecting since morning, water heater not turning on)..."
            value={ticketDesc}
            onChangeText={setTicketDesc}
            placeholderTextColor={COLORS.textMuted}
          />

          {/* Photo attachment evidence picker */}
          <TouchableOpacity
            style={[styles.uploadBtn, complaintPhoto ? styles.uploadBtnSuccess : null]}
            onPress={handlePhotoUpload}
            disabled={isUploadingPhoto}
            activeOpacity={0.7}
          >
            <Text style={styles.uploadBtnText}>
              {isUploadingPhoto ? "⏳ Attaching file..." : complaintPhoto ? "✓ Photo Evidence Attached" : "📸 Upload Photo Evidence"}
            </Text>
          </TouchableOpacity>

          {complaintPhoto ? (
            <View style={styles.photoAttachedPreviewBox}>
              <Image source={{ uri: complaintPhoto }} style={styles.photoAttachedPreview as any} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setComplaintPhoto("")}>
                <Text style={styles.removePhotoText}>✕ Remove Attachment</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
            onPress={handleFormSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitBtnText}>{isSubmitting ? "Submitting..." : "Log Service Ticket ➔"}</Text>
          </TouchableOpacity>
        </View>

        {/* Complaints Logs History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionHeading}>Active & Past Requests Log</Text>
          {maintenanceTickets.length > 0 ? (
            maintenanceTickets.map((t: any) => {
              const isResolved = t.status === "Resolved";
              const isScheduled = t.status === "Scheduled";
              
              let statusColor = COLORS.warning;
              let statusBg = COLORS.warningLight;
              let statusBorder = "rgba(245,158,11,0.2)";
              if (isResolved) {
                statusColor = COLORS.success;
                statusBg = COLORS.successLight;
                statusBorder = "rgba(16,185,129,0.2)";
              } else if (isScheduled) {
                statusColor = COLORS.primary;
                statusBg = COLORS.primaryLight;
                statusBorder = "rgba(99,102,241,0.2)";
              }

              return (
                <View key={t.id} style={[styles.ticketCard, { borderColor: statusBorder }]}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.ticketHeaderRow}>
                      <Text style={styles.ticketCat}>
                        {categoryEmojis[t.category] || "🛠️"} {t.category}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {t.status?.toUpperCase() || "SUBMITTED"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.ticketDate}>
                      Logged: {t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}
                    </Text>
                    <Text style={styles.ticketDesc}>{t.description}</Text>
                    
                    {t.photo_url && (
                      <TouchableOpacity 
                        style={styles.historyPhotoThumbnailBtn}
                        onPress={() => setSelectedPhotoUrl(t.photo_url)} 
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: t.photo_url }} style={styles.historyPhotoThumbnail as any} />
                        <Text style={styles.historyPhotoText}>🔍 View Attachment</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyHistoryCard}>
              <Text style={styles.emptyHistoryText}>No complaints raised yet. Your room is fully operational! 🎉</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Ticket Photo Attachment Modal Viewer */}
      <Modal
        visible={!!selectedPhotoUrl}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhotoUrl(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complaint Evidence Photo</Text>
            {selectedPhotoUrl ? (
              <Image source={{ uri: selectedPhotoUrl }} style={styles.previewImage as any} />
            ) : null}
            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => setSelectedPhotoUrl(null)}
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
  pageTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  pageSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 20,
  },
  noStayContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },
  noStayCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  noStayIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noStayTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  noStaySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  infoHeading: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8.5,
    color: COLORS.textMuted,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: "700",
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  categoryChipText: {
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: COLORS.textDark,
    textAlignVertical: "top",
    height: 100,
    marginBottom: 14,
  },
  uploadBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  uploadBtnSuccess: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight,
    borderStyle: "solid",
  },
  uploadBtnText: {
    fontSize: 11.5,
    color: COLORS.primary,
    fontWeight: "800",
  },
  photoAttachedPreviewBox: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 8,
    marginBottom: 14,
    alignItems: "center",
  },
  photoAttachedPreview: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    resizeMode: "contain",
  },
  removePhotoBtn: {
    marginTop: 6,
  },
  removePhotoText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.danger,
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    ...SHADOWS.small,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  historySection: {
    marginBottom: 20,
  },
  ticketCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  ticketHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketCat: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 8.5,
    fontWeight: "800",
  },
  ticketDate: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  ticketDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginTop: 8,
  },
  historyPhotoThumbnailBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
    gap: 10,
  },
  historyPhotoThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
  },
  historyPhotoText: {
    fontSize: 10.5,
    color: COLORS.primary,
    fontWeight: "800",
  },
  emptyHistoryCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyHistoryText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
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
});
