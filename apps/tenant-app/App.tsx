import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { COLORS, SHADOWS } from "./src/styles/theme";
import { API_BASE } from "./src/utils/api";
import Constants from "expo-constants";
import { Header } from "./src/components/Header";
import { TabBar } from "./src/components/TabBar";
import { BookingModal } from "./src/components/BookingModal";

import { LoginScreen } from "./src/screens/LoginScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { BuildingDetailScreen } from "./src/screens/BuildingDetailScreen";
import { BookingsScreen } from "./src/screens/BookingsScreen";
import { ManageScreen } from "./src/screens/ManageScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ComplaintsScreen } from "./src/screens/ComplaintsScreen";

// Premium mock photos for room listings
const ROOM_PHOTOS = [
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80"
];

export default function App() {
  const [apiBase, setApiBase] = useState("");
  const [token, setToken] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);

  // Auto-discover backend
  useEffect(() => {
    const discover = async () => {
      const hostUri = Constants.expoConfig?.hostUri;
      const host = hostUri ? hostUri.split(":")[0] : "192.168.88.5";
      
      const candidates = [];
      if (host && !host.includes("exp.direct")) {
        candidates.push(`http://${host}:5005`);
      }
      candidates.push("http://192.168.88.5:5005");
      
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
      setApiBase(API_BASE); // Fallback to tunnel/configured URL
    };
    discover();
  }, []);
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("home"); // 'home', 'search', 'booking', 'manage', 'profile'
  const [searchCity, setSearchCity] = useState("Gurgaon");
  const [buildings, setBuildings] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [myInvoices, setMyInvoices] = useState<any[]>([]);

  // Selection & Booking states
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [selectedBuildingDetail, setSelectedBuildingDetail] = useState<any>(null);
  const [bookingRoom, setBookingRoom] = useState<any>(null);
  const [selectedBookingBed, setSelectedBookingBed] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [activeStay, setActiveStay] = useState<any>(null);
  const [visitorPasses, setVisitorPasses] = useState<any[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [roommates, setRoommates] = useState<any[]>([]);
  const [roommatePrefs, setRoommatePrefs] = useState<any>({
    sleep: "Night Owl",
    food: "Veg",
    clean: "Moderate"
  });
  const [rewardPoints, setRewardPoints] = useState<number>(750);

  // Active filters
  const [genderFilter, setGenderFilter] = useState<string | null>(null);
  const [wifiFilter, setWifiFilter] = useState(false);
  const [foodFilter, setFoodFilter] = useState(false);

  const handleLoginSuccess = (tokenInput: string, profileInput: any) => {
    setToken(tokenInput);
    setUserProfile(profileInput);
  };

  const handleLogout = () => {
    setToken("");
    setUserProfile(null);
    setMyBookings([]);
    setMyInvoices([]);
    setActiveTab("home");
  };

  const fetchTenantData = async (authToken = token) => {
    try {
      const headers = { Authorization: `Bearer ${authToken}`, "bypass-tunnel-reminder": "true" };

      // Fetch my bookings
      const bRes = await fetch(apiBase + "/api/bookings/my-bookings", { headers });
      const bData = await bRes.json();
      if (Array.isArray(bData)) setMyBookings(bData);

      // Fetch my invoices
      const iRes = await fetch(apiBase + "/api/payments/invoices", { headers });
      const iData = await iRes.json();
      if (Array.isArray(iData)) setMyInvoices(iData);

      // Fetch active stay
      const sRes = await fetch(apiBase + "/api/tenants/my-stay", { headers });
      const sData = await sRes.json();
      setActiveStay(sData);

      // Fetch visitor passes
      const vRes = await fetch(apiBase + "/api/visitors/my-passes", { headers });
      const vData = await vRes.json();
      if (Array.isArray(vData)) setVisitorPasses(vData);

      // Fetch maintenance tickets
      const mRes = await fetch(apiBase + "/api/maintenance/my-tickets", { headers });
      const mData = await mRes.json();
      if (Array.isArray(mData)) setMaintenanceTickets(mData);

      // Fetch notices
      const nRes = await fetch(apiBase + "/api/notices/tenant", { headers });
      const nData = await nRes.json();
      if (Array.isArray(nData)) setNotices(nData);

      // Fetch roommates
      const rRes = await fetch(apiBase + "/api/tenants/roommates", { headers });
      const rData = await rRes.json();
      if (Array.isArray(rData)) setRoommates(rData);
    } catch (err) {
      console.error("Error fetching tenant data", err);
    }
  };

  // Search buildings in city
  const searchStays = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/buildings?city=${searchCity}`, { headers: { "bypass-tunnel-reminder": "true" } });
      const data = await res.json();
      if (Array.isArray(data)) setBuildings(data);
    } catch (err) {
      console.error("Error fetching buildings", err);
    }
  };

  const loadBuildingDetail = async (buildingId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/buildings/${buildingId}`, { headers: { "bypass-tunnel-reminder": "true" } });
      const data = await res.json();
      if (data && !data.error) {
        setSelectedBuildingDetail(data);
      }
    } catch (err) {
      console.error("Error loading building detail", err);
    }
  };

  const confirmBooking = async (receiptUrl?: string, transactionId?: string) => {
    if (!bookingRoom || !selectedBuildingDetail) return;

    // Find target selected bed or fallback to first available in the selected room
    const targetBed = selectedBookingBed || selectedBuildingDetail.beds.find(
      (b: any) => b.room_id === bookingRoom.id && b.status === "Available"
    );

    if (!targetBed) {
      Alert.alert("No Availability", "No available bed is selected or available in this room.");
      return;
    }

    const targetFloor = selectedBuildingDetail.floors.find((f: any) => f.id === bookingRoom.floor_id) || { id: bookingRoom.floor_id };

    try {
      const res = await fetch(apiBase + "/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({
          building_id: selectedBuilding.id,
          floor_id: targetFloor.id,
          room_id: bookingRoom.id,
          bed_id: targetBed.id,
          move_in_date: new Date().toISOString().split("T")[0],
          advance_amount: 5000,
          receipt_url: receiptUrl || undefined,
          transaction_id: transactionId || undefined,
          payment_method: paymentMethod
        })
      });
      const data = await res.json();

      if (data.error) {
        Alert.alert("Booking Failed", data.error);
      } else {
        setBookingDetails({
          bookingId: data.id || "HPG" + Math.floor(100000 + Math.random() * 900000),
          buildingName: selectedBuilding.building_name,
          roomNumber: bookingRoom.room_number,
          rent: bookingRoom.rent || bookingRoom.double_sharing_rent || 8500
        });
        setBookingSuccess(true);
        setBookingRoom(null);
        setSelectedBookingBed(null);
        fetchTenantData();
      }
    } catch (err) {
      Alert.alert("Error", "Failed to create booking.");
    }
  };

  const handleRegisterVisitor = async (visitorName: string, visitDate: string, purpose: string) => {
    if (!activeStay) {
      Alert.alert("Error", "No active stay found to register visitors.");
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/visitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({
          visitor_name: visitorName,
          visit_date: visitDate,
          purpose: purpose || "Personal Visit",
          building_id: activeStay.building_id
        })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Success", `Visitor pass registered! Code: ${data.pass_code}`);
        fetchTenantData();
      }
    } catch (err) {
      Alert.alert("Error", "Could not register visitor.");
    }
  };

  const handleCreateTicket = async (category: string, description: string, photoUrl?: string) => {
    if (!activeStay) {
      Alert.alert("Error", "No active stay found to file complaints.");
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({
          category,
          description,
          building_id: activeStay.building_id,
          photo_url: photoUrl || null
        })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Success", "Maintenance ticket logged successfully.");
        fetchTenantData();
      }
    } catch (e) {
      Alert.alert("Error", "Could not submit ticket.");
    }
  };

  const handleInvoicePayment = async (invoiceId: string, amountPaid: number, method: string, transactionId: string, receiptUrl?: string, pointsDeducted?: number) => {
    try {
      const res = await fetch(apiBase + "/api/payments/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
          amount_paid: amountPaid,
          payment_method: method,
          transaction_id: transactionId,
          receipt_url: receiptUrl || "https://example.com/mock-receipt.jpg",
          points_deducted: pointsDeducted || 0
        })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Submission Failed", data.error);
      } else {
        if (pointsDeducted && pointsDeducted > 0) {
          setRewardPoints(prev => Math.max(0, prev - pointsDeducted));
        }
        Alert.alert("Success", "Payment receipt details submitted. Awaiting manager approval.");
        fetchTenantData();
      }
    } catch (e) {
      Alert.alert("Error", "Could not verify connection.");
    }
  };

  useEffect(() => {
    searchStays();
  }, [searchCity, apiBase]);

  useEffect(() => {
    if (token) {
      fetchTenantData();
    }
  }, [token]);

  // Removed global login lock to allow guest roaming.

  // BOOKING SUCCESS SCREEN
  if (bookingSuccess && bookingDetails) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successSubtitle}>Your bed reservation has been submitted successfully.</Text>

            <View style={styles.receipt}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Accommodation</Text>
                <Text style={styles.receiptVal}>{bookingDetails.buildingName}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Room Number</Text>
                <Text style={styles.receiptVal}>Room {bookingDetails.roomNumber}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Monthly Rent</Text>
                <Text style={[styles.receiptVal, { color: COLORS.accent }]}>₹{bookingDetails.rent}/mo</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Booking ID</Text>
                <Text style={styles.receiptVal}>{bookingDetails.bookingId}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => {
                setBookingSuccess(false);
                setBookingDetails(null);
                setSelectedBuilding(null);
                setActiveTab("booking");
              }}
            >
              <Text style={styles.btnText}>View My Bookings</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* 1. Header (Premium Style) */}
        <Header
          userName={userProfile?.name || "Ananya"}
          onAvatarPress={() => {
            setSelectedBuilding(null);
            setActiveTab("profile");
          }}
        />

        {/* 2. Main Content Screens */}
        <View style={styles.mainContent}>
          {selectedBuilding ? (
            <BuildingDetailScreen
              building={selectedBuilding}
              detail={selectedBuildingDetail}
              onBack={() => setSelectedBuilding(null)}
              onBookRoom={(room, bed) => {
                if (!token) {
                  Alert.alert(
                    "Login Required",
                    "Please log in or register to book a stay.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Login",
                        onPress: () => {
                          setSelectedBuilding(null);
                          setActiveTab("profile");
                        }
                      }
                    ]
                  );
                  return;
                }
                setBookingRoom(room);
                setSelectedBookingBed(bed);
              }}
              ROOM_PHOTOS={ROOM_PHOTOS}
              buildings={buildings}
              userProfile={userProfile}
              roommatePrefs={roommatePrefs}
            />
          ) : (
            <>
              {(!token && activeTab !== "home" && activeTab !== "search") ? (
                <LoginScreen
                  apiBase={apiBase}
                  onLoginSuccess={handleLoginSuccess}
                  isLoading={isLoading}
                />
              ) : (
                <>
                  {activeTab === "home" && (
                    <HomeScreen
                      buildings={buildings}
                      onSelectBuilding={(b) => {
                        setSelectedBuilding(b);
                        setSelectedBuildingDetail(null);
                        loadBuildingDetail(b.id);
                      }}
                      onExploreStays={() => setActiveTab("search")}
                      ROOM_PHOTOS={ROOM_PHOTOS}
                    />
                  )}

                  {activeTab === "search" && (
                    <SearchScreen
                      buildings={buildings}
                      searchCity={searchCity}
                      setSearchCity={setSearchCity}
                      onSelectBuilding={(b) => {
                        setSelectedBuilding(b);
                        setSelectedBuildingDetail(null);
                        loadBuildingDetail(b.id);
                      }}
                      ROOM_PHOTOS={ROOM_PHOTOS}
                      genderFilter={genderFilter}
                      setGenderFilter={setGenderFilter}
                      wifiFilter={wifiFilter}
                      setWifiFilter={setWifiFilter}
                      foodFilter={foodFilter}
                      setFoodFilter={setFoodFilter}
                      roommatePrefs={roommatePrefs}
                    />
                  )}

                  {activeTab === "booking" && <BookingsScreen bookings={myBookings} />}

                  {activeTab === "manage" && (
                    <ManageScreen
                      invoices={myInvoices}
                      activeStay={activeStay}
                      visitorPasses={visitorPasses}
                      notices={notices}
                      roommates={roommates}
                      rewardPoints={rewardPoints}
                      onSubmitPayment={handleInvoicePayment}
                      onRegisterVisitor={handleRegisterVisitor}
                      apiBase={apiBase}
                      token={token}
                    />
                  )}

                  {activeTab === "complaints" && (
                    <ComplaintsScreen
                      activeStay={activeStay}
                      userProfile={userProfile}
                      maintenanceTickets={maintenanceTickets}
                      onCreateTicket={handleCreateTicket}
                      apiBase={apiBase}
                      token={token}
                    />
                  )}

                  {activeTab === "profile" && (
                    <ProfileScreen
                      userProfile={userProfile}
                      token={token}
                      onLogout={handleLogout}
                      roommatePrefs={roommatePrefs}
                      rewardPoints={rewardPoints}
                      onUpdatePrefs={(newPrefs: any) => {
                        setRoommatePrefs(newPrefs);
                        Alert.alert("Preferences Saved", "Your lifestyle settings have been updated. Compatibility scores updated!");
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}
        </View>

        {/* 3. Reusable Booking Confirmation Dialog */}
        <BookingModal
          visible={bookingRoom !== null}
          bookingRoom={bookingRoom}
          onClose={() => setBookingRoom(null)}
          confirmBooking={confirmBooking}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          apiBase={apiBase}
          token={token}
        />

        {/* 4. Bottom Tab Navigation Bar */}
        {!selectedBuilding && <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />}

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
  },
  successContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  successCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    ...SHADOWS.large,
  },
  successIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.successLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successIcon: {
    color: COLORS.success,
    fontSize: 32,
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  receipt: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  receiptLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  receiptVal: {
    color: COLORS.textDark,
    fontWeight: "600",
    fontSize: 12,
  },
  successBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    ...SHADOWS.small,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
