import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";
import { API_BASE } from "../utils/api";
import { UploadService } from "../utils/UploadService";

interface ProfileScreenProps {
  userProfile: any;
  token: string;
  onLogout: () => void;
  roommatePrefs: any;
  rewardPoints: number;
  onUpdatePrefs: (newPrefs: any) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userProfile,
  token,
  onLogout,
  roommatePrefs,
  rewardPoints,
  onUpdatePrefs
}) => {
  // KYC Upload states
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [docType, setDocType] = useState("Aadhaar");
  const [docNum, setDocNum] = useState("");
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);

  // Questionnaire local states (synchronized with roommatePrefs on start)
  const [sleepHabit, setSleepHabit] = useState(roommatePrefs?.sleep || "Night Owl");
  const [foodHabit, setFoodHabit] = useState(roommatePrefs?.food || "Veg");
  const [cleanHabit, setCleanHabit] = useState(roommatePrefs?.clean || "Moderate");

  const fetchKyc = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tenants/kyc`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      if (Array.isArray(data)) setKycDocs(data);
    } catch (e) {
      console.warn("Could not load KYC docs", e);
    }
  };

  const handleKycUpload = async () => {
    if (!docNum.trim()) {
      Alert.alert("Required", "Please enter the Document Number.");
      return;
    }

    setIsUploadingKyc(true);
    try {
      // Determine bucket based on document type
      const bucket = docType.toLowerCase() === "passport" ? "tenant_documents" : docType.toLowerCase();
      
      Alert.alert(
        "Upload Document Photo",
        `Please select a photo of your ${docType} ID.`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setIsUploadingKyc(false)
          },
          {
            text: "Choose Photo",
            onPress: async () => {
              const uploadedUrl = await UploadService.pickAndUploadImage(bucket, API_BASE, token);
              if (!uploadedUrl) {
                setIsUploadingKyc(false);
                return;
              }

              try {
                const res = await fetch(`${API_BASE}/api/tenants/kyc`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    "bypass-tunnel-reminder": "true"
                  },
                  body: JSON.stringify({
                    document_type: docType,
                    document_number: docNum,
                    file_url: uploadedUrl
                  })
                });

                const data = await res.json();
                if (data.error) {
                  Alert.alert("Upload Failed", data.error);
                } else {
                  Alert.alert("Success", "KYC documents uploaded for owner verification.");
                  setDocNum("");
                  fetchKyc();
                }
              } catch (e) {
                Alert.alert("Error", "Could not connect to server.");
              } finally {
                setIsUploadingKyc(false);
              }
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert("Error", "An error occurred during file selection.");
      setIsUploadingKyc(false);
    }
  };

  const handlePreferencesSave = () => {
    onUpdatePrefs({
      sleep: sleepHabit,
      food: foodHabit,
      clean: cleanHabit
    });
    Alert.alert("Preferences Saved", "Your lifestyle habits were saved successfully.");
  };

  useEffect(() => {
    if (token) {
      fetchKyc();
    }
  }, [token]);

  return (
    <ScrollView style={styles.scrollArea} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 1. Header Profile Info */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeaderBg}></View>
        <View style={styles.profileAvatarLarge}>
          <Text style={styles.avatarLargeText}>{(userProfile?.name || "A")[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{userProfile?.name || "Ananya Sharma"}</Text>
        <Text style={styles.profileRole}>{userProfile?.role?.toUpperCase() || "TENANT"}</Text>

        <View style={styles.profileDetailsRow}>
          <Text style={styles.profileDetailLabel}>Email Address</Text>
          <Text style={styles.profileDetailVal}>{userProfile?.email}</Text>
        </View>
        <View style={styles.profileDetailsRow}>
          <Text style={styles.profileDetailLabel}>Contract Status</Text>
          <Text style={[styles.profileDetailVal, { color: COLORS.accent, fontWeight: "700" }]}>
            {(userProfile?.status || "active").toUpperCase()}
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out Account</Text>
        </TouchableOpacity>
      </View>

      {/* 2. LOYALTY REWARDS PORTAL */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🎁 Loyalty Rewards Program</Text>
        
        <View style={styles.rewardsBox}>
          <View style={styles.pointsColumn}>
            <Text style={styles.rewardsPointsText}>{rewardPoints}</Text>
            <Text style={styles.rewardsPointsLabel}>Points Available</Text>
          </View>
          <View style={styles.dividerVertical} />
          <View style={styles.referralColumn}>
            <Text style={styles.refCodeTitle}>Your Referral Code</Text>
            <Text style={styles.refCodeText}>HOMIE-{userProfile?.name?.slice(0, 4).toUpperCase() || "750"}</Text>
            <Text style={styles.refCodeSub}>Get 500 points when friends sign up</Text>
          </View>
        </View>

        <Text style={styles.rewardsHeader}>Points Ledger:</Text>
        <View style={styles.rewardHistoryItem}>
          <Text style={styles.historyName}>🎉 Welcome signup bonus</Text>
          <Text style={styles.historyPoints}>+500 pts</Text>
        </View>
        <View style={styles.rewardHistoryItem}>
          <Text style={styles.historyName}>🔐 Verification setup completed</Text>
          <Text style={styles.historyPoints}>+250 pts</Text>
        </View>
      </View>

      {/* 3. ROOMMATE COMPATIBILITY QUESTIONNAIRE */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>👥 Lifestyle Preferences</Text>
        <Text style={styles.subText}>Configure your lifestyle preferences to compute dynamic roommate matches on PG searches.</Text>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Sleeping Habits</Text>
          <View style={styles.selectorRow}>
            {["Early Bird", "Night Owl"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.selectorBtn, sleepHabit === opt && styles.selectorBtnActive]}
                onPress={() => setSleepHabit(opt)}
              >
                <Text style={[styles.selectorText, sleepHabit === opt && styles.selectorTextActive]}>
                  {opt === "Early Bird" ? "🌅 " : "🌃 "} {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Dietary Preferences</Text>
          <View style={styles.selectorRow}>
            {["Veg", "Non-Veg", "Any"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.selectorBtn, foodHabit === opt && styles.selectorBtnActive]}
                onPress={() => setFoodHabit(opt)}
              >
                <Text style={[styles.selectorText, foodHabit === opt && styles.selectorTextActive]}>
                  {opt === "Veg" ? "🥦 " : opt === "Non-Veg" ? "🍗 " : "🍕 "} {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Cleanliness Standards</Text>
          <View style={styles.selectorRow}>
            {["Very Clean", "Moderate"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.selectorBtn, cleanHabit === opt && styles.selectorBtnActive]}
                onPress={() => setCleanHabit(opt)}
              >
                <Text style={[styles.selectorText, cleanHabit === opt && styles.selectorTextActive]}>
                  {opt === "Very Clean" ? "🧼 " : "🧹 "} {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={handlePreferencesSave}>
          <Text style={styles.actionBtnText}>Save Lifestyle Habits</Text>
        </TouchableOpacity>
      </View>

      {/* 4. KYC Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🛡️ KYC Verification Documents</Text>
        
        {/* Upload Form */}
        <View style={styles.kycForm}>
          <Text style={styles.inputLabel}>Select ID Proof Type</Text>
          <View style={styles.selectorRow}>
            {["Aadhaar", "PAN", "Passport"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.selectorBtn, docType === type && styles.selectorBtnActive]}
                onPress={() => setDocType(type)}
              >
                <Text style={[styles.selectorText, docType === type && styles.selectorTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Enter ID Number</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter ${docType} Number`}
            value={docNum}
            onChangeText={setDocNum}
            autoCapitalize="characters"
            placeholderTextColor={COLORS.textMuted}
          />

          <TouchableOpacity
            style={[styles.actionBtn, isUploadingKyc && styles.disabledBtn]}
            onPress={handleKycUpload}
            disabled={isUploadingKyc}
          >
            <Text style={styles.actionBtnText}>
              {isUploadingKyc ? "Submitting..." : "Submit KYC Info"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Existing uploaded docs */}
        {kycDocs.length > 0 ? (
          kycDocs.map((doc) => {
            const isVerified = doc.verified;
            return (
              <View key={doc.id} style={styles.docRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTypeLabel}>{doc.document_type} ID</Text>
                  <Text style={styles.docVal}>{doc.document_number}</Text>
                </View>
                <View style={[
                  styles.badge, 
                  isVerified ? { backgroundColor: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)", borderWidth: 1 } : { backgroundColor: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.3)", borderWidth: 1 }
                ]}>
                  <Text style={[styles.badgeText, { color: isVerified ? "#059669" : "#d97706" }]}>
                    {isVerified ? "Verified" : "Pending Audit"}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No verified KYC documents found.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
    paddingBottom: 85,
  },
  profileCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  profileHeaderBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: COLORS.primaryLight,
  },
  profileAvatarLarge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primary,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 44,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  avatarLargeText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  profileRole: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    backgroundColor: COLORS.primaryLight + "30",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 20,
  },
  profileDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileDetailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  profileDetailVal: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: "700",
  },
  logoutBtn: {
    marginTop: 20,
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.dangerLight,
    alignItems: "center",
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontWeight: "800",
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  kycForm: {
    backgroundColor: COLORS.primaryLight + "15",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  selectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  selectorBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    ...SHADOWS.small,
  },
  selectorBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  selectorText: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: "600",
  },
  selectorTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: COLORS.textDark,
    marginBottom: 14,
  },
  actionBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    ...SHADOWS.small,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  disabledBtn: {
    backgroundColor: COLORS.border,
  },
  docRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  docTypeLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  docVal: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  subText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 16,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: 12,
    paddingVertical: 12,
  },
  rewardsBox: {
    flexDirection: "row",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.12)",
  },
  pointsColumn: {
    flex: 1,
    alignItems: "center",
  },
  rewardsPointsText: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
  },
  rewardsPointsLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 2,
  },
  dividerVertical: {
    width: 1.5,
    height: "80%",
    backgroundColor: "rgba(99,102,241,0.15)",
    marginHorizontal: 12,
  },
  referralColumn: {
    flex: 2,
  },
  refCodeTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  refCodeText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.accent,
    marginVertical: 2,
    letterSpacing: 0.5,
  },
  refCodeSub: {
    fontSize: 8.5,
    color: COLORS.textMuted,
  },
  rewardsHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 10,
    marginTop: 4,
  },
  rewardHistoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyName: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  historyPoints: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#10b981",
  },
  formGroup: {
    marginBottom: 14,
  },
});
