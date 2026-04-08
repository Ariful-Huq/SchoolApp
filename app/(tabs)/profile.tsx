// SchoolApp/app/(tabs)/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import api from "../../src/services/api";

// Types
interface TeacherProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  photo: string | null;
  designation: string;
  qualification: string;
  date_of_joining: string;
  assigned_subjects: string[];
}

const API_BASE = "http://192.168.68.100"; // Same as in api.ts

const getPhotoUrl = (photo: string | null) => {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  return `${API_BASE}${photo}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/teachers/${user?.teacher_id}/`);
      setProfile(res.data);
    } catch {
      Alert.alert("Error", "Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => await logout(),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-outline" size={48} color="#9ca3af" />
        <Text style={styles.emptyText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.banner}>
        <View style={styles.photoWrapper}>
          {profile.photo ? (
            <Image
              source={{ uri: getPhotoUrl(profile.photo) || "" }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoInitial}>
                {profile.first_name[0]?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.profileName}>
          {profile.first_name} {profile.last_name}
        </Text>
        <Text style={styles.profileDesignation}>
          {profile.designation || "Teacher"}
        </Text>
        <View style={styles.usernameBadge}>
          <Ionicons name="person-circle-outline" size={14} color="#93c5fd" />
          <Text style={styles.usernameText}>@{user?.username}</Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.infoCard}>
          <InfoRow
            icon="mail-outline"
            label="Email"
            value={profile.email || "N/A"}
          />
          <Divider />
          <InfoRow
            icon="call-outline"
            label="Phone"
            value={profile.phone || "N/A"}
          />
          <Divider />
          <InfoRow
            icon="ribbon-outline"
            label="Qualification"
            value={profile.qualification || "N/A"}
          />
          <Divider />
          <InfoRow
            icon="calendar-outline"
            label="Joined"
            value={formatDate(profile.date_of_joining)}
          />
        </View>
      </View>

      {/* Assigned Subjects */}
      {profile.assigned_subjects && profile.assigned_subjects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Subjects</Text>
          <View style={styles.infoCard}>
            <View style={styles.subjectList}>
              {profile.assigned_subjects.map((subject, index) => (
                <View key={index} style={styles.subjectChip}>
                  <Ionicons name="book-outline" size={14} color="#1e3a8a" />
                  <Text style={styles.subjectText}>{subject}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoCard}>
          <InfoRow
            icon="shield-checkmark-outline"
            label="Role"
            value={user?.role || "Teacher"}
          />
          <Divider />
          <InfoRow
            icon="person-outline"
            label="Username"
            value={user?.username || "N/A"}
          />
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// Helper Components
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconBox}>
      <Ionicons name={icon as any} size={18} color="#1e3a8a" />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f3f4f6",
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 8,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 15,
  },
  banner: {
    backgroundColor: "#1e3a8a",
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: "center",
    gap: 8,
  },
  photoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: 8,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoInitial: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "700",
  },
  profileName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  profileDesignation: {
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: "500",
  },
  usernameBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  usernameText: {
    color: "#bfdbfe",
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginLeft: 62,
  },
  subjectList: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 14,
    gap: 8,
  },
  subjectChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  subjectText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e3a8a",
  },
  logoutBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#fee2e2",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "700",
  },
});
