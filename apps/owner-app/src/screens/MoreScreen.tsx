import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView, Switch, Image, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { COLORS, SHADOWS } from "../styles/theme";

interface MoreScreenProps {
  userProfile: any;
  onLogout: () => void;
  apiBase: string;
  token: string;
  onUpdateProfile: (newProfile: any) => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({
  userProfile,
  onLogout,
  apiBase,
  token,
  onUpdateProfile
}) => {
  const name = userProfile?.name ?? userProfile?.full_name ?? "Owner";

  // Basic profile details states
  const [nameInput, setNameInput] = useState(name);
  const [mobileInput, setMobileInput] = useState(userProfile?.mobile || "");
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || "");
  const [isSavingBasic, setIsSavingBasic] = useState(false);

  // Banking settlement details states
  const [upiVpa, setUpiVpa] = useState("");
  const [payeeName, setPayeeName] = useState(name);
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [rbiChecked, setRbiChecked] = useState(true);
  const [isSavingSettlement, setIsSavingSettlement] = useState(false);

  // Load encrypted settlement details from DB
  const loadSettlementDetails = async () => {
    try {
      const res = await fetch(`${apiBase}/api/payments/settlement`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        }
      });
      const data = await res.json();
      if (data && !data.error) {
        setUpiVpa(data.upi_vpa || "");
        setPayeeName(data.payee_name || "");
        setBankAccount(data.bank_account || "");
        setBankIfsc(data.bank_ifsc || "");
      }
    } catch (err) {
      console.warn("Could not load settlement details", err);
    }
  };

  useEffect(() => {
    if (token) {
      loadSettlementDetails();
    }
  }, [token]);

  // Synchronize state when userProfile props update (e.g. after successful save)
  useEffect(() => {
    if (userProfile) {
      setNameInput(userProfile.name || "");
      setMobileInput(userProfile.mobile || "");
      setAvatarUrl(userProfile.avatar_url || "");
    }
  }, [userProfile]);

  const handleUploadPhoto = async () => {
    // If running in a web browser, use HTML file input directly
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = reader.result as string;
            await performBucketUpload(base64);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    // For mobile platforms, prompt choice between Camera and Photo Library
    Alert.alert(
      "Profile Photo",
      "Select an image source:",
      [
        {
          text: "📸 Take Photo",
          onPress: handleLaunchCamera
        },
        {
          text: "🖼️ Choose from Gallery",
          onPress: handleLaunchGallery
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleLaunchCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera permission is required to capture your profile photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          await performBucketUpload(`data:image/png;base64,${asset.base64}`);
        } else {
          const base64 = await convertUriToBase64(asset.uri);
          await performBucketUpload(base64);
        }
      }
    } catch (err) {
      Alert.alert("Error", "Could not access device camera.");
    }
  };

  const handleLaunchGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Gallery permission is required to select your profile photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          await performBucketUpload(`data:image/png;base64,${asset.base64}`);
        } else {
          const base64 = await convertUriToBase64(asset.uri);
          await performBucketUpload(base64);
        }
      }
    } catch (err) {
      Alert.alert("Error", "Could not access photo library.");
    }
  };

  const convertUriToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const performBucketUpload = async (base64Stream: string) => {
    setIsSavingBasic(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/upload-avatar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({
          image_base64: base64Stream
        })
      });
      const data = await res.json();
      if (data && data.publicUrl) {
        setAvatarUrl(data.publicUrl);
        Alert.alert("Success", "Photo uploaded successfully!");
      } else {
        Alert.alert("Error", "Could not complete image upload.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not connect to the upload server.");
    } finally {
      setIsSavingBasic(false);
    }
  };

  const handleSaveBasic = async () => {
    if (!nameInput.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }

    setIsSavingBasic(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({
          name: nameInput,
          mobile: mobileInput,
          avatar_url: avatarUrl
        })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Success", "Basic profile details updated successfully!");
        onUpdateProfile(data.profile);
      }
    } catch (err) {
      Alert.alert("Error", "Could not connect to database.");
    } finally {
      setIsSavingBasic(false);
    }
  };

  const handleSaveSettlement = async () => {
    if (!upiVpa.includes("@")) {
      Alert.alert("Invalid VPA", "Please enter a valid UPI VPA (e.g. name@bank)");
      return;
    }
    if (!rbiChecked) {
      Alert.alert("RBI Compliance Required", "Please accept the RBI compliance declaration to enable online UPI collections.");
      return;
    }

    setIsSavingSettlement(true);
    try {
      const res = await fetch(`${apiBase}/api/payments/settlement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({
          upi_vpa: upiVpa,
          payee_name: payeeName,
          bank_account: bankAccount,
          bank_ifsc: bankIfsc
        })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert(
          "Encrypted & Saved",
          "Your settlement parameters are securely AES-256 encrypted and stored in the database. Tenants will pay to: " + upiVpa
        );
        loadSettlementDetails();
      }
    } catch (err) {
      Alert.alert("Error", "Could not connect to database.");
    } finally {
      setIsSavingSettlement(false);
    }
  };

  return (
    <ScrollView style={styles.scrollArea} contentContainerStyle={styles.container}>
      {/* 1. Header Profile Info */}
      <View style={styles.profileCard}>
        {avatarUrl && (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) ? (
          <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImage} />
        ) : (
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {name[0] ? name[0].toUpperCase() : "O"}
            </Text>
          </View>
        )}
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profileEmail}>{userProfile?.email || "owner@homiepg.com"}</Text>
        <View style={[styles.statusBadge, styles.badgeGreen]}>
          <Text style={styles.statusBadgeText}>PG Owner</Text>
        </View>
      </View>

      {/* 2. BASIC PROFILE DETAILS FORM */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>👤 Basic Profile Details</Text>

        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Full Name"
          value={nameInput}
          onChangeText={setNameInput}
        />

        <Text style={styles.inputLabel}>Contact Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. +91 99999 88888"
          value={mobileInput}
          onChangeText={setMobileInput}
          keyboardType="phone-pad"
        />

        <Text style={styles.inputLabel}>Profile Photo</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadPhoto}>
          <Text style={styles.uploadBtnText}>📤 Upload Photo</Text>
        </TouchableOpacity>

        {avatarUrl ? (
          <View style={styles.cdnUrlCard}>
            <Text style={styles.cdnLabel}>Photo URL:</Text>
            <Text style={styles.cdnValue} numberOfLines={1}>{avatarUrl}</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          style={[styles.saveBtn, isSavingBasic && { backgroundColor: COLORS.textMuted }]} 
          onPress={handleSaveBasic}
          disabled={isSavingBasic}
        >
          <Text style={styles.saveBtnText}>{isSavingBasic ? "Updating..." : "Save Basic Details"}</Text>
        </TouchableOpacity>
      </View>

      {/* 3. BANK SETTLEMENT & RBI COMPLIANCE FORM */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🛡️ Bank Settlement (AES-256 Encrypted)</Text>
        <Text style={styles.subText}>Configure where resident rent payments will be direct routed via UPI and Bank settlements.</Text>

        <Text style={styles.inputLabel}>UPI VPA Address (Payee Address)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. myproperty@okaxis"
          value={upiVpa}
          onChangeText={setUpiVpa}
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Payee Display Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Amit Property Managers"
          value={payeeName}
          onChangeText={setPayeeName}
        />

        <Text style={styles.inputLabel}>Settlement Bank Account Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 50200028192..."
          value={bankAccount}
          onChangeText={setBankAccount}
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Bank IFSC Code</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. HDFC0001202"
          value={bankIfsc}
          onChangeText={setBankIfsc}
          autoCapitalize="characters"
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.rbiLabel}>RBI Compliance Certificate</Text>
            <Text style={styles.rbiSubText}>
              I certify that this VPA links to a verified PAN-mapped bank account in compliance with RBI guidelines on peer-to-peer collection limits.
            </Text>
          </View>
          <Switch value={rbiChecked} onValueChange={setRbiChecked} />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, isSavingSettlement && { backgroundColor: COLORS.textMuted }]} 
          onPress={handleSaveSettlement}
          disabled={isSavingSettlement}
        >
          <Text style={styles.saveBtnText}>{isSavingSettlement ? "Saving Encrypted..." : "Save Payment Details"}</Text>
        </TouchableOpacity>
      </View>

      {/* 4. EMERGENCY ALERT SECTION */}
      <View style={[styles.sectionCard, { borderColor: COLORS.danger, borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>🚨 PG Emergency Desk</Text>
        <Text style={styles.subText}>Activating Emergency Mode broadcasts an urgent alert to all tenant portals and checks database statuses immediately.</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: COLORS.danger }]}
          onPress={() => {
            Alert.alert(
              "Activate Emergency Mode?",
              "This will instantly broadcast an urgent safety alert to all tenant apps. Confirm if there is a fire, medical, or security hazard.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "🚨 BROADCAST ALERT",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const res = await fetch(`${apiBase}/api/notices`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                          "bypass-tunnel-reminder": "true"
                        },
                        body: JSON.stringify({
                          title: "🚨 EMERGENCY ALERT BROADCAST",
                          message: "Emergency services (Fire/Medical/Police) are active. Please follow evacuation protocols and remain calm.",
                          category: "urgent"
                        })
                      });
                      const data = await res.json();
                      if (data.error) {
                        Alert.alert("Failed to trigger alert", data.error);
                      } else {
                        Alert.alert("🚨 EMERGENCY ACTIVE", "Broadcast sent successfully to all resident apps.");
                      }
                    } catch (_) {
                      Alert.alert("Error", "Could not connect to notify residents.");
                    }
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.saveBtnText}>TRIGGER EMERGENCY MODE</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>Log Out Account</Text>
      </TouchableOpacity>
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
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  profileAvatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profileAvatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  profileEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "center",
    marginTop: 10,
  },
  badgeGreen: {
    backgroundColor: COLORS.successLight,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.success,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 10,
  },
  subText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 14,
    lineHeight: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 5,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textDark,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  rbiLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  rbiSubText: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 11,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  logoutBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  uploadBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  uploadBtnText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
  },
  cdnUrlCard: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cdnLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  cdnValue: {
    fontSize: 11,
    color: COLORS.textDark,
    fontFamily: "monospace",
  },
});
