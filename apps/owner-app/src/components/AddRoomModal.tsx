import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, ScrollView, Switch, Image, Alert, Platform, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { COLORS, SHADOWS } from "../styles/theme";

interface AddRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onAddRoom: () => void;
  roomNumber: string;
  setRoomNumber: (val: string) => void;
  roomType: string;
  setRoomType: (val: string) => void;
  roomCapacity: string;
  setRoomCapacity: (val: string) => void;
  roomRent: string;
  setRoomRent: (val: string) => void;
  roomAc: boolean;
  setRoomAc: (val: boolean) => void;
  roomBath: boolean;
  setRoomBath: (val: boolean) => void;
  roomDesc: string;
  setRoomDesc: (val: string) => void;
  photoUrls: string[];
  onAddPhotoUrl: (url: string) => void;
  onRemovePhotoUrl: (index: number) => void;
  selectedFacilities: string[];
  toggleFacility: (facility: string) => void;
  apiBase: string;
  token: string;
}

const ALL_FACILITIES = [
  "Wi-Fi", "Geyser", "Smart TV", "Attached Balcony", 
  "Wardrobe", "Study Desk", "Room Cleaning"
];

const getFacilityEmoji = (facility: string): string => {
  const map: Record<string, string> = {
    "wi-fi": "📶",
    "geyser": "🔥",
    "smart tv": "📺",
    "attached balcony": "🌅",
    "wardrobe": "🚪",
    "study desk": "✍️",
    "single bed": "🛏️",
    "room cleaning": "🧹",
  };
  return map[facility.toLowerCase()] || "✨";
};

export const AddRoomModal: React.FC<AddRoomModalProps> = ({
  visible,
  onClose,
  onAddRoom,
  roomNumber,
  setRoomNumber,
  roomType,
  setRoomType,
  roomCapacity,
  setRoomCapacity,
  roomRent,
  setRoomRent,
  roomAc,
  setRoomAc,
  roomBath,
  setRoomBath,
  roomDesc,
  setRoomDesc,
  photoUrls,
  onAddPhotoUrl,
  onRemovePhotoUrl,
  selectedFacilities,
  toggleFacility,
  apiBase,
  token
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadPhoto = async () => {
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

    Alert.alert(
      "Room Photo",
      "Select photo source:",
      [
        {
          text: "📸 Camera",
          onPress: handleLaunchCamera
        },
        {
          text: "🖼️ Gallery",
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
        Alert.alert("Permission Required", "Camera permission is required to capture a room photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
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
        Alert.alert("Permission Required", "Gallery permission is required to select a room photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
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
    setIsUploading(true);
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
        onAddPhotoUrl(data.publicUrl);
        Alert.alert("Uploaded Successfully", "Room image uploaded.");
      } else {
        Alert.alert("Error", "Could not complete upload.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not connect to the upload server.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Create New Room</Text>
              <Text style={styles.modalSubtitle}>Configure room specs and assign layouts</Text>
            </View>
            <TouchableOpacity style={styles.closeHeaderBtn} onPress={onClose}>
              <Text style={styles.closeHeaderBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Section 1: Basic specifications */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>🛏️ Basic Details</Text>

              <Text style={styles.label}>Room Number / Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 101, 204"
                value={roomNumber}
                onChangeText={setRoomNumber}
              />

              <Text style={styles.label}>Monthly Rent (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 8500"
                value={roomRent}
                onChangeText={setRoomRent}
                keyboardType="number-pad"
              />
            </View>

            {/* Section 2: Features & Description */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>🏷️ Features & Description</Text>

              <Text style={styles.label}>Room Sharing Type</Text>
              <View style={styles.sharingTypeRow}>
                {[
                  { label: "Single", icon: "👤", capacity: "1" },
                  { label: "Double", icon: "👥", capacity: "2" },
                  { label: "Triple", icon: "👥+", capacity: "3" },
                  { label: "Quad", icon: "🏘️", capacity: "4" },
                  { label: "Dormitory", icon: "🛏️", capacity: "6" },
                ].map((opt) => {
                  const isSelected = roomType.includes(opt.label);
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={[styles.sharingPill, isSelected && styles.sharingPillActive]}
                      onPress={() => {
                        setRoomType(opt.label + " Sharing");
                        setRoomCapacity(opt.capacity);
                      }}
                    >
                      <Text style={[styles.sharingPillText, isSelected && styles.sharingPillTextActive]}>
                        {opt.icon} {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Dormitory: variable bed count input */}
              {roomType.includes("Dormitory") && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={styles.label}>Number of Beds</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 6, 8, 10"
                    value={roomCapacity}
                    onChangeText={setRoomCapacity}
                    keyboardType="number-pad"
                  />
                </View>
              )}

              <Text style={styles.label}>Bed Arrangement</Text>
              <View style={styles.sharingTypeRow}>
                {[
                  { label: "Single Bed", icon: "🛏️" },
                  { label: "Bunk Bed", icon: "🪜" },
                ].map((opt) => {
                  const currentDesc = roomDesc.toLowerCase();
                  const isSelected = currentDesc.includes(opt.label.toLowerCase());
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={[styles.sharingPill, isSelected && styles.sharingPillActive, { flex: 1 }]}
                      onPress={() => setRoomDesc(opt.label)}
                    >
                      <Text style={[styles.sharingPillText, isSelected && styles.sharingPillTextActive]}>
                        {opt.icon} {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.softSwitchContainer}>
                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.switchTitle}>❄️ Air Conditioned (AC)</Text>
                    <Text style={styles.switchSubtitle}>Higher rent value</Text>
                  </View>
                  <Switch 
                    value={roomAc} 
                    onValueChange={setRoomAc} 
                    trackColor={{ false: COLORS.border, true: COLORS.accent }}
                  />
                </View>

                <View style={[styles.switchRow, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, marginTop: 10 }]}>
                  <View>
                    <Text style={styles.switchTitle}>🚿 Attached Bathroom</Text>
                    <Text style={styles.switchSubtitle}>Attached washroom facility</Text>
                  </View>
                  <Switch 
                    value={roomBath} 
                    onValueChange={setRoomBath} 
                    trackColor={{ false: COLORS.border, true: COLORS.accent }}
                  />
                </View>
              </View>
            </View>

            {/* Section 3: Room Amenities */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>📶 Room Amenities</Text>
              <View style={styles.facilitiesContainer}>
                {ALL_FACILITIES.map((facility) => {
                  const isActive = selectedFacilities.includes(facility);
                  return (
                    <TouchableOpacity
                      key={facility}
                      style={[styles.facilityChip, isActive && styles.facilityChipActive]}
                      onPress={() => toggleFacility(facility)}
                    >
                      <Text style={[styles.facilityText, isActive && styles.facilityTextActive]}>
                        {getFacilityEmoji(facility)} {facility}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 4: Media Upload */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>📸 Room Photos</Text>
              
              <TouchableOpacity 
                style={styles.uploadZone} 
                onPress={handleUploadPhoto} 
                disabled={isUploading}
              >
                {isUploading ? (
                  <View style={styles.uploadInner}>
                    <ActivityIndicator color={COLORS.primary} size="small" />
                    <Text style={styles.uploadZoneSubtitle}>Uploading to secure storage...</Text>
                  </View>
                ) : (
                  <View style={styles.uploadInner}>
                    <Text style={{ fontSize: 28, marginBottom: 4 }}>📤</Text>
                    <Text style={styles.uploadZoneTitle}>Upload Room Photo</Text>
                    <Text style={styles.uploadZoneSubtitle}>JPEG or PNG up to 5MB</Text>
                  </View>
                )}
              </TouchableOpacity>

              {photoUrls.length > 0 && (
                <View style={styles.thumbnailContainer}>
                  <Text style={styles.selectedCountText}>{photoUrls.length} photo(s) uploaded:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.uploadedThumbScroll}>
                    {photoUrls.map((url, idx) => (
                      <View key={idx} style={styles.thumbWrapper}>
                        <Image source={{ uri: url }} style={styles.uploadedThumb} />
                        <TouchableOpacity style={styles.deleteBadge} onPress={() => onRemovePhotoUrl(idx)}>
                          <Text style={styles.deleteBadgeText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onAddRoom}>
              <Text style={styles.confirmText}>Create Room</Text>
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
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    height: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeHeaderBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
  },
  closeHeaderBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textMuted,
  },
  scrollArea: {
    flex: 1,
    marginBottom: 16,
  },
  sectionContainer: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 14,
    backgroundColor: COLORS.primaryLight + "30",
  },
  textArea: {
    height: 60,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flexItem: {
    flex: 1,
  },
  sharingTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  sharingPill: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
  },
  sharingPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  sharingPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  sharingPillTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  softSwitchContainer: {
    backgroundColor: COLORS.primaryLight + "30",
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  switchSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  facilitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  facilityChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: COLORS.cardBg,
  },
  facilityChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  facilityText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  facilityTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    color: COLORS.textMuted,
    fontWeight: "800",
    fontSize: 14,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  uploadZone: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.textMuted + "50",
    backgroundColor: COLORS.primaryLight + "20",
    borderRadius: 14,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadZoneTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  uploadZoneSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  thumbnailContainer: {
    marginTop: 14,
    backgroundColor: COLORS.primaryLight + "20",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedCountText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  uploadedThumbScroll: {
    flexDirection: "row",
  },
  thumbWrapper: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 10,
    position: "relative",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  uploadedThumb: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  deleteBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: COLORS.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },
});

