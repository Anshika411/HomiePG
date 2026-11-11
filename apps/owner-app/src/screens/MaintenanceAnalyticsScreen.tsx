import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Linking
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface MaintenanceAnalyticsProps {
  apiBase: string;
  token: string;
}

export const MaintenanceAnalyticsScreen: React.FC<MaintenanceAnalyticsProps> = ({ apiBase, token }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  
  // Tickets tab states
  const [activeTab, setActiveTab] = useState<"analytics" | "tickets">("analytics");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${apiBase}/api/maintenance/analytics`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch {}
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch(`${apiBase}/api/maintenance/owner-tickets`, {
        headers: { Authorization: `Bearer ${token}`, "bypass-tunnel-reminder": "true" }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
      }
    } catch {}
    setLoadingTickets(false);
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchAnalytics(), fetchTickets()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAnalytics(), fetchTickets()]);
    setRefreshing(false);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: "Scheduled" | "Resolved") => {
    setUpdatingTicketId(ticketId);
    try {
      const res = await fetch(`${apiBase}/api/maintenance/${ticketId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true"
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Success", `Ticket status updated to ${newStatus}.`);
        // Refresh local data
        fetchTickets();
        fetchAnalytics();
      }
    } catch {
      Alert.alert("Error", "Failed to update ticket status.");
    } finally {
      setUpdatingTicketId(null);
    }
  };

  if (loading) return <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />;

  const totalTickets = analytics?.total || 0;
  const categories = analytics?.categoryBreakdown || [];

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>🔧 Maintenance Hub</Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "analytics" && styles.tabBtnActive]}
          onPress={() => setActiveTab("analytics")}
        >
          <Text style={[styles.tabBtnText, activeTab === "analytics" && styles.tabBtnTextActive]}>
            📊 Analytics & Stats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "tickets" && styles.tabBtnActive]}
          onPress={() => setActiveTab("tickets")}
        >
          <Text style={[styles.tabBtnText, activeTab === "tickets" && styles.tabBtnTextActive]}>
            🛠️ Manage Tickets ({tickets.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />
        }
      >
        {activeTab === "analytics" ? (
          <View>
            {/* Overview Cards */}
            <View style={styles.overviewRow}>
              <View style={[styles.overviewCard, { backgroundColor: COLORS.primaryLight }]}>
                <Text style={styles.cardVal}>{totalTickets}</Text>
                <Text style={styles.cardLbl}>Total Complaints</Text>
              </View>
              <View style={[styles.overviewCard, { backgroundColor: COLORS.successLight }]}>
                <Text style={[styles.cardVal, { color: COLORS.success }]}>{analytics?.statusCount?.Resolved || 0}</Text>
                <Text style={styles.cardLbl}>Resolved</Text>
              </View>
              <View style={[styles.overviewCard, { backgroundColor: COLORS.dangerLight }]}>
                <Text style={[styles.cardVal, { color: COLORS.danger }]}>
                  {(analytics?.statusCount?.Pending || 0) + (analytics?.statusCount?.Scheduled || 0)}
                </Text>
                <Text style={styles.cardLbl}>Active</Text>
              </View>
            </View>

            {/* Recurrence chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Complaint Distribution by Category</Text>
              {categories.length === 0 ? (
                <Text style={styles.emptyText}>No tickets logged yet to analyze.</Text>
              ) : (
                categories.map((c: any, index: number) => {
                  const pct = totalTickets > 0 ? (c.count / totalTickets) * 100 : 0;
                  return (
                    <View key={index} style={styles.barItem}>
                      <View style={styles.barInfo}>
                        <Text style={styles.barLabel}>{c.category}</Text>
                        <Text style={styles.barVal}>{c.count} tickets ({Math.round(pct)}%)</Text>
                      </View>
                      <View style={styles.track}>
                        <View style={[styles.fill, { width: `${pct}%` }]} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Insight Advice */}
            <View style={styles.insightsCard}>
              <Text style={styles.insightsTitle}>💡 Maintenance Strategy Recommendation</Text>
              {categories.length > 0 && categories[0].count >= 3 ? (
                <Text style={styles.insightsPara}>
                  Your primary complaint driver is **{categories[0].category}**. Setting up a quarterly preventive service schedule for {categories[0].category.toLowerCase()} will likely reduce overall ticket loads by up to 30%.
                </Text>
              ) : (
                <Text style={styles.insightsPara}>
                  Your maintenance pipeline looks healthy. Keep active resolution windows below 24 hours to maximize tenant satisfaction scores.
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View>
            {loadingTickets ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
            ) : tickets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyStateTitle}>No tickets logged yet!</Text>
                <Text style={styles.emptySub}>All properties are fully operational with zero active complaints from tenants.</Text>
              </View>
            ) : (
              tickets.map((t: any) => {
                const isPending = t.status === "Pending";
                const isScheduled = t.status === "Scheduled";
                const isResolved = t.status === "Resolved";

                let statusColor = COLORS.warning;
                let statusBg = COLORS.warningLight;
                if (isResolved) {
                  statusColor = COLORS.success;
                  statusBg = COLORS.successLight;
                } else if (isScheduled) {
                  statusColor = COLORS.primary;
                  statusBg = COLORS.primaryLight;
                }

                return (
                  <View key={t.id} style={styles.ticketCard}>
                    <View style={styles.ticketHeader}>
                      <View>
                        <Text style={styles.ticketCat}>🛠️ {t.category} Ticket</Text>
                        <Text style={styles.ticketProperty}>
                          🏠 {t.buildings?.building_name || "PG Property"}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {t.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.ticketBody}>
                      <Text style={styles.ticketLabel}>RESIDENT DETAILS</Text>
                      <Text style={styles.ticketVal}>
                        👤 {t.profiles?.name || "Resident"} ({t.profiles?.email || "No Email"})
                      </Text>

                      <Text style={[styles.ticketLabel, { marginTop: 10 }]}>DESCRIPTION</Text>
                      <Text style={styles.ticketDesc}>{t.description}</Text>

                      {t.photo_url ? (
                        <TouchableOpacity
                          style={styles.evidenceBtn}
                          onPress={() => {
                            Linking.openURL(t.photo_url).catch(() => {
                              Alert.alert("Error", "Could not open photo evidence URL.");
                            });
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.evidenceBtnText}>🖼️ View Attachment Photo</Text>
                        </TouchableOpacity>
                      ) : null}

                      <Text style={styles.ticketDate}>
                        Filed Date: {t.created_at ? new Date(t.created_at).toLocaleString() : "Unknown"}
                      </Text>
                    </View>

                    {!isResolved && (
                      <View style={styles.actionRow}>
                        {isPending && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.scheduleBtn]}
                            onPress={() => updateTicketStatus(t.id, "Scheduled")}
                            disabled={updatingTicketId === t.id}
                          >
                            <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>⚙️ Schedule Repair</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.resolveBtn]}
                          onPress={() => updateTicketStatus(t.id, "Resolved")}
                          disabled={updatingTicketId === t.id}
                        >
                          <Text style={[styles.actionBtnText, { color: "#fff" }]}>✓ Resolve Complaint</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
  screenTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 16 },
  tabRow: { flexDirection: "row", backgroundColor: COLORS.border, borderRadius: 12, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabBtnActive: { backgroundColor: COLORS.cardBg, ...SHADOWS.small },
  tabBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted },
  tabBtnTextActive: { color: COLORS.primary, fontWeight: "800" },
  overviewRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  overviewCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", ...SHADOWS.small },
  cardVal: { fontSize: 24, fontWeight: "900", color: COLORS.primary },
  cardLbl: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, textAlign: "center" },
  chartCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 16, ...SHADOWS.medium },
  chartTitle: { fontSize: 14, fontWeight: "800", color: COLORS.textDark, marginBottom: 16 },
  barItem: { marginBottom: 14 },
  barInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  barLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  barVal: { fontSize: 12, color: COLORS.textMuted },
  track: { height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: "hidden" },
  fill: { height: 10, backgroundColor: COLORS.accent, borderRadius: 5 },
  insightsCard: { backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 16, marginBottom: 30 },
  insightsTitle: { fontSize: 13, fontWeight: "800", color: COLORS.primary, marginBottom: 6 },
  insightsPara: { fontSize: 12, color: COLORS.primary, lineHeight: 18 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", marginVertical: 20 },
  emptyState: { alignItems: "center", paddingVertical: 50, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyStateTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.textDark },
  emptySub: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginTop: 6, lineHeight: 18 },
  ticketCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.border },
  ticketHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  ticketCat: { fontSize: 14, fontWeight: "bold", color: COLORS.textDark },
  ticketProperty: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: "800" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  ticketBody: { paddingBottom: 10 },
  ticketLabel: { fontSize: 9, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.5 },
  ticketVal: { fontSize: 12, color: COLORS.textDark, marginTop: 2, fontWeight: "600" },
  ticketDesc: { fontSize: 12, color: COLORS.textDark, marginTop: 4, lineHeight: 16 },
  evidenceBtn: { backgroundColor: COLORS.primaryLight, borderStyle: "dashed", borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, padding: 10, marginTop: 12, alignItems: "center" },
  evidenceBtnText: { fontSize: 11, color: COLORS.primary, fontWeight: "700" },
  ticketDate: { fontSize: 9, color: COLORS.textMuted, marginTop: 10 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  scheduleBtn: { backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary },
  resolveBtn: { backgroundColor: COLORS.success },
  actionBtnText: { fontSize: 12, fontWeight: "bold" },
});
