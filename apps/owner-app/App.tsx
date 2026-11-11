import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Alert, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { COLORS } from "./src/styles/theme";
import { API_BASE, LOCAL_IP } from "./src/utils/api";
import { TabBar } from "./src/components/TabBar";

// Screens
import { LoginScreen } from "./src/screens/LoginScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { BookingsScreen } from "./src/screens/BookingsScreen";
import { PropertiesScreen } from "./src/screens/PropertiesScreen";
import { BuildingDetailScreen } from "./src/screens/BuildingDetailScreen";
import { MoreScreen } from "./src/screens/MoreScreen";

// PG OS Screens & Components
import { SmartDashboard } from "./src/components/SmartDashboard";
import { ExpenseScreen } from "./src/screens/ExpenseScreen";
import { HousekeepingScreen } from "./src/screens/HousekeepingScreen";
import { StaffScreen } from "./src/screens/StaffScreen";
import { RentHeatmapScreen } from "./src/screens/RentHeatmapScreen";
import { MaintenanceAnalyticsScreen } from "./src/screens/MaintenanceAnalyticsScreen";
import { VacancyPredictionScreen } from "./src/screens/VacancyPredictionScreen";
import { SmartPricingScreen } from "./src/screens/SmartPricingScreen";
import { NoticesScreen } from "./src/screens/NoticesScreen";
import { KPIStatsScreen } from "./src/screens/KPIStatsScreen";
import { RoomInventoryScreen } from "./src/screens/RoomInventoryScreen";
import { VisitorDashboardScreen } from "./src/screens/VisitorDashboardScreen";
import { AIInsightsScreen } from "./src/screens/AIInsightsScreen";
import { ResidentsScreen } from "./src/screens/ResidentsScreen";

// Modals
import { AddFloorModal } from "./src/components/AddFloorModal";
import { AddRoomModal } from "./src/components/AddRoomModal";
import { AddPropertyModal } from "./src/components/AddPropertyModal";
import { RoomAllocationModal } from "./src/components/RoomAllocationModal";

// Premium mock photos for room listings
const ROOM_PHOTOS = [
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=500&q=80"
];

export default function App() {
  const [apiBase, setApiBase] = useState(API_BASE);
  const [token, setToken] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "bookings" | "properties" | "more" | "pgos">("home");

  const [currentPgosApp, setCurrentPgosApp] = useState<string | null>(null);
  const [selectedRoomForInventory, setSelectedRoomForInventory] = useState<any>(null);

  const [selectedBookingForAllocation, setSelectedBookingForAllocation] = useState<any | null>(null);

  const [bookings, setBookings] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pendingKycList, setPendingKycList] = useState<any[]>([]);

  // Selected Building details
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [buildingDetail, setBuildingDetail] = useState<any>(null);

  // Modals visibility states
  const [floorModalVisible, setFloorModalVisible] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState("");

  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [selectedFloorForRoom, setSelectedFloorForRoom] = useState<any>(null);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomType, setNewRoomType] = useState("2-Sharing");
  const [newRoomCapacity, setNewRoomCapacity] = useState("2");
  const [newRoomRent, setNewRoomRent] = useState("8500");
  const [newRoomAc, setNewRoomAc] = useState(false);
  const [newRoomBath, setNewRoomBath] = useState(false);
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [newRoomFacilities, setNewRoomFacilities] = useState<string[]>([]);
  const [newRoomPhotoUrls, setNewRoomPhotoUrls] = useState<string[]>([]);

  const [addPropertyModalVisible, setAddPropertyModalVisible] = useState(false);

  // Auto-discover backend
  useEffect(() => {
    const discover = async () => {
      const hostUri = Constants.expoConfig?.hostUri;
      const host = hostUri ? hostUri.split(":")[0] : LOCAL_IP;
      
      const candidates = [];
      if (host && !host.includes("exp.direct")) {
        candidates.push(`http://${host}:5005`);
      }
      candidates.push(`http://${LOCAL_IP}:5005`);
      
      for (const url of candidates) {
        try {
          const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(1500) });
          const data = await res.json();
          if (data.status === "healthy") {
            setApiBase(url);
            return;
          }
        } catch (_) {}
      }
    };
    discover();
  }, []);

  const handleLoginSuccess = (tokenInput: string, profileInput: any) => {
    if (profileInput?.role !== "pg_owner" && profileInput?.role !== "super_admin") {
      Alert.alert("Access Denied", "Only PG Owners can access this console.");
      return;
    }
    setToken(tokenInput);
    setUserProfile(profileInput);
  };

  const handleLogout = () => {
    setToken("");
    setUserProfile(null);
    setBookings([]);
    setBuildings([]);
    setSelectedBuilding(null);
    setBuildingDetail(null);
    setActiveTab("home");
  };

  const fetchData = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" };
      const [bkRes, blRes, inRes, kycRes] = await Promise.all([
        fetch(apiBase + "/api/bookings/owner-bookings", { headers }),
        fetch(apiBase + "/api/buildings", { headers }),
        fetch(apiBase + "/api/payments/invoices", { headers }),
        fetch(apiBase + "/api/tenants/pending-kyc", { headers }),
      ]);
      const bkData = await bkRes.json();
      const blData = await blRes.json();
      const inData = await inRes.json();
      const kycData = await kycRes.json();
      if (Array.isArray(bkData)) setBookings(bkData);
      if (Array.isArray(blData)) setBuildings(blData);
      if (Array.isArray(inData)) setInvoices(inData);
      if (Array.isArray(kycData)) setPendingKycList(kycData);
    } catch (err) {
      console.error("Fetch data error:", err);
    }
  };

  const handleVerifyKyc = async (docId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`${apiBase}/api/tenants/verify-kyc/${docId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Success", `KYC document has been ${action === "approve" ? "approved" : "rejected"}!`);
        fetchData();
      }
    } catch (_) {
      Alert.alert("Error", "Could not submit KYC verification.");
    }
  };

  const fetchBuildingDetail = async (buildingId: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" };
      const res = await fetch(`${apiBase}/api/buildings/${buildingId}`, { headers });
      const data = await res.json();
      if (data && !data.error) {
        setBuildingDetail(data);
      }
    } catch (err) {
      console.error("Error fetching details:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  useEffect(() => {
    if (selectedBuilding) {
      fetchBuildingDetail(selectedBuilding.id);
    }
  }, [selectedBuilding]);

  const handleBookingAction = async (bookingId: string, status: "Approved" | "Rejected", roomId?: string, bedId?: string) => {
    try {
      const res = await fetch(`${apiBase}/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ status, room_id: roomId, bed_id: bedId })
      });
      const data = await res.json();
      if (data.error) Alert.alert("Error", data.error);
      else fetchData();
    } catch (_) {
      Alert.alert("Error", "Failed to update booking.");
    }
  };

  const handleVerifyInvoice = async (invoiceId: string, status: "Paid" | "Failed") => {
    try {
      const res = await fetch(`${apiBase}/api/payments/verify/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Success", `Rent receipt marked as ${status}!`);
        fetchData();
      }
    } catch (err) {
      Alert.alert("Error", "Could not verify invoice payment.");
    }
  };

  const handleAddFloor = async () => {
    if (!newFloorNumber) {
      Alert.alert("Error", "Please input floor number");
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/buildings/${selectedBuilding.id}/floors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ floor_number: parseInt(newFloorNumber, 10) })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        setNewFloorNumber("");
        setFloorModalVisible(false);
        fetchBuildingDetail(selectedBuilding.id);
        Alert.alert("Success", "Floor added successfully!");
      }
    } catch (_) {
      Alert.alert("Error", "Failed to add floor");
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomNumber || !newRoomCapacity || !newRoomRent) {
      Alert.alert("Error", "Please fill in all room parameters");
      return;
    }

    const typePayload = JSON.stringify({
      type: newRoomType,
      facilities: newRoomFacilities,
      photos: newRoomPhotoUrls,
      description: newRoomDesc
    });

    try {
      const res = await fetch(`${apiBase}/api/buildings/${selectedBuilding.id}/floors/${selectedFloorForRoom.id}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({
          room_number: newRoomNumber,
          room_type: typePayload,
          max_occupancy: parseInt(newRoomCapacity, 10),
          rent: parseFloat(newRoomRent),
          attached_bathroom: newRoomBath, // correct mapping
          ac: newRoomAc
        })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        setNewRoomNumber("");
        setNewRoomDesc("");
        setNewRoomFacilities([]);
        setNewRoomPhotoUrls([]);
        setRoomModalVisible(false);
        fetchBuildingDetail(selectedBuilding.id);
        Alert.alert("Success", "Room created successfully!");
      }
    } catch (_) {
      Alert.alert("Error", "Failed to create room");
    }
  };



  const handleAddProperty = async (payload: any) => {
    try {
      const res = await fetch(`${apiBase}/api/buildings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Failed", data.error);
      } else {
        Alert.alert("Success", "Property registered successfully!");
        fetchData();
      }
    } catch (e) {
      Alert.alert("Connection Error", "Could not submit property registration.");
    }
  };

  const handleUpdateBuildingDescription = async (newDescJson: string) => {
    try {
      const res = await fetch(`${apiBase}/api/buildings/${selectedBuilding.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true",
        },
        body: JSON.stringify({
          ...selectedBuilding,
          description: newDescJson,
        }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Update Failed", data.error);
      } else {
        setSelectedBuilding(data);
        fetchBuildingDetail(data.id);
        fetchData();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to contact database.");
    }
  };

  const toggleFacility = (facility: string) => {
    if (newRoomFacilities.includes(facility)) {
      setNewRoomFacilities(newRoomFacilities.filter((f) => f !== facility));
    } else {
      setNewRoomFacilities([...newRoomFacilities, facility]);
    }
  };

  const handleDeleteRoom = async (floorId: string, roomId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/buildings/${selectedBuilding.id}/floors/${floorId}/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        }
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Delete Failed", data.error);
      } else {
        Alert.alert("Success", "Room deleted successfully!");
        fetchBuildingDetail(selectedBuilding.id);
      }
    } catch (_) {
      Alert.alert("Error", "Could not connect to backend to delete room.");
    }
  };

  // Auth Guard
  if (!token) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
          <LoginScreen apiBase={apiBase} onLoginSuccess={handleLoginSuccess} isLoading={loading} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const name = userProfile?.name ?? userProfile?.full_name ?? "Owner";

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.mainContent}>
          {selectedRoomForInventory ? (
            <RoomInventoryScreen
              apiBase={apiBase}
              token={token}
              roomId={selectedRoomForInventory.id}
              roomNumber={selectedRoomForInventory.room_number}
              buildingId={selectedBuilding.id}
              onClose={() => setSelectedRoomForInventory(null)}
            />
          ) : currentPgosApp ? (
            <View style={{ flex: 1 }}>
              {/* Custom Header Bar for PG OS Sub-Apps */}
              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                <TouchableOpacity
                  onPress={() => setCurrentPgosApp(null)}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: COLORS.primaryLight }}
                >
                  <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: "bold" }}>◀ Home Launcher</Text>
                </TouchableOpacity>
              </View>

              {currentPgosApp === "dashboard" && <SmartDashboard apiBase={apiBase} token={token} />}
              {currentPgosApp === "heatmap" && <RentHeatmapScreen apiBase={apiBase} token={token} />}
              {currentPgosApp === "housekeeping" && (
                <HousekeepingScreen
                  apiBase={apiBase}
                  token={token}
                  buildings={buildings}
                  buildingDetail={buildingDetail}
                  onSelectBuilding={setSelectedBuilding}
                />
              )}
              {currentPgosApp === "staff" && <StaffScreen apiBase={apiBase} token={token} buildings={buildings} />}
              {currentPgosApp === "expenses" && <ExpenseScreen apiBase={apiBase} token={token} buildings={buildings} />}
              {currentPgosApp === "maintenance" && <MaintenanceAnalyticsScreen apiBase={apiBase} token={token} />}
              {currentPgosApp === "prediction" && <VacancyPredictionScreen apiBase={apiBase} token={token} />}
              {currentPgosApp === "pricing" && <SmartPricingScreen apiBase={apiBase} token={token} />}
              {currentPgosApp === "notices" && <NoticesScreen apiBase={apiBase} token={token} buildings={buildings} />}
              {currentPgosApp === "kpi" && <KPIStatsScreen apiBase={apiBase} token={token} />}
              {currentPgosApp === "visitor" && <VisitorDashboardScreen apiBase={apiBase} token={token} />}
              {currentPgosApp === "insights" && <AIInsightsScreen apiBase={apiBase} token={token} />}
              {currentPgosApp === "residents" && <ResidentsScreen apiBase={apiBase} token={token} />}
            </View>
          ) : selectedBuilding ? (
            <BuildingDetailScreen
              building={selectedBuilding}
              detail={buildingDetail}
              apiBase={apiBase}
              token={token}
              onRefresh={() => fetchBuildingDetail(selectedBuilding.id)}
              onBack={() => {
                setSelectedBuilding(null);
                setBuildingDetail(null);
              }}
              onAddFloorOpen={() => setFloorModalVisible(true)}
              onAddRoomOpen={(floor) => {
                setSelectedFloorForRoom(floor);
                setRoomModalVisible(true);
              }}
              onUpdateBuildingDescription={handleUpdateBuildingDescription}
              ROOM_PHOTOS={ROOM_PHOTOS}
              onDeleteRoom={handleDeleteRoom}
              onOpenInventory={(room) => setSelectedRoomForInventory(room)}
            />
          ) : (
            <>
              {activeTab === "home" && (
                <HomeScreen
                  ownerName={name}
                  buildings={buildings}
                  bookings={bookings}
                  invoices={invoices}
                  pendingKycList={pendingKycList}
                  onApproveBooking={(booking) => setSelectedBookingForAllocation(booking)}
                  onRejectBooking={(id) => handleBookingAction(id, "Rejected")}
                  onExploreBookings={() => setActiveTab("bookings")}
                  onVerifyInvoice={handleVerifyInvoice}
                  onVerifyKyc={handleVerifyKyc}
                  onOpenPgosApp={(appKey) => setCurrentPgosApp(appKey)}
                />
              )}

              {activeTab === "properties" && (
                <PropertiesScreen
                  buildings={buildings}
                  onSelectBuilding={(b) => {
                    setSelectedBuilding(b);
                    setBuildingDetail(null);
                  }}
                  onOpenAddModal={() => setAddPropertyModalVisible(true)}
                />
              )}

              {activeTab === "bookings" && (
                <BookingsScreen
                  bookings={bookings}
                  onApproveBooking={(booking) => setSelectedBookingForAllocation(booking)}
                  onRejectBooking={(id) => handleBookingAction(id, "Rejected")}
                />
              )}

              {activeTab === "more" && (
                <MoreScreen
                  userProfile={userProfile}
                  onLogout={handleLogout}
                  apiBase={apiBase}
                  token={token}
                  onUpdateProfile={(newProfile) => setUserProfile(newProfile)}
                />
              )}
            </>
          )}
        </View>

        {/* Reusable Modals */}
        <AddFloorModal
          visible={floorModalVisible}
          onClose={() => setFloorModalVisible(false)}
          onAddFloor={handleAddFloor}
          floorNumber={newFloorNumber}
          setFloorNumber={setNewFloorNumber}
        />

        <AddRoomModal
          visible={roomModalVisible}
          onClose={() => setRoomModalVisible(false)}
          onAddRoom={handleAddRoom}
          roomNumber={newRoomNumber}
          setRoomNumber={setNewRoomNumber}
          roomType={newRoomType}
          setRoomType={setNewRoomType}
          roomCapacity={newRoomCapacity}
          setRoomCapacity={setNewRoomCapacity}
          roomRent={newRoomRent}
          setRoomRent={setNewRoomRent}
          roomAc={newRoomAc}
          setRoomAc={setNewRoomAc}
          roomBath={newRoomBath}
          setRoomBath={setNewRoomBath}
          roomDesc={newRoomDesc}
          setRoomDesc={setNewRoomDesc}
          photoUrls={newRoomPhotoUrls}
          onAddPhotoUrl={(url) => setNewRoomPhotoUrls([...newRoomPhotoUrls, url])}
          onRemovePhotoUrl={(index) => setNewRoomPhotoUrls(newRoomPhotoUrls.filter((_, idx) => idx !== index))}
          selectedFacilities={newRoomFacilities}
          toggleFacility={toggleFacility}
          apiBase={apiBase}
          token={token}
        />

        <AddPropertyModal
          visible={addPropertyModalVisible}
          onClose={() => setAddPropertyModalVisible(false)}
          onAddProperty={handleAddProperty}
          apiBase={apiBase}
          token={token}
        />

        <RoomAllocationModal
          visible={selectedBookingForAllocation !== null}
          booking={selectedBookingForAllocation}
          apiBase={apiBase}
          token={token}
          onClose={() => setSelectedBookingForAllocation(null)}
          onConfirm={handleBookingAction}
        />

        {/* Footer Navigation */}
        {!selectedBuilding && !currentPgosApp && !selectedRoomForInventory && <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />}

        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainContent: {
    flex: 1,
    paddingBottom: 82, // buffer for absolute footer tab
  },
});
