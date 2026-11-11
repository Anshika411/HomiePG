import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native";
import logoIcon from "./assets/logo-icon.png";
import Constants from "expo-constants";

const TUNNEL_URL = "https://furnishings-clarke-plastic-data.trycloudflare.com";

const getApiUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host.includes("exp.direct")) {
      return TUNNEL_URL;
    }
    return "http://" + host + ":5000";
  }
  return "http://192.168.88.5:5000";
};

const API_BASE = getApiUrl();

export default function App() {
  const [token, setToken] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [email, setEmail] = useState("admin@homiepg.com");
  const [password, setPassword] = useState("password123");

  const [activeTab, setActiveTab] = useState("approvals"); // 'approvals', 'stats'
  const [owners, setOwners] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalOwners: 0,
    totalBuildings: 0,
    totalBookings: 0
  });

  const handleLogin = async () => {
    try {
      const res = await fetch(API_BASE + "/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.error) {
        Alert.alert("Authentication Error", data.error);
        return;
      }

      if (data.profile.role !== "super_admin") {
        Alert.alert("Access Denied", "Only Super Admins can access this application.");
        return;
      }

      setToken(data.token);
      setUserProfile(data.profile);
      fetchAdminData(data.token);
    } catch (err) {
      Alert.alert("Error", "Failed to connect to the backend server.");
    }
  };

  const fetchAdminData = async (authToken = token) => {
    try {
      const headers = { Authorization: `Bearer ${authToken}`, "bypass-tunnel-reminder": "true" };
      const [oRes, sRes] = await Promise.all([
        fetch(API_BASE + "/api/admin/owners", { headers }),
        fetch(API_BASE + "/api/admin/stats", { headers })
      ]);

      const ownersData = await oRes.json();
      const statsData = await sRes.json();

      if (Array.isArray(ownersData)) setOwners(ownersData);
      if (statsData && !statsData.error) setStats(statsData);
    } catch (err) {
      console.error("Error fetching admin data", err);
    }
  };

  const toggleVerify = async (ownerId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/owners/${ownerId}/verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({ is_verified: !currentStatus })
      });
      const data = await res.json();
      
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        fetchAdminData();
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update owner verification.");
    }
  };

  // If not logged in, render simple glassmorphic login screen
  if (!token) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.loginTitle}>Homie<Text style={styles.highlight}>PG</Text> Admin Console</Text>
        <Text style={styles.loginSubtitle}>Access restricted to platform managers</Text>

        <TextInput
          style={styles.input}
          placeholder="Admin Email Address"
          placeholderTextColor="#64748B"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Secure Password"
          placeholderTextColor="#64748B"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.btnText}>Authenticate Admin</Text>
        </TouchableOpacity>
        <Image source={logoIcon} style={styles.loginLogoBottomRight} />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Homie<Text style={styles.highlight}>PG</Text> Admin</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => { setToken(""); setUserProfile(null); }}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea}>
        {activeTab === "approvals" && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Owner Approval Queues</Text>
            {owners.length > 0 ? (
              owners.map(o => (
                <View key={o.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{o.full_name}</Text>
                  <Text style={styles.bodyText}>Email: {o.email}</Text>
                  <Text style={styles.bodyText}>Status: {o.is_verified ? "Verified Operator" : "Pending Review"}</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.btn, o.is_verified ? styles.btnRevoke : styles.btnApprove]}
                      onPress={() => toggleVerify(o.id, o.is_verified)}
                    >
                      <Text style={styles.btnText}>{o.is_verified ? "Revoke Approval" : "Verify Owner"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No registered owners found in the queue.</Text>
            )}
          </View>
        )}

        {activeTab === "stats" && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Global System Analytics</Text>
            <View style={styles.statsCard}>
              <Text style={styles.statLabel}>Registered Owners</Text>
              <Text style={styles.statNumber}>{stats.totalOwners}</Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={styles.statLabel}>Active Buildings</Text>
              <Text style={styles.statNumber}>{stats.totalBuildings}</Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={styles.statLabel}>Total Bookings</Text>
              <Text style={styles.statNumber}>{stats.totalBookings}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Tabs */}
      <View style={styles.footerNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("approvals")}>
          <Text style={[styles.navText, activeTab === "approvals" && styles.navTextActive]}>Approvals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("stats")}>
          <Text style={[styles.navText, activeTab === "stats" && styles.navTextActive]}>Stats</Text>
        </TouchableOpacity>
        <View style={styles.navLogoContainer}>
          <Image source={logoIcon} style={styles.navLogo} />
        </View>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: 50,
  },
  loginContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loginLogo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0043ae",
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    fontSize: 16,
    color: "#0F172A",
    marginBottom: 15,
  },
  loginBtn: {
    backgroundColor: "#0043ae",
    paddingVertical: 14,
    width: "100%",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#0043ae",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerIcon: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0043ae",
    flex: 1,
  },
  highlight: {
    color: "#14a035",
  },
  logoutBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#64748B",
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748B",
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 8,
  },
  bodyText: {
    color: "#64748B",
    fontSize: 14,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  btnApprove: {
    backgroundColor: "#14a035",
  },
  btnRevoke: {
    backgroundColor: "#dc3545",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  statsCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statLabel: {
    color: "#64748B",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0043ae",
  },
  footerNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingVertical: 12,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
  navText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  navTextActive: {
    color: "#0043ae",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  loginLogoBottomRight: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 45,
    height: 45,
    opacity: 0.8,
  },
  navLogoContainer: {
    paddingRight: 20,
    justifyContent: "center",
  },
  navLogo: {
    width: 24,
    height: 24,
    opacity: 0.8,
  },
});
