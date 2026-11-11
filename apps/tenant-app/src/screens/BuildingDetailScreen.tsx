import React, { useState } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert, Modal, Linking, Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { COLORS, SHADOWS, TYPOGRAPHY } from "../styles/theme";

interface BuildingDetailScreenProps {
  building: any;
  detail: any;
  onBack: () => void;
  onBookRoom: (room: any, bed?: any) => void;
  ROOM_PHOTOS: string[];
  buildings: any[];
  userProfile?: any;
  roommatePrefs?: any;
}

export const BuildingDetailScreen: React.FC<BuildingDetailScreenProps> = ({
  building,
  detail,
  onBack,
  onBookRoom,
  ROOM_PHOTOS,
  buildings,
  userProfile,
  roommatePrefs,
}) => {
  const [isTourVisible, setIsTourVisible] = useState(false);
  const [tourOffset, setTourOffset] = useState(0);
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [viewingRoomDetail, setViewingRoomDetail] = useState<any | null>(null);

  const parseRoomInfo = (roomTypeStr: string) => {
    try {
      const parsed = JSON.parse(roomTypeStr);
      if (parsed && typeof parsed === "object" && parsed.type) {
        return {
          type: parsed.type || "Standard Room",
          facilities: Array.isArray(parsed.facilities) ? parsed.facilities : [],
          photos: Array.isArray(parsed.photos) ? parsed.photos : [],
          description: parsed.description || "",
        };
      }
    } catch (_) {}
    return {
      type: roomTypeStr || "Standard Room",
      facilities: [],
      photos: [],
      description: "",
    };
  };

  const formatAmenityWithIcon = (facility: string) => {
    const lower = facility.toLowerCase().trim();
    if (lower.includes("wifi") || lower.includes("wi-fi") || lower.includes("internet")) return "📶 Wi-Fi";
    if (lower.includes("bathroom") || lower === "bath" || lower.includes("attached bath")) return "🚿 Attached Bathroom";
    if (lower.includes("air cond") || lower === "ac" || lower.includes("ac room") || lower.split(" ").includes("ac")) return "❄️ AC Room";
    if (lower.includes("geyser") || lower.includes("heater")) return "♨️ Geyser";
    if (lower.includes("tv") || lower.includes("television")) return "📺 Smart TV";
    if (lower.includes("balcony")) return "🌅 Balcony";
    if (lower.includes("cupboard") || lower.includes("wardrobe") || lower.includes("almirah") || lower.includes("wardrob")) return "👗 Wardrobe";
    if (lower.includes("desk") || lower.includes("table") || lower.includes("study")) return "✍️ Study Desk";
    if (lower.includes("cleaning") || lower.includes("housekeeping")) return "🧹 Room Cleaning";
    return `✓ ${facility}`;
  };

  // Parse building description & essentials
  let descriptionText = building.description || "";
  let essentialsList = [
    { name: "Sector 45 Metro Station", type: "🚇 Transit", dist: "0.4 km" },
    { name: "Unitech Cyber Park", type: "💼 Tech Park", dist: "0.8 km" },
    { name: "Fortis Hospital", type: "🏥 Medical", dist: "1.2 km" }
  ];
  try {
    const parsed = JSON.parse(building.description);
    descriptionText = parsed.description || "";
    if (Array.isArray(parsed.essentials) && parsed.essentials.length > 0) {
      essentialsList = parsed.essentials;
    }
  } catch (_) {}

  return (
    <View style={styles.flexContainer}>
      <ScrollView style={styles.scrollArea}>
        {/* 1. Hero Image & Tour trigger */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: ROOM_PHOTOS[buildings.indexOf(building) % ROOM_PHOTOS.length] }}
            style={styles.detailHeroImage as any}
          />
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tourFloatingBtn} onPress={() => setIsTourVisible(true)}>
            <Text style={styles.tourFloatingBtnText}>📸 360° Virtual Tour</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailContent}>
          {/* Title Row */}
          <View style={styles.detailTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailBuildingName}>{building.building_name}</Text>
              <Text style={styles.detailAddress}>📍 {building.address}, {building.city}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ 4.6</Text>
              <Text style={styles.reviewCount}>(120 reviews)</Text>
            </View>
          </View>

          {/* Verification Badge */}
          <View style={styles.verifiedRow}>
            <Text style={styles.verifiedLabel}>🛡️ Verified HomiePG Partner Stay</Text>
          </View>

          {/* Amenities Grid */}
          <Text style={styles.detailSectionTitle}>Property Amenities</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.amenitiesScroll}>
            <View style={styles.amenityChip}><Text style={styles.amenityEmoji}>📶</Text><Text style={styles.amenityText}>WiFi (100 Mbps)</Text></View>
            <View style={styles.amenityChip}><Text style={styles.amenityEmoji}>🍔</Text><Text style={styles.amenityText}>3 Meals Food</Text></View>
            <View style={styles.amenityChip}><Text style={styles.amenityEmoji}>❄️</Text><Text style={styles.amenityText}>AC Rooms</Text></View>
            <View style={styles.amenityChip}><Text style={styles.amenityEmoji}>🧺</Text><Text style={styles.amenityText}>Laundry</Text></View>
            <View style={styles.amenityChip}><Text style={styles.amenityEmoji}>⚡</Text><Text style={styles.amenityText}>Power Backup</Text></View>
          </ScrollView>

          {/* About Description */}
          <Text style={styles.detailSectionTitle}>About This Co-living Hub</Text>
          <Text style={styles.aboutDescription}>
            {descriptionText || "A premium, safe, and comfortable PG accommodation designed for students and working professionals. Fully managed stay with top-class services and high security."}
          </Text>

          {/* Nearby Essentials */}
          <Text style={styles.detailSectionTitle}>Nearby Essentials</Text>
          <View style={styles.essentialsContainer}>
            {essentialsList.map((item, idx) => (
              <View key={idx} style={styles.essentialRow}>
                <Text style={styles.essentialName}>{item.type} {item.name}</Text>
                <Text style={styles.essentialDist}>{item.dist}</Text>
              </View>
            ))}
          </View>

          {/* Location Map Widget */}
          <Text style={styles.detailSectionTitle}>Property Location</Text>
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFillObject}
              initialRegion={{
                latitude: building.latitude || 28.4572,
                longitude: building.longitude || 77.0640,
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
              }}
            >
              {building.latitude && building.longitude && (
                <Marker
                  coordinate={{
                    latitude: building.latitude,
                    longitude: building.longitude,
                  }}
                  title={building.building_name}
                  description={building.address}
                />
              )}
            </MapView>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => {
                const url = (building.latitude && building.longitude)
                  ? `https://www.google.com/maps/search/?api=1&query=${building.latitude},${building.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${building.address}, ${building.city}`)}`;
                Linking.openURL(url);
              }}
            >
              <Text style={styles.mapBtnText}>🗺️ Open in Google Maps</Text>
            </TouchableOpacity>
          </View>

          {/* Room Listings with Live Bed Occupancy Maps */}
          <Text style={styles.detailSectionTitle}>Select Your Bed</Text>

          {/* Access Restriction Check */}
          {(() => {
            const userGender = userProfile?.gender || "Male";
            const bgType = (building.gender_type || "Co-Living").toLowerCase();
            const isFemalePG = bgType === "women" || bgType.includes("female") || bgType === "girls";
            const isMalePG = bgType === "men" || bgType.includes("male") || bgType === "boys";
            const isBuildingDenied = (isFemalePG && userGender === "Male") || (isMalePG && userGender === "Female");
            const buildingDeniedMessage = isFemalePG
              ? "This PG is exclusively for female residents."
              : "This PG is exclusively for male residents.";

            if (isBuildingDenied) {
              return (
                <View style={styles.deniedCard}>
                  <Text style={styles.deniedIcon}>🔒</Text>
                  <Text style={styles.deniedTitle}>Access Restricted</Text>
                  <Text style={styles.deniedSubtitle}>{buildingDeniedMessage}</Text>
                </View>
              );
            }

            return (
              <>
                {detail ? (
                  detail.rooms.length > 0 ? (
                    detail.rooms.map((room: any) => {
                      const roomInfo = parseRoomInfo(room.room_type);
                      const roomBeds = detail.beds.filter((b: any) => b.room_id === room.id);
                      const availableBeds = roomBeds.filter((b: any) => b.status === "Available").length;
                      const totalBeds = roomBeds.length;
                      const occupancyPct = totalBeds > 0 ? (totalBeds - availableBeds) / totalBeds : 0;

                      const isAlmostFull = availableBeds === 1;
                      const isFull = availableBeds === 0;

                      const roomGenderLock = room.gender_lock;
                      const isRoomLocked = roomGenderLock && roomGenderLock !== userGender;

                      // Unified Room Amenities (combining tags + custom db variables)
                      const roomAmenities: string[] = [...roomInfo.facilities];
                      if (room.attached_bathroom && !roomAmenities.some(a => a.toLowerCase().includes("bathroom"))) {
                        roomAmenities.unshift("Attached Bathroom");
                      }
                      if (room.ac && !roomAmenities.some(a => a.toLowerCase().includes("ac") || a.toLowerCase().includes("conditioner"))) {
                        roomAmenities.unshift("AC Room");
                      }

                      const roomImage = roomInfo.photos?.[0] || "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=300&q=80";

                      return (
                        <View key={room.id} style={styles.roomCard}>
                          <Image source={{ uri: roomImage }} style={styles.roomThumbnail as any} />
                          <View style={styles.roomDetailsContainer}>
                            <View style={styles.roomHeaderRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.roomType}>Room {room.room_number}</Text>
                                <Text style={styles.roomSharingText}>{roomInfo.type}</Text>
                              </View>
                              <View style={{ alignItems: "flex-end" }}>
                                <Text style={styles.roomPrice}>₹{room.rent.toLocaleString("en-IN")}<Text style={{ fontSize: 9, fontWeight: "normal", color: COLORS.textMuted }}>/mo</Text></Text>
                              </View>
                            </View>

                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 4 }}>
                              <Text style={styles.roomVacancyText}>{availableBeds} of {totalBeds} spaces vacant</Text>
                              {isFull ? (
                                <Text style={[styles.vacancyBadgeText, { color: COLORS.danger, backgroundColor: "rgba(239,68,68,0.08)" }]}>🔴 Full</Text>
                              ) : isAlmostFull ? (
                                <Text style={[styles.vacancyBadgeText, { color: "#d97706", backgroundColor: "rgba(245,158,11,0.08)" }]}>⚠️ 1 Left</Text>
                              ) : (
                                <Text style={[styles.vacancyBadgeText, { color: "#059669", backgroundColor: "rgba(16,185,129,0.08)" }]}>🟢 Vacant</Text>
                              )}
                            </View>

                            {/* Occupancy bar */}
                            <View style={styles.occupancyBarBg}>
                              <View style={[styles.occupancyBarFill, {
                                width: `${Math.round(occupancyPct * 100)}%` as any,
                                backgroundColor: isFull ? COLORS.border : isAlmostFull ? "#f59e0b" : "#10b981"
                              }]} />
                            </View>

                            {/* Amenities Chips list */}
                            {roomAmenities.length > 0 && (
                              <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap", marginVertical: 6 }}>
                                {roomAmenities.slice(0, 2).map((f: string, idx: number) => (
                                  <View key={idx} style={styles.amenityBadge}>
                                    <Text style={styles.amenityBadgeText}>{formatAmenityWithIcon(f)}</Text>
                                  </View>
                                ))}
                                {roomAmenities.length > 2 && (
                                  <View style={styles.amenityBadge}>
                                    <Text style={styles.amenityBadgeText}>+{roomAmenities.length - 2} more</Text>
                                  </View>
                                )}
                              </View>
                            )}

                            {/* Choose Button */}
                            <TouchableOpacity
                              style={[
                                styles.viewRoomBtn,
                                isRoomLocked && { backgroundColor: COLORS.border }
                              ]}
                              onPress={() => {
                                if (isRoomLocked) {
                                  Alert.alert("Locked Room", "This room is reserved for " + roomGenderLock + " residents.");
                                } else {
                                  setViewingRoomDetail(room);
                                  setSelectedBed(null);
                                }
                              }}
                            >
                              <Text style={styles.viewRoomBtnText}>
                                {isRoomLocked ? "🔒 Locked (" + roomGenderLock + " only)" : "👁️ Select Room & Bed ➔"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyText}>No active rooms listed in this property.</Text>
                  )
                ) : (
                  <Text style={styles.emptyText}>Loading room inventory...</Text>
                )}
              </>
            );
          })()}

          {/* Room Details Modal Screen */}
          <Modal
            visible={viewingRoomDetail !== null}
            animationType="slide"
            onRequestClose={() => {
              setViewingRoomDetail(null);
              setSelectedBed(null);
            }}
          >
            {viewingRoomDetail && (() => {
              const room = viewingRoomDetail;
              const roomInfo = parseRoomInfo(room.room_type);
              const roomBeds = detail.beds.filter((b: any) => b.room_id === room.id);
              const availableBeds = roomBeds.filter((b: any) => b.status === "Available").length;
              const totalBeds = roomBeds.length;
              const userGender = userProfile?.gender || "Male";
              const roomGenderLock = room.gender_lock;

              const occupiedBeds = roomBeds.filter((b: any) => b.status !== "Available");
              const hasRoommates = occupiedBeds.length > 0;
              let roommateMatchPct = 65;
              if (roommatePrefs) {
                const roomHash = (room.room_number || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                const sleepVal = roommatePrefs.sleep === "Night Owl" ? 10 : 6;
                const foodVal = roommatePrefs.food === "Veg" ? 12 : roommatePrefs.food === "Non-Veg" ? 8 : 10;
                const cleanVal = roommatePrefs.clean === "Very Clean" ? 14 : 10;
                const offset = (roomHash % 30);
                roommateMatchPct = 55 + ((sleepVal + foodVal + cleanVal) / 4) + offset;
                if (roommateMatchPct > 99) roommateMatchPct = 99;
                roommateMatchPct = Math.round(roommateMatchPct);
              }

              // Unified Room Amenities inside Modal too
              const roomAmenities: string[] = [...roomInfo.facilities];
              if (room.attached_bathroom && !roomAmenities.some(a => a.toLowerCase().includes("bathroom"))) {
                roomAmenities.unshift("Attached Bathroom");
              }
              if (room.ac && !roomAmenities.some(a => a.toLowerCase().includes("ac") || a.toLowerCase().includes("conditioner"))) {
                roomAmenities.unshift("AC Room");
              }

              return (
                <View style={{ flex: 1, backgroundColor: COLORS.background, paddingTop: Platform.OS === "ios" ? 50 : 20 }}>
                  <View style={styles.premiumModalHeader}>
                    <View>
                      <Text style={styles.premiumModalTitle}>Room Selection Screen</Text>
                      <Text style={styles.premiumModalSubtitle}>Room #{room.room_number} · {roomInfo.type}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.premiumCloseBtn}
                      onPress={() => {
                        setViewingRoomDetail(null);
                        setSelectedBed(null);
                      }}
                    >
                      <Text style={styles.premiumCloseBtnText}>✕ Close</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                    <Image
                      source={{ uri: roomInfo.photos?.[0] || "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=500&q=80" }}
                      style={styles.premiumRoomImage as any}
                    />

                    <View style={styles.badgeRow}>
                      {hasRoommates && (
                        <View style={styles.compatibilityBadge}>
                          <Text style={styles.compatibilityText}>✨ {roommateMatchPct}% Roommate Match</Text>
                        </View>
                      )}
                      {roomGenderLock && (
                        <View style={[
                          styles.genderLockBadge, 
                          { 
                            backgroundColor: roomGenderLock === "Female" ? "rgba(219,39,119,0.08)" : "rgba(37,99,235,0.08)", 
                            borderColor: roomGenderLock === "Female" ? "rgba(219,39,119,0.2)" : "rgba(37,99,235,0.2)",
                            borderWidth: 1,
                            borderRadius: 12,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                          }
                        ]}>
                          <Text style={{ color: roomGenderLock === "Female" ? "#db2777" : "#2563eb", fontSize: 10, fontWeight: "800" }}>
                            {roomGenderLock === "Female" ? "👩 Girls Only" : "👨 Boys Only"}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.premiumDesc}>
                      {roomInfo.description || "A clean and premium co-living room space fully managed with high-quality furnishings, private lockers, and attached bathrooms."}
                    </Text>

                    {/* Facilities */}
                    {roomAmenities.length > 0 && (
                      <View style={{ marginTop: 18 }}>
                        <Text style={styles.subHeaderLabel}>Included Room Amenities</Text>
                        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                          {roomAmenities.map((fac: string, idx: number) => (
                            <View key={idx} style={styles.premiumAmenityBadge}>
                              <Text style={styles.premiumAmenityText}>{formatAmenityWithIcon(fac)}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 20 }} />

                    {/* Live Bed Map */}
                    <Text style={styles.bedSectionTitle}>Select Available Bed Space:</Text>
                    <Text style={styles.bedSectionSubtitle}>Rent listed is per bed space. Tap a space below to reserve.</Text>

                    <View style={styles.bedGrid}>
                      {roomBeds.map((bed: any) => {
                        const isAvail = bed.status === "Available";
                        const isReserved = bed.status === "Reserved";
                        const isSelected = selectedBed?.id === bed.id;

                        let bedBg = "#f3f4f6";
                        let bedBorder = COLORS.border;
                        let bedTextCol = COLORS.textMuted;
                        let statusEmoji = "🔒";
                        let statusLabel = "Occupied";

                        if (isAvail) {
                          if (isSelected) {
                            bedBg = COLORS.primaryLight;
                            bedBorder = COLORS.primary;
                            bedTextCol = COLORS.primary;
                            statusEmoji = "🛌";
                            statusLabel = "Selected";
                          } else {
                            bedBg = "rgba(16,185,129,0.08)";
                            bedBorder = "rgba(16,185,129,0.4)";
                            bedTextCol = "#059669";
                            statusEmoji = "🛌";
                            statusLabel = "Available";
                          }
                        } else if (isReserved) {
                          bedBg = "rgba(245,158,11,0.08)";
                          bedBorder = "rgba(245,158,11,0.4)";
                          bedTextCol = "#d97706";
                          statusEmoji = "⏳";
                          statusLabel = "Reserved";
                        }

                        return (
                          <TouchableOpacity
                            key={bed.id}
                            style={[
                              styles.bedTile,
                              { backgroundColor: bedBg, borderColor: bedBorder },
                              isSelected && { borderWidth: 2, transform: [{ scale: 1.03 }] }
                            ]}
                            activeOpacity={isAvail ? 0.7 : 1}
                            onPress={() => {
                              if (isAvail) {
                                if (isSelected) {
                                  setSelectedBed(null);
                                } else {
                                  setSelectedBed(bed);
                                }
                              } else {
                                Alert.alert("Occupied", "This space is currently occupied.");
                              }
                            }}
                          >
                            <Text style={styles.bedTileEmoji}>{statusEmoji}</Text>
                            <Text style={[styles.bedTileNumber, { color: bedTextCol }]}>Space {bed.bed_number}</Text>
                            <Text style={[styles.bedTileStatus, { color: bedTextCol }]}>{statusLabel}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Book Action Button */}
                    {selectedBed && (
                      <TouchableOpacity
                        style={[styles.confirmSelectionBtn, { marginTop: 24 }]}
                        onPress={() => {
                          setViewingRoomDetail(null);
                          onBookRoom(room, selectedBed);
                        }}
                      >
                        <Text style={styles.confirmSelectionBtnText}>⚡ Book Bed Space {selectedBed.bed_number} (₹{room.rent}/mo)</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              );
            })()}
          </Modal>
        </View>
      </ScrollView>


      {/* 360 Virtual Tour Modal */}
      <Modal
        visible={isTourVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTourVisible(false)}
      >
        <View style={styles.tourModalOverlay}>
          <View style={styles.tourCard}>
            <Text style={styles.tourTitle}>360° Virtual Tour Preview</Text>
            <Text style={styles.tourSubtitle}>Swipe left/right to look around the room</Text>

            {/* Simulated 360 Panorama View */}
            <View style={styles.panoramaContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => setTourOffset(e.nativeEvent.contentOffset.x)}
                scrollEventThrottle={16}
              >
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80" }}
                  style={styles.panoramaImage as any}
                />
              </ScrollView>
              <View style={styles.compassOverlay}>
                <Text style={styles.compassText}>🧭 Angle: {Math.round(tourOffset / 3)}°</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeTourBtn} onPress={() => setIsTourVisible(false)}>
              <Text style={styles.closeTourText}>Exit Virtual Tour</Text>
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
  heroContainer: {
    position: "relative",
    height: 220,
  },
  detailHeroImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tourFloatingBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.accent,
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...SHADOWS.medium,
  },
  tourFloatingBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  detailContent: {
    padding: 20,
    paddingBottom: 40,
  },
  detailTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailBuildingName: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textDark,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  detailAddress: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  ratingBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.warning,
  },
  reviewCount: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  verifiedRow: {
    backgroundColor: COLORS.accentLight,
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 10,
    ...SHADOWS.small,
  },
  verifiedLabel: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: "bold",
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textDark,
    marginTop: 26,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  amenitiesScroll: {
    flexDirection: "row",
    paddingBottom: 4,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    ...SHADOWS.small,
  },
  amenityEmoji: {
    marginRight: 6,
    fontSize: 14,
  },
  amenityText: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: "600",
  },
  aboutDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    ...SHADOWS.small,
  },
  essentialsContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  essentialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  essentialName: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  essentialDist: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.accent,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roomCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  roomType: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  roomNumber: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 2,
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.accent,
  },
  availableBadge: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  roomHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  urgencyBadge: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#dc2626",
  },
  occupancyBarBg: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginVertical: 10,
    overflow: "hidden",
  },
  occupancyBarFill: {
    height: 4,
    borderRadius: 2,
  },
  bedLegendRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  deniedCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
    marginTop: 10,
  },
  deniedIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  deniedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  deniedSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  genderLockBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  genderLockBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  roomLockBanner: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roomLockText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  confirmSelectionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
    ...SHADOWS.medium,
  },
  confirmSelectionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  bedMapTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 10,
    marginTop: 10,
    letterSpacing: 0.2,
  },
  bedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  bedTile: {
    width: "31%",
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardBg,
    ...SHADOWS.small,
  },
  bedTileEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  bedTileNumber: {
    fontSize: 11,
    fontWeight: "bold",
  },
  bedTileStatus: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
  },
  bedBookNowBadge: {
    marginTop: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  bedBookNowText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },

  tourModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    padding: 20,
  },
  tourCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  tourSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  panoramaContainer: {
    width: "100%",
    height: 200,
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  panoramaImage: {
    width: 600,
    height: 200,
  },
  compassOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  compassText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  closeTourBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  closeTourText: {
    color: "#fff",
    fontWeight: "bold",
  },
  mapContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    height: 180,
    position: "relative",
    overflow: "hidden",
    marginBottom: 20,
    ...SHADOWS.small,
  },
  mapImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    opacity: 0.85,
  },
  mapMarkerOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -16,
    marginTop: -28,
  },
  mapMarker: {
    fontSize: 32,
  },
  mapBtn: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...SHADOWS.medium,
  },
  mapBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  viewRoomBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
  },
  viewRoomBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  roomThumbnail: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  roomDetailsContainer: {
    flex: 1,
  },
  roomSharingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  roomVacancyText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  vacancyBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  amenityBadge: {
    backgroundColor: COLORS.primaryLight + "40",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  amenityBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "700",
  },
  premiumModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  premiumModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  premiumModalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  premiumCloseBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  premiumCloseBtnText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 12.5,
  },
  premiumRoomImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  compatibilityBadge: {
    backgroundColor: "rgba(99,102,241,0.08)",
    borderColor: "rgba(99,102,241,0.2)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  compatibilityText: {
    color: "#6366f1",
    fontSize: 10,
    fontWeight: "800",
  },
  premiumDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 12,
    lineHeight: 19,
  },
  subHeaderLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  premiumAmenityBadge: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  premiumAmenityText: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: "600",
  },
  bedSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 3,
  },
  bedSectionSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
});
