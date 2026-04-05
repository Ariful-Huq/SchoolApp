// SchoolApp/app/student/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import api from "../../src/services/api";

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  roll_number: string;
  photo: string | null;
  class_name: string;
  section_name: string;
  session_name: string;
}

const API_BASE = "http://192.168.0.7:8000";

const getPhotoUrl = (photo: string | null) => {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  return `${API_BASE}${photo}`;
};

export default function StudentProfileScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/students/${id}/`);
      setStudent(res.data);
    } catch {
      Alert.alert("Error", "Could not load student profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-outline" size={48} color="#9ca3af" />
        <Text style={styles.emptyText}>Student not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Banner */}
      <View style={[styles.banner, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back to Students</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.photoWrapper}>
          {student.photo ? (
            <Image
              source={{ uri: getPhotoUrl(student.photo) || "" }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoInitial}>
                {student.first_name[0]?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.studentName}>
          {student.first_name} {student.last_name}
        </Text>
        <Text style={styles.rollNumber}>
          Roll Number: {student.roll_number}
        </Text>
        <View style={styles.idBadge}>
          <Text style={styles.idBadgeText}>Student ID: #{student.id}</Text>
        </View>
      </View>

      {/* Academic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Academic Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: "#eff6ff" }]}>
              <Ionicons name="school-outline" size={18} color="#1e3a8a" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Class & Section</Text>
              <Text style={styles.infoValue}>
                {student.class_name} — Section {student.section_name}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="calendar-outline" size={18} color="#16a34a" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Academic Session</Text>
              <Text style={styles.infoValue}>{student.session_name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: "#faf5ff" }]}>
              <Ionicons name="finger-print-outline" size={18} color="#7c3aed" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Student System ID</Text>
              <Text style={styles.infoValue}>#{student.id}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

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
    paddingTop: 16,
    paddingBottom: 60,
    paddingHorizontal: 16,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  profileHeader: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -44,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  photoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#e5e7eb",
    marginBottom: 4,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1e3a8a",
    justifyContent: "center",
    alignItems: "center",
  },
  photoInitial: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
  },
  studentName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  rollNumber: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  idBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  idBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e3a8a",
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
  backBtn: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
