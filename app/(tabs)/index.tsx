// SchoolApp/app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";

export default function DashboardScreen() {
  const { user } = useAuth();

  const menuItems = [
    {
      title: "Mark Attendance",
      subtitle: "Take attendance for your class",
      icon: "checkbox-outline",
      color: "#1e3a8a",
      route: "/(tabs)/attendance",
    },
    {
      title: "Monthly Report",
      subtitle: "View monthly attendance report",
      icon: "calendar-outline",
      color: "#0369a1",
      route: "/(tabs)/monthlyattendance",
    },
    {
      title: "My Routine",
      subtitle: "View your class timetable",
      icon: "time-outline",
      color: "#0f766e",
      route: "/(tabs)/routine",
    },
    {
      title: "My Students",
      subtitle: "View students in your sections",
      icon: "people-outline",
      color: "#7c3aed",
      route: "/(tabs)/students",
    },
    {
      title: "My Profile",
      subtitle: "View your profile and info",
      icon: "person-outline",
      color: "#be185d",
      route: "/(tabs)/profile",
    },
    // Add more items here later as you expand the app
    // { title: 'View Routine', icon: 'calendar-outline', color: '#0369a1', route: '/(tabs)/routine' },
    // { title: 'My Students', icon: 'people-outline', color: '#0f766e', route: '/(tabs)/students' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>
            {user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.username || "Teacher"}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || "Teacher"}</Text>
          </View>
        </View>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>
            {user?.first_name?.[0]?.toUpperCase() || "T"}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuCard}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon as any} size={28} color="#fff" />
            </View>
            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  banner: {
    backgroundColor: "#1e3a8a",
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerLeft: {
    flex: 1,
  },
  welcomeText: {
    color: "#93c5fd",
    fontSize: 14,
  },
  nameText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 2,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  roleText: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  menuGrid: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 24,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextBox: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  arrowBox: {},
});
