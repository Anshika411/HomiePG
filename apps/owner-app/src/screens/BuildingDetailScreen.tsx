import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert, Linking, TextInput, Modal } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { COLORS, SHADOWS } from "../styles/theme";

interface BuildingDetailScreenProps {
  building: any;
  detail: any;
  apiBase: string;
  token: string;
  onRefresh: () => void;
  onBack: () => void;
  onAddFloorOpen: () => void;
  onAddRoomOpen: (floor: any) => void;
  onUpdateBuildingDescription: (newDescJson: string) => Promise<void>;
  ROOM_PHOTOS: string[];
  onDeleteRoom: (floorId: string, roomId: string) => Promise<void>;
  onOpenInventory: (room: any) => void;
}

const ESSENTIAL_TYPES = [
  { label: "Transit", emoji: "🚇" },
  { label: "Tech Park", emoji: "💼" },
  { label: "College", emoji: "🎓" },
  { label: "Medical", emoji: "🏥" },
  { label: "Food", emoji: "🍔" },
  { label: "Grocery", emoji: "🛒" },
];

export const BuildingDetailScreen: React.FC<BuildingDetailScreenProps> = ({
  building,
  detail,
  apiBase,
  token,
  onRefresh,
  onBack,
  onAddFloorOpen,
  onAddRoomOpen,
  onUpdateBuildingDescription,
  ROOM_PHOTOS,
  onDeleteRoom,
  onOpenInventory,
}) => {
  // Parse building description & essentials
  let initialDescText = building.description || "";
  let initialEssentials: any[] = [];
  try {
    const parsed = JSON.parse(building.description);
    initialDescText = parsed.description || "";
    initialEssentials = Array.isArray(parsed.essentials) ? parsed.essentials : [];
  } catch (_) {}

  const [descText, setDescText] = useState(initialDescText);
  const [essentials, setEssentials] = useState<any[]>(initialEssentials);

  // Add Essential mini-form state
  const [showAddEssential, setShowAddEssential] = useState(false);
  const [selectedType, setSelectedType] = useState(ESSENTIAL_TYPES[0]);
  const [essentialName, setEssentialName] = useState("");
  const [essentialDist, setEssentialDist] = useState("");
  const [isSavingDesc, setIsSavingDesc] = useState(false);

  // Room search & accordion state
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  // Amenities states & handlers
  const [systemAmenities, setSystemAmenities] = useState<any[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [savingAmenities, setSavingAmenities] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any | null>(null);

  const fetchSystemAmenities = async () => {
    try {
      const res = await fetch(`${apiBase}/api/buildings/amenities`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setSystemAmenities(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    fetchSystemAmenities();
  }, []);

  const openManageAmenities = () => {
    const currentIds = (detail?.building?.amenities || []).map((a: any) => a.id);
    setSelectedAmenityIds(currentIds);
    setShowAmenitiesModal(true);
  };

  const handleSaveAmenities = async () => {
    setSavingAmenities(true);
    try {
      const res = await fetch(`${apiBase}/api/buildings/${building.id}/amenities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({ amenity_ids: selectedAmenityIds })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Success", "Amenities updated successfully!");
        setShowAmenitiesModal(false);
        onRefresh();
      }
    } catch {
      Alert.alert("Error", "Failed to update amenities");
    } finally {
      setSavingAmenities(false);
    }
  };

  const handleSaveEssentials = async (updatedList: any[]) => {
    setIsSavingDesc(true);
    try {
      const payload = JSON.stringify({
        description: descText,
        essentials: updatedList,
      });
      await onUpdateBuildingDescription(payload);
      setEssentials(updatedList);
    } catch (e) {
      Alert.alert("Save Error", "Could not update essentials.");
    } finally {
      setIsSavingDesc(false);
    }
  };

  const handleAddEssential = () => {
    if (!essentialName.trim() || !essentialDist.trim()) {
      Alert.alert("Error", "Please input name and distance.");
      return;
    }
    const newItem = {
      name: essentialName,
      type: `${selectedType.emoji} ${selectedType.label}`,
      dist: essentialDist.includes("km") ? essentialDist : `${essentialDist} km`,
    };
    const newList = [...essentials, newItem];
    handleSaveEssentials(newList);

    // Reset form
    setEssentialName("");
    setEssentialDist("");
    setShowAddEssential(false);
  };

  const handleDeleteEssential = (index: number) => {
    const newList = essentials.filter((_, idx) => idx !== index);
    handleSaveEssentials(newList);
  };

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

  if (!detail) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading property layout...</Text>
      </View>
    );
  }

  const { floors, rooms, beds } = detail;

  // Filter floors to show only if they contain matches or if search is empty
  const sortedFloors = [...floors].sort((a: any, b: any) => a.floor_number - b.floor_number);

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Back Link */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>← Back to Properties</Text>
      </TouchableOpacity>

      <Text style={styles.detailTitle}>{building.building_name}</Text>
      <Text style={styles.detailAddr}>{building.address}, {building.city}</Text>

      <View style={styles.genderRow}>
        <View style={styles.genderTag}>
          <Text style={styles.genderTagText}>👫 {building.gender_type}</Text>
        </View>
        <Text style={styles.detailRentLabel}>Starting ₹{building.monthly_rent_starting}/mo</Text>
      </View>

      {/* 1. Interactive Map Widget */}
      <Text style={styles.layoutSectionTitle}>Property Location</Text>
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

      {/* 2. Essentials Configuration Widget */}
      <View style={styles.sectionDivider}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.layoutSectionTitle}>Nearby Essentials</Text>
          <TouchableOpacity style={styles.addEssentialLink} onPress={() => setShowAddEssential(true)}>
            <Text style={styles.addEssentialLinkText}>+ Add Essential</Text>
          </TouchableOpacity>
        </View>

        {showAddEssential && (
          <View style={styles.essentialFormCard}>
            <Text style={styles.formTitle}>Add Essential Hub</Text>
            <Text style={styles.formLabel}>Type</Text>
            <View style={styles.chipRow}>
              {ESSENTIAL_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.label}
                  style={[styles.typeChip, selectedType.label === t.label && styles.typeChipActive]}
                  onPress={() => setSelectedType(t)}
                >
                  <Text style={[styles.typeChipText, selectedType.label === t.label && styles.typeChipTextActive]}>
                    {t.emoji} {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Hub / Location Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Huda Metro Station"
              value={essentialName}
              onChangeText={setEssentialName}
            />

            <Text style={styles.formLabel}>Distance (e.g. 0.5 km)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 0.4 km"
              value={essentialDist}
              onChangeText={setEssentialDist}
            />

            <View style={styles.formBtnRow}>
              <TouchableOpacity style={styles.formCancelBtn} onPress={() => setShowAddEssential(false)}>
                <Text style={styles.formCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formAddBtn} onPress={handleAddEssential}>
                <Text style={styles.formAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {essentials.length === 0 ? (
          <Text style={styles.subEmptyText}>No nearby essentials added yet.</Text>
        ) : (
          <View style={styles.essentialsList}>
            {essentials.map((item, index) => (
              <View key={index} style={styles.essentialRow}>
                <Text style={styles.essentialNameText}>
                  {item.type} {item.name} ({item.dist})
                </Text>
                <TouchableOpacity onPress={() => handleDeleteEssential(index)}>
                  <Text style={styles.deleteBtn}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Amenities Section */}
      <View style={styles.sectionDivider}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.layoutSectionTitle}>Building Amenities</Text>
          <TouchableOpacity style={styles.addEssentialLink} onPress={openManageAmenities}>
            <Text style={styles.addEssentialLinkText}>⚙ Configure</Text>
          </TouchableOpacity>
        </View>

        {(!detail?.building?.amenities || detail.building.amenities.length === 0) ? (
          <Text style={styles.subEmptyText}>No amenities configured for this property.</Text>
        ) : (
          <View style={styles.facilitiesRow}>
            {detail.building.amenities.map((a: any) => {
              const nameLower = a.name.toLowerCase();
              let emoji = "⭐";
              if (nameLower.includes("wifi") || nameLower.includes("internet")) emoji = "📶";
              else if (nameLower.includes("power") || nameLower.includes("backup")) emoji = "⚡";
              else if (nameLower.includes("lift") || nameLower.includes("elevator")) emoji = "🛗";
              else if (nameLower.includes("food") || nameLower.includes("mess") || nameLower.includes("meal")) emoji = "🍽️";
              else if (nameLower.includes("water") || nameLower.includes("ro")) emoji = "💧";
              else if (nameLower.includes("ac") || nameLower.includes("condition")) emoji = "❄️";
              else if (nameLower.includes("park")) emoji = "🚗";

              return (
                <View key={a.id} style={styles.facilityBadge}>
                  <Text style={styles.facilityBadgeText}>{emoji} {a.name}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* 3. Floors layout */}
      <View style={[styles.layoutSection, { marginTop: 20 }]}>
        <View style={styles.directoryHeaderRow}>
          <Text style={styles.layoutSectionTitle}>Floors & Rooms Directory</Text>
        </View>

        {/* Search bar inside directory */}
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search Room Number (e.g. 101, 202)..."
          placeholderTextColor={COLORS.textMuted}
          value={roomSearchQuery}
          onChangeText={(text) => {
            setRoomSearchQuery(text);
            setExpandedRoomId(null); // Collapse all on search typing to keep clean
          }}
        />

        {sortedFloors.length === 0 ? (
          <Text style={styles.emptyText}>No floors registered for this building.</Text>
        ) : (
          sortedFloors.map((fl: any) => {
            // Filter rooms by floor and search query
            const floorRooms = rooms
              .filter((r: any) => r.floor_id === fl.id)
              .filter((r: any) => r.room_number.toString().toLowerCase().includes(roomSearchQuery.toLowerCase()));

            if (floorRooms.length === 0 && roomSearchQuery.trim() !== "") {
              return null; // Hide floor if no rooms match search
            }

            return (
              <View key={fl.id} style={styles.floorBlock}>
                <View style={styles.floorBlockHeader}>
                  <Text style={styles.floorBlockTitle}>Floor {fl.floor_number}</Text>
                  <TouchableOpacity
                    style={styles.addRoomTextBtn}
                    onPress={() => onAddRoomOpen(fl)}
                  >
                    <Text style={styles.addRoomTextBtnLabel}>+ Add Room</Text>
                  </TouchableOpacity>
                </View>

                {floorRooms.length === 0 ? (
                  <Text style={styles.subEmptyText}>No rooms on this floor</Text>
                ) : (
                  floorRooms.map((r: any) => {
                    const roomBeds = beds.filter((bd: any) => bd.room_id === r.id);
                    const roomInfo = parseRoomInfo(r.room_type);
                    const availableBedsCount = roomBeds.filter((bd: any) => bd.status === "Available").length;
                    const isExpanded = expandedRoomId === r.id;

                    return (
                      <View key={r.id} style={styles.roomContainer}>
                        {/* Compact Accordion Header */}
                        <TouchableOpacity
                          style={[styles.roomRowHeader, isExpanded && styles.roomRowHeaderActive]}
                          onPress={() => setExpandedRoomId(isExpanded ? null : r.id)}
                        >
                          <View style={styles.roomHeaderLeft}>
                            <Text style={styles.roomRowNumber}>Room {r.room_number}</Text>
                            <Text style={styles.roomRowTag} numberOfLines={1}>
                              {roomInfo.type} · {availableBedsCount}/{r.capacity} Available
                            </Text>
                          </View>
                          <View style={styles.roomHeaderRight}>
                            <Text style={styles.roomRowRent}>₹{r.rent}</Text>
                            <Text style={styles.chevronIcon}>{isExpanded ? "▲" : "▼"}</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Collapsible Details Body */}
                        {isExpanded && (
                          <View style={styles.roomBody}>
                            {/* Room photos */}
                            {roomInfo.photos.length > 0 ? (
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomPhotosScroll}>
                                {roomInfo.photos.map((photo: string, index: number) => (
                                  <Image key={index} source={{ uri: photo }} style={styles.roomPhotoThumbnail} />
                                ))}
                              </ScrollView>
                            ) : (
                              <View style={styles.noPhotoThumbnail}>
                                <Text style={styles.noPhotoThumbnailText}>📸 No Room Photos Uploaded</Text>
                              </View>
                            )}

                            {/* Description */}
                            {roomInfo.description ? (
                              <Text style={styles.roomDescText}>{roomInfo.description}</Text>
                            ) : null}

                            {/* Amenities */}
                            <View style={styles.facilitiesRow}>
                              {r.ac && <View style={styles.facilityBadge}><Text style={styles.facilityBadgeText}>❄️ AC</Text></View>}
                              {r.attached_bathroom && <View style={styles.facilityBadge}><Text style={styles.facilityBadgeText}>🚿 Bath</Text></View>}
                              {roomInfo.facilities.map((fac: string, idx: number) => (
                                <View key={idx} style={styles.facilityBadge}>
                                  <Text style={styles.facilityBadgeText}>⭐ {fac}</Text>
                                </View>
                              ))}
                            </View>

                            {/* Room Actions Row */}
                            <View style={{ flexDirection: "row", gap: 10, marginVertical: 8, paddingHorizontal: 4 }}>
                              <TouchableOpacity
                                style={[styles.deleteRoomBtn, { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight, flex: 1, paddingVertical: 8, alignItems: "center" }]}
                                onPress={() => onOpenInventory(r)}
                              >
                                <Text style={[styles.deleteRoomBtnText, { color: COLORS.primary, fontSize: 11 }]}>📋 Manage Room Inventory</Text>
                              </TouchableOpacity>
                            </View>

                             {/* Beds layout */}
                             <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, marginTop: 4 }}>
                               <Text style={[styles.bedsTitleLabel, { marginBottom: 0 }]}>Beds Setup</Text>
                               <TouchableOpacity
                                 style={styles.deleteRoomBtn}
                                 onPress={() => {
                                   Alert.alert(
                                     "Delete Room",
                                     `Are you sure you want to permanently delete Room ${r.room_number} and all its beds?`,
                                     [
                                       { text: "Cancel", style: "cancel" },
                                       { text: "Delete Room", style: "destructive", onPress: () => onDeleteRoom(fl.id, r.id) }
                                     ]
                                   );
                                 }}
                               >
                                 <Text style={styles.deleteRoomBtnText}>✕ Delete Room</Text>
                               </TouchableOpacity>
                             </View>
                            <View style={styles.bedsGrid}>
                              {roomBeds.map((bd: any) => {
                                const isOccupied = bd.status === "Occupied" && bd.tenant;
                                return (
                                  <TouchableOpacity
                                    key={bd.id}
                                    style={[
                                      styles.bedBubble,
                                      bd.status === "Available" ? styles.bedBubbleAvail : styles.bedBubbleOcc,
                                    ]}
                                    onPress={() => {
                                      if (isOccupied) {
                                        setSelectedResident({
                                          ...bd.tenant,
                                          room_number: r.room_number,
                                          bed_number: bd.bed_number
                                        });
                                      }
                                    }}
                                    activeOpacity={isOccupied ? 0.7 : 1}
                                  >
                                    <Text style={styles.bedBubbleIcon}>🛏️</Text>
                                    <Text style={styles.bedBubbleText}>Bed {bd.bed_number}</Text>
                                    <Text style={styles.bedBubbleStatusText}>{bd.status}</Text>
                                    {isOccupied && (
                                      <Text style={styles.bedBubbleResidentText} numberOfLines={1}>
                                        👤 {bd.tenant.name}
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            );
          })
        )}
      </View>

      <TouchableOpacity style={styles.addFloorBtn} onPress={onAddFloorOpen}>
        <Text style={styles.addFloorBtnText}>+ Add Floor</Text>
      </TouchableOpacity>
    </ScrollView>

    {/* Configure Amenities Modal */}
    <Modal visible={showAmenitiesModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Manage Building Amenities</Text>
          <Text style={styles.modalSub}>Select facilities provided at this PG building</Text>

          <ScrollView contentContainerStyle={styles.checklistScroll} showsVerticalScrollIndicator={false}>
            {systemAmenities.map(amenity => {
              const isSelected = selectedAmenityIds.includes(amenity.id);
              const nameLower = amenity.name.toLowerCase();
              let emoji = "⭐";
              if (nameLower.includes("wifi") || nameLower.includes("internet")) emoji = "📶";
              else if (nameLower.includes("power") || nameLower.includes("backup")) emoji = "⚡";
              else if (nameLower.includes("lift") || nameLower.includes("elevator")) emoji = "🛗";
              else if (nameLower.includes("food") || nameLower.includes("mess") || nameLower.includes("meal")) emoji = "🍽️";
              else if (nameLower.includes("water") || nameLower.includes("ro")) emoji = "💧";
              else if (nameLower.includes("ac") || nameLower.includes("condition")) emoji = "❄️";
              else if (nameLower.includes("park")) emoji = "🚗";

              return (
                <TouchableOpacity
                  key={amenity.id}
                  style={[styles.checkItem, isSelected && styles.checkItemActive]}
                  onPress={() => {
                    if (isSelected) {
                      setSelectedAmenityIds(selectedAmenityIds.filter(id => id !== amenity.id));
                    } else {
                      setSelectedAmenityIds([...selectedAmenityIds, amenity.id]);
                    }
                  }}
                >
                  <Text style={styles.checkItemEmoji}>{emoji}</Text>
                  <Text style={[styles.checkItemLabel, isSelected && styles.checkItemLabelActive]}>{amenity.name}</Text>
                  <Text style={styles.checkItemState}>{isSelected ? "✅ Selected" : "➕ Add"}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAmenitiesModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAmenities} disabled={savingAmenities}>
              <Text style={styles.saveBtnText}>{savingAmenities ? "Saving..." : "Save Selection"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    {/* Resident Details Modal */}
    <Modal visible={!!selectedResident} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Resident Assignment Profile</Text>
          <Text style={styles.modalSub}>Bed occupied details at {building?.building_name || "PG Property"}</Text>

          {selectedResident && (
            <ScrollView contentContainerStyle={styles.checklistScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.residentCardField}>
                <Text style={styles.residentCardLabel}>Resident Name</Text>
                <Text style={styles.residentCardVal}>{selectedResident.name}</Text>
              </View>
              <View style={styles.residentCardField}>
                <Text style={styles.residentCardLabel}>Room / Bed</Text>
                <Text style={styles.residentCardVal}>Room {selectedResident.room_number} (Bed {selectedResident.bed_number})</Text>
              </View>
              <View style={styles.residentCardField}>
                <Text style={styles.residentCardLabel}>Check-In Date</Text>
                <Text style={styles.residentCardVal}>
                  {selectedResident.joining_date ? new Date(selectedResident.joining_date).toLocaleDateString() : "—"}
                </Text>
              </View>
              <View style={styles.residentCardField}>
                <Text style={styles.residentCardLabel}>Contact Number</Text>
                <Text style={styles.residentCardVal}>{selectedResident.mobile || "Not Linked"}</Text>
              </View>
              <View style={styles.residentCardField}>
                <Text style={styles.residentCardLabel}>Email Address</Text>
                <Text style={styles.residentCardVal}>{selectedResident.email || "Not Provided"}</Text>
              </View>
              <View style={styles.residentCardField}>
                <Text style={styles.residentCardLabel}>Monthly Rent Base</Text>
                <Text style={styles.residentCardVal}>₹{(selectedResident.monthly_rent || 0).toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.residentCardField}>
                <Text style={styles.residentCardLabel}>Security Deposit</Text>
                <Text style={styles.residentCardVal}>₹{(selectedResident.deposit || 0).toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.residentCardField}>
                <Text style={styles.residentCardLabel}>Latest Billing Period</Text>
                <Text style={styles.residentCardVal}>{selectedResident.latest_rent_month || "None Generated"}</Text>
              </View>
              <View style={styles.residentCardField}>
                <Text style={styles.residentCardLabel}>Rent Payment Status</Text>
                <Text style={[
                  styles.residentCardVal, 
                  { 
                    color: selectedResident.latest_rent_status === "Paid" 
                      ? COLORS.success 
                      : selectedResident.latest_rent_status === "Pending" 
                        ? COLORS.warning 
                        : COLORS.danger 
                  }
                ]}>
                  {selectedResident.latest_rent_status ? selectedResident.latest_rent_status.toUpperCase() : "—"}
                </Text>
              </View>
              <View style={[styles.residentCardField, { borderBottomWidth: 0 }]}>
                <Text style={styles.residentCardLabel}>Outstanding Invoices</Text>
                <Text style={[styles.residentCardVal, { color: selectedResident.outstanding_invoices > 0 ? COLORS.danger : COLORS.success }]}>
                  {selectedResident.outstanding_invoices || "0"} Unpaid
                </Text>
              </View>
            </ScrollView>
          )}

          <View style={styles.modalBtns}>
            {selectedResident && selectedResident.mobile ? (
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: COLORS.success, backgroundColor: COLORS.successLight + "20", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }]}
                onPress={() => {
                  const url = `tel:${selectedResident.mobile}`;
                  Linking.openURL(url).catch(() => Alert.alert("Error", "Could not launch phone dialer."));
                }}
              >
                <Text style={[styles.cancelBtnText, { color: COLORS.success }]}>📞 Call Resident</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.primary }]} onPress={() => setSelectedResident(null)}>
              <Text style={styles.saveBtnText}>Close Window</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  backBtn: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  detailAddr: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  genderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 20,
  },
  genderTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  genderTagText: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  detailRentLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.accent,
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
  sectionDivider: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addEssentialLink: {
    paddingVertical: 4,
  },
  addEssentialLinkText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.accent,
  },
  essentialFormCard: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textDark,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.cardBg,
  },
  typeChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  typeChipText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  typeChipTextActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  formBtnRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  formCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formCancelBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "bold",
  },
  formAddBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  formAddBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  essentialsList: {
    marginTop: 10,
  },
  essentialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  essentialNameText: {
    fontSize: 12,
    color: COLORS.textDark,
  },
  deleteBtn: {
    fontSize: 12,
  },
  layoutSection: {
    marginBottom: 20,
  },
  layoutSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    padding: 16,
    textAlign: "center",
  },
  subEmptyText: {
    fontSize: 11,
    color: COLORS.textMuted,
    padding: 12,
    textAlign: "center",
  },
  floorBlock: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  floorBlockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
    marginBottom: 12,
  },
  floorBlockTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  addRoomTextBtn: {
    paddingVertical: 4,
  },
  addRoomTextBtnLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  roomContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  roomRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  roomRowHeaderActive: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.primaryLight,
  },
  roomHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  roomRowNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  roomRowTag: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roomHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roomRowRent: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.accent,
  },
  chevronIcon: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "bold",
    width: 16,
    textAlign: "center",
  },
  roomBody: {
    padding: 14,
  },
  roomPhotosScroll: {
    marginBottom: 12,
  },
  roomPhotoThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 6,
    marginRight: 8,
  },
  noPhotoThumbnail: {
    height: 40,
    backgroundColor: COLORS.cardBg,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  noPhotoThumbnailText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  roomDescText: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  facilitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  facilityBadge: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  facilityBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  bedsTitleLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  bedsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bedBubble: {
    minWidth: 72,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  bedBubbleAvail: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  bedBubbleOcc: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.border,
  },
  bedBubbleIcon: {
    fontSize: 16,
  },
  bedBubbleText: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginTop: 2,
  },
  bedBubbleStatusText: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addBedBubble: {
    minWidth: 72,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.textMuted,
    backgroundColor: COLORS.cardBg,
    justifyContent: "center",
    alignItems: "center",
  },
  addBedBubbleText: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.textMuted,
  },
  addFloorBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 40,
    ...SHADOWS.small,
  },
  addFloorBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  directoryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textDark,
    backgroundColor: COLORS.cardBg,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  deleteRoomBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.danger + "15",
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteRoomBtnText: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  checklistScroll: {
    paddingVertical: 10,
    gap: 8,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  checkItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + "15",
  },
  checkItemEmoji: {
    fontSize: 20,
  },
  checkItemLabel: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: "600",
    flex: 1,
  },
  checkItemLabelActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  checkItemState: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textMuted,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontWeight: "700",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
  bedBubbleResidentText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 2,
    textAlign: "center",
  },
  residentCardField: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  residentCardLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  residentCardVal: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: "700",
  },
});
