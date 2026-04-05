// app/(tabs)/attendance.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import api from "../../src/services/api";

// Types
interface ClassSection {
  classId: number;
  sectionId: number;
  className: string;
  sectionName: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  roll_number: string;
}

type AttendanceStatus = "P" | "A" | "L" | "EL" | "LE";

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; next: AttendanceStatus }
> = {
  P: { label: "Present", color: "#22c55e", next: "A" },
  A: { label: "Absent", color: "#ef4444", next: "LE" },
  LE: { label: "Leave", color: "#f59e0b", next: "L" },
  L: { label: "Late Entry", color: "#3b82f6", next: "EL" },
  EL: { label: "Early Leave", color: "#8b5cf6", next: "P" },
};

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [selectedCS, setSelectedCS] = useState<ClassSection | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<
    Record<number, AttendanceStatus>
  >({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    fetchClassSections();
  }, []);

  // Step 1 — Get teacher's unique class+section pairs from routine
  const fetchClassSections = async () => {
    setLoading(true);

    try {
      // Get all routine entries for this teacher
      const res = await api.get(
        `/api/v1/routine/routines/?teacher=${user?.teacher_id}&period=1`,
      );
      const routines = res.data.results || res.data; // handle pagination

      // Extract unique class+section combinations
      const seen = new Set<string>();
      const unique: ClassSection[] = [];

      routines.forEach((r: any) => {
        const key = `${r.school_class}-${r.section}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push({
            classId: r.school_class,
            sectionId: r.section,
            className: r.school_class_name || `Class ${r.school_class}`,
            sectionName: r.section_name || `Section ${r.section}`,
          });
        }
      });

      setClassSections(unique);
    } catch {
      Alert.alert("Error", "Could not load your assigned sections");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Get students for selected class+section
  const fetchStudents = async (cs: ClassSection) => {
    setSelectedCS(cs);
    setLoading(true);
    try {
      const res = await api.get(
        `/api/v1/students/?school_class=${cs.classId}&section=${cs.sectionId}`,
      );
      const studentList = res.data.results || res.data; // ← handle pagination

      setStudents(studentList);
      // Initialize all students as Present
      const init: Record<number, AttendanceStatus> = {};
      studentList.forEach((s: Student) => (init[s.id] = "P"));
      setAttendance(init);
    } catch (err: any) {
      Alert.alert("Error", "Could not load students");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (studentId: number) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: STATUS_CONFIG[prev[studentId]].next,
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<number, AttendanceStatus> = {};
    students.forEach((s) => (updated[s.id] = status));
    setAttendance(updated);
  };

  // Step 3 — Submit attendance with exact payload format
  const submitAttendance = async () => {
    if (students.length === 0) {
      Alert.alert("Error", "No students to submit attendance for");
      return;
    }
    setSubmitting(true);
    try {
      const attendance_list = students.map((s) => ({
        student_id: s.id,
        status: attendance[s.id] || "P",
        class_id: selectedCS!.classId,
        section_id: selectedCS!.sectionId,
      }));

      await api.post("/api/v1/attendance/bulk-mark/", {
        date: today,
        attendance_list,
      });

      Alert.alert("Success", "Attendance submitted successfully!", [
        { text: "OK", onPress: () => setSelectedCS(null) },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Could not submit attendance",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getSummary = () => {
    const values = Object.values(attendance);
    return {
      P: values.filter((v) => v === "P").length,
      A: values.filter((v) => v === "A").length,
      LE: values.filter((v) => v === "LE").length,
      L: values.filter((v) => v === "L").length,
      EL: values.filter((v) => v === "EL").length,
    };
  };

  // ── Class+Section List ────────────────────────────────────
  if (!selectedCS) {
    return (
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Select a Section</Text>
        <Text style={styles.dateText}>Date: {today}</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#1e3a8a"
            style={{ marginTop: 40 }}
          />
        ) : classSections.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>
              No sections assigned in routine
            </Text>
          </View>
        ) : (
          <FlatList
            data={classSections}
            keyExtractor={(item) => `${item.classId}-${item.sectionId}`}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sectionCard}
                onPress={() => fetchStudents(item)}
              >
                <View style={styles.sectionIcon}>
                  <Ionicons name="people-outline" size={24} color="#1e3a8a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionName}>
                    {item.className} — {item.sectionName}
                  </Text>
                  <Text style={styles.sectionSub}>Tap to mark attendance</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // ── Student Attendance List ───────────────────────────────
  const summary = getSummary();

  return (
    <View style={styles.container}>
      {/* Back + Header */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => setSelectedCS(null)}
      >
        <Ionicons name="arrow-back" size={20} color="#1e3a8a" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>
        {selectedCS.className} — {selectedCS.sectionName}
      </Text>
      <Text style={styles.dateText}>{today}</Text>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => (
          <View key={s} style={styles.summaryItem}>
            <Text
              style={[styles.summaryCount, { color: STATUS_CONFIG[s].color }]}
            >
              {summary[s]}
            </Text>
            <Text style={styles.summaryLabel}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Mark All Buttons — only show P, A, LE for quick marking */}
      <View style={styles.markAllRow}>
        <Text style={styles.markAllLabel}>Mark all:</Text>
        {(["P", "A", "LE"] as AttendanceStatus[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.markAllBtn,
              { backgroundColor: STATUS_CONFIG[s].color },
            ]}
            onPress={() => markAll(s)}
          >
            <Text style={styles.markAllBtnText}>{STATUS_CONFIG[s].label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Student List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1e3a8a"
          style={{ marginTop: 40 }}
        />
      ) : students.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No students found</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const status = attendance[item.id] || "P";
            return (
              <TouchableOpacity
                style={[
                  styles.studentRow,
                  { borderLeftColor: STATUS_CONFIG[status].color },
                ]}
                onPress={() => toggleStatus(item.id)}
              >
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>
                    {item.first_name} {item.last_name}
                  </Text>
                  <Text style={styles.rollNo}>Roll: {item.roll_number}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: STATUS_CONFIG[status].color },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {STATUS_CONFIG[status].label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={submitAttendance}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.submitText}>
                Submit Attendance ({students.length} students)
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dateText: {
    fontSize: 13,
    color: "#6b7280",
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 15,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  sectionSub: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 4,
  },
  backText: {
    color: "#1e3a8a",
    fontSize: 15,
    fontWeight: "600",
  },
  summaryBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    justifyContent: "space-around",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  markAllRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  markAllLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  studentRow: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  rollNo: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  submitContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#f3f4f6",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  submitBtn: {
    backgroundColor: "#1e3a8a",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnDisabled: {
    backgroundColor: "#93c5fd",
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
