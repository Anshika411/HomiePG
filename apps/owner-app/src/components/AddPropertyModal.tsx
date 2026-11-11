import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Image, Platform, ActivityIndicator } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { COLORS } from "../styles/theme";

interface AddPropertyModalProps {
  visible: boolean;
  onClose: () => void;
  onAddProperty: (payload: {
    building_name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gender_type: "Men" | "Women" | "Co-Living";
    description: string;
    security_deposit: number;
    monthly_rent_starting: number;
    latitude?: number;
    longitude?: number;
    photo?: string;
    amenity_ids?: string[];
  }) => Promise<void>;
  apiBase: string;
  token: string;
}
const fetchWithTimeout = async (url: string, options: any = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};


const getAmenityEmoji = (name: string): string => {
  const map: Record<string, string> = {
    "wifi": "📶",
    "laundry": "🧺",
    "power backup": "⚡",
    "food": "🍲",
    "parking": "🅿️",
    "lift": "🛗",
    "cctv": "📹",
    "ro water": "💧",
  };
  return map[name.toLowerCase()] || "✨";
};

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  visible,
  onClose,
  onAddProperty,
  apiBase,
  token
}) => {
  const [buildingName, setBuildingName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Gurgaon");
  const [state, setState] = useState("Haryana");
  const [pincode, setPincode] = useState("");
  const [genderType, setGenderType] = useState<"Men" | "Women" | "Co-Living">("Co-Living");
  const [deposit, setDeposit] = useState("5000");
  const [rent, setRent] = useState("8500");
  const [desc, setDesc] = useState("");
  const [lat, setLat] = useState("28.4572");
  const [lng, setLng] = useState("77.0640");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [systemAmenities, setSystemAmenities] = useState<any[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const mapRef = useRef<any>(null);
  const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Animates the native map camera cleanly to specified coordinates
  const animateMapTo = (latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    }, 1000);
  };

  // Center the map when modal becomes visible
  useEffect(() => {
    if (visible && lat && lng) {
      setTimeout(() => {
        animateMapTo(parseFloat(lat) || 28.4572, parseFloat(lng) || 77.0640);
      }, 500);
    }
  }, [visible]);



  const reverseGeocode = async (latitude: number, longitude: number) => {
    if (GOOGLE_KEY) {
      try {
        const res = await fetchWithTimeout(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_KEY}`,
          {},
          8000
        );
        const data = await res.json();
        if (data.status === "OK" && data.results?.length > 0) {
          const result = data.results[0];
          const components = result.address_components || [];
          const get = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || "";
          const streetNumber = get("street_number");
          const route = get("route");
          const sublocality = get("sublocality_level_1") || get("sublocality") || get("neighborhood");
          const postal = get("postal_code");
          const stateName = get("administrative_area_level_1");
          const cityName = get("locality") || get("administrative_area_level_2");

          const streetAddr = [streetNumber, route].filter(Boolean).join(" ") || sublocality || result.formatted_address.split(",")[0];
          setAddress(streetAddr);
          if (postal) setPincode(postal);
          if (stateName) setState(stateName);
          return;
        }
      } catch (_) {}
    }
  };





  const handleMapSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Search", "Please type a city, area, or landmark to search.");
      return;
    }

    setIsSearching(true);
    if (GOOGLE_KEY) {
      try {
        const q = encodeURIComponent(`${searchQuery}, India`);
        const res = await fetchWithTimeout(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${GOOGLE_KEY}`,
          {},
          8000
        );
        const data = await res.json();

        if (data.status === "OK" && data.results?.length > 0) {
          const result = data.results[0];
          const loc = result.geometry.location;
          const searchLat = loc.lat as number;
          const searchLng = loc.lng as number;

          const components = result.address_components || [];
          const get = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || "";
          const sublocality = get("sublocality_level_1") || get("sublocality") || get("neighborhood") || get("route");
          const postal    = get("postal_code");
          const stateName = get("administrative_area_level_1");
          const cityName  = get("locality") || get("administrative_area_level_2");
          const streetAddr = sublocality || result.formatted_address.split(",")[0];

          animateMapTo(searchLat, searchLng);
          setLat(searchLat.toFixed(6));
          setLng(searchLng.toFixed(6));
          setAddress(streetAddr);
          if (postal)    setPincode(postal);
          if (stateName) setState(stateName);
          if (cityName) setCity(cityName);
          setIsSearching(false);
          return;
        }


        if (data.status === "ZERO_RESULTS") {
          Alert.alert("Not Found", `No results for "${searchQuery}". Try a more specific name.`);
          setIsSearching(false);
          return;
        }
      } catch (err: any) {
        Alert.alert("Search Error", "Could not reach Google Maps. Check your internet connection.");
      }
    }
    setIsSearching(false);
  };

  const handleLocateMe = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permissions are required to locate your device.");
        return;
      }

      setIsSearching(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (location && location.coords) {
        const { latitude, longitude } = location.coords;
        animateMapTo(latitude, longitude);
        setLat(latitude.toFixed(6));
        setLng(longitude.toFixed(6));
        await reverseGeocode(latitude, longitude);
      }

    } catch (err: any) {
      Alert.alert("Location Error", "Could not fetch current location: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePincodeSearch = async (code: string) => {
    if (!GOOGLE_KEY || code.trim().length !== 6) return;
    setIsSearching(true);
    try {
      const q = encodeURIComponent(`${code.trim()}, India`);
      const res = await fetchWithTimeout(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${GOOGLE_KEY}`,
        {},
        8000
      );
      const data = await res.json();
      if (data.status === "OK" && data.results?.length > 0) {
        const result = data.results[0];
        const loc = result.geometry.location;
        const components = result.address_components || [];
        const get = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || "";
        const sublocality = get("sublocality_level_1") || get("sublocality") || get("neighborhood") || get("route");
        const stateName = get("administrative_area_level_1");
        const cityName  = get("locality") || get("administrative_area_level_2");
        const streetAddr = sublocality || result.formatted_address.split(",")[0];

        animateMapTo(loc.lat, loc.lng);
        setLat((loc.lat as number).toFixed(6));
        setLng((loc.lng as number).toFixed(6));
        setAddress(streetAddr);
        if (stateName) setState(stateName);
        if (cityName)  setCity(cityName);
      }

    } catch (_) {}
    setIsSearching(false);
  };

  useEffect(() => {
    if (visible && token) {
      const fetchAmenities = async () => {
        try {
          const res = await fetch(`${apiBase}/api/buildings/amenities`, {
            headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
          });
          const data = await res.json();
          if (Array.isArray(data)) {
            setSystemAmenities(data);
          }
        } catch (_) {}
      };
      fetchAmenities();
    }
  }, [visible, token, apiBase]);

  const toggleAmenity = (id: string) => {
    if (selectedAmenities.includes(id)) {
      setSelectedAmenities(selectedAmenities.filter(aId => aId !== id));
    } else {
      setSelectedAmenities([...selectedAmenities, id]);
    }
  };

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
      "Property Photo",
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
        Alert.alert("Permission Required", "Camera permission is required to snap a property photo.");
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
        Alert.alert("Permission Required", "Gallery permission is required to select a property photo.");
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
      Alert.alert("Error", "Could not open gallery.");
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
        setPhotoUrl(data.publicUrl);
        Alert.alert("Success", "Property photo uploaded successfully!");
      } else {
        Alert.alert("Error", "Could not complete upload.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not connect to the upload server.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!buildingName.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      Alert.alert("Required Fields", "Please enter property name, address, city, and pincode.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        building_name: buildingName,
        address,
        city: city.trim() || "Unknown",
        state,
        pincode,
        gender_type: genderType,
        description: desc,
        security_deposit: parseFloat(deposit) || 0,
        monthly_rent_starting: parseFloat(rent) || 0,
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lng ? parseFloat(lng) : undefined,
        photo: photoUrl || undefined,
        amenity_ids: selectedAmenities
      };

      await onAddProperty(payload);
      
      setBuildingName("");
      setAddress("");
      setCity("Gurgaon");
      setState("Haryana");
      setPincode("");
      setGenderType("Co-Living");
      setDeposit("5000");
      setRent("8500");
      setDesc("");
      setLat("");
      setLng("");
      setPhotoUrl("");
      setSelectedAmenities([]);
      onClose();
    } catch (e) {
      Alert.alert("Submission Failed", "Could not create property.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Add New Property</Text>
              <Text style={styles.modalSubtitle}>Register a new building to list floors & rooms</Text>
            </View>
            <TouchableOpacity style={styles.closeHeaderBtn} onPress={onClose}>
              <Text style={styles.closeHeaderBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Section 1: General details */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>🏢 General Information</Text>
              
              <Text style={styles.label}>Property / Building Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Homie Stays Premier"
                value={buildingName}
                onChangeText={setBuildingName}
              />

              <Text style={styles.label}>Property Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g. Premium co-living space with modern amenities, luxury rooms, and close to IT hubs."
                value={desc}
                onChangeText={setDesc}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Section 2: Accommodation Details */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>💰 Accommodation & Rules</Text>

              <Text style={styles.label}>Gender Accommodation Type</Text>
              <View style={styles.chipRow}>
                {[
                  { label: "Boys Only", value: "Men" as const, icon: "👦" },
                  { label: "Girls Only", value: "Women" as const, icon: "👧" },
                  { label: "Co-Living", value: "Co-Living" as const, icon: "👫" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.genderChip, genderType === item.value && styles.genderChipActive]}
                    onPress={() => setGenderType(item.value)}
                  >
                    <Text style={[styles.genderChipText, genderType === item.value && styles.genderChipTextActive]}>
                      {item.icon} {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.flexItem}>
                  <Text style={styles.label}>Starting Rent (₹/mo)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="8500"
                    value={rent}
                    onChangeText={setRent}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.flexItem}>
                  <Text style={styles.label}>Security Deposit (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5000"
                    value={deposit}
                    onChangeText={setDeposit}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            {/* Section 3: Location Details */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>📍 Location & Coordinates</Text>

              <Text style={styles.label}>Search Location / Landmark</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search landmark (e.g. Salt Lake Sector 5)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleMapSearch}
                />
                <TouchableOpacity 
                  style={styles.searchBtn} 
                  onPress={handleMapSearch}
                  disabled={isSearching}
                >
                  <Text style={styles.searchBtnText}>{isSearching ? "..." : "🔍"}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.locateBtn} 
                  onPress={handleLocateMe}
                  disabled={isSearching}
                >
                  <Text style={styles.locateBtnText}>📍</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Interactive Location Map</Text>
              <View style={styles.mapPickerContainer}>
                <View style={styles.mapPickerTapArea}>
                  <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={StyleSheet.absoluteFillObject}
                    initialRegion={{
                      latitude: parseFloat(lat) || 28.4572,
                      longitude: parseFloat(lng) || 77.0640,
                      latitudeDelta: 0.008,
                      longitudeDelta: 0.008,
                    }}
                    onRegionChangeComplete={(r) => {
                      setLat(r.latitude.toFixed(6));
                      setLng(r.longitude.toFixed(6));
                      reverseGeocode(r.latitude, r.longitude);
                    }}
                  />
                  {/* Fixed Center Target Pin */}
                  <View style={styles.centerMarkerContainer} pointerEvents="none">
                    <Text style={{ fontSize: 32, marginBottom: 20 }}>📍</Text>
                  </View>
                  {isSearching && (
                    <View style={styles.mapLoadingOverlay}>
                      <ActivityIndicator color={COLORS.primary} size="small" />
                      <Text style={styles.mapLoadingText}>Fetching details…</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.mapPickerHint}>
                  💡 Move the map or tap to drop pin at exact entry gate
                </Text>
                <View style={styles.coordinatesTextRow}>
                  <View style={styles.coordinateBadge}>
                    <Text style={styles.coordinateLabel}>Latitude: <Text style={styles.coordinateValue}>{lat || "-"}</Text></Text>
                  </View>
                  <View style={styles.coordinateBadge}>
                    <Text style={styles.coordinateLabel}>Longitude: <Text style={styles.coordinateValue}>{lng || "-"}</Text></Text>
                  </View>
                </View>
              </View>

              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Building No, Street/Road"
                value={address}
                onChangeText={setAddress}
              />

              <View style={styles.row}>
                <View style={styles.flexItem}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Gurgaon"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={styles.flexItem}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. West Bengal"
                    value={state}
                    onChangeText={setState}
                  />
                </View>
              </View>

              <Text style={styles.label}>Pincode</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="6-digit postal code (e.g. 700091)"
                  value={pincode}
                  onChangeText={setPincode}
                  onEndEditing={(e) => handlePincodeSearch(e.nativeEvent.text)}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="search"
                />
                <TouchableOpacity 
                  style={styles.searchBtn} 
                  onPress={() => handlePincodeSearch(pincode)}
                  disabled={isSearching}
                >
                  <Text style={styles.searchBtnText}>{isSearching ? "..." : "🔍"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 4: Amenities */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>📶 Property Facilities</Text>
              {systemAmenities.length > 0 ? (
                <View style={styles.chipRow}>
                  {systemAmenities.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity.id);
                    return (
                      <TouchableOpacity
                        key={amenity.id}
                        style={[styles.facilityChip, isSelected && styles.facilityChipActive]}
                        onPress={() => toggleAmenity(amenity.id)}
                      >
                        <Text style={[styles.facilityChipText, isSelected && styles.facilityChipTextActive]}>
                          {getAmenityEmoji(amenity.name)} {amenity.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: 10 }} />
              )}
            </View>

            {/* Section 5: Media Upload */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>📸 Cover Photo</Text>
              <TouchableOpacity 
                style={[styles.uploadContainer, photoUrl ? styles.uploadContainerActive : null]} 
                onPress={handleUploadPhoto}
                disabled={isUploading}
              >
                {isUploading ? (
                  <View style={styles.uploadInner}>
                    <ActivityIndicator color={COLORS.primary} size="small" />
                    <Text style={styles.uploadText}>Uploading to secure bucket...</Text>
                  </View>
                ) : photoUrl ? (
                  <View style={styles.previewImageWrapper}>
                    <Image source={{ uri: photoUrl }} style={styles.premiumCoverPreview} />
                    <View style={styles.replaceBadge}>
                      <Text style={styles.replaceBadgeText}>🔄 Replace Photo</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadInner}>
                    <Text style={{ fontSize: 32, marginBottom: 4 }}>📤</Text>
                    <Text style={styles.uploadTitle}>Upload Cover Image</Text>
                    <Text style={styles.uploadSubtitle}>High-res photo attracts 3x more bookings</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmit} disabled={isSubmitting}>
              <Text style={styles.confirmText}>{isSubmitting ? "Creating..." : "Save Property"}</Text>
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
    backgroundColor: COLORS.primaryLight + "30", // ultra soft tint
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flexItem: {
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  genderChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.cardBg,
  },
  genderChipActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight + "40",
  },
  genderChipText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  genderChipTextActive: {
    color: COLORS.accent,
    fontWeight: "800",
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
  facilityChipText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  facilityChipTextActive: {
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
  uploadContainer: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.textMuted + "50",
    backgroundColor: COLORS.primaryLight + "20",
    borderRadius: 14,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  uploadContainerActive: {
    borderStyle: "solid",
    borderColor: COLORS.border,
    height: 180,
  },
  uploadInner: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  uploadSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  uploadText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  previewImageWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  premiumCoverPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  replaceBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  replaceBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
  },
  mapPickerContainer: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 8,
    marginBottom: 15,
  },
  mapPickerTapArea: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  mapPickerImage: {
    width: "100%",
    height: "100%",
  },
  mapPickerMarker: {
    position: "absolute",
    zIndex: 10,
  },
  mapPickerHint: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  coordinatesTextRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  coordinateBadge: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  coordinateLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "700",
  },
  coordinateValue: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
    backgroundColor: COLORS.cardBg,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  locateBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  locateBtnText: {
    fontSize: 16,
  },
  mapLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.75)",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    zIndex: 20,
  },
  mapLoadingText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
  },
  centerMarkerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
