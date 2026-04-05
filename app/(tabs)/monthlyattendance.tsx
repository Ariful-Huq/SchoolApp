import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
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

interface StudentRecord {
  student_id: number;
  student_name: string;
  roll: string;
  days: Record<string, string>;
}

const STATUS_COLORS: Record<string, string> = {
  P: "#16a34a",
  A: "#dc2626",
  L: "#ca8a04",
  EL: "#ea580c",
  LE: "#2563eb",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MonthlyAttendanceScreen() {
  const { user } = useAuth();
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [selectedCS, setSelectedCS] = useState<ClassSection | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSections, setLoadingSections] = useState(true);

  const daysInMonth = new Date(year, month, 0).getDate();

  const isWeekend = (day: number) => {
    const date = new Date(year, month - 1, day);
    const dow = date.getDay();
    return dow === 5 || dow === 6; // Friday & Saturday
  };

  // Load teacher's assigned class+sections from routine
  useEffect(() => {
    fetchClassSections();
  }, []);

  const fetchClassSections = async () => {
    setLoadingSections(true);
    try {
      const res = await api.get(
        `/api/v1/routine/routines/?teacher=${user?.teacher_id}&period=1`,
      );
      const routines = res.data.results || res.data;
      const seen = new Set<string>();
      const unique: ClassSection[] = [];
      routines.forEach((r: any) => {
        const key = `${r.school_class}-${r.section}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push({
            classId: r.school_class,
            sectionId: r.section,
            className: r.class_name || `Class ${r.school_class}`,
            sectionName: r.section_name || `Section ${r.section}`,
          });
        }
      });
      setClassSections(unique);
      if (unique.length > 0) setSelectedCS(unique[0]); // auto-select first
    } catch {
      Alert.alert("Error", "Could not load your sections");
    } finally {
      setLoadingSections(false);
    }
  };

  const fetchReport = async () => {
    if (!selectedCS) return Alert.alert("Error", "Please select a section");
    setLoading(true);
    setData([]);
    try {
      const res = await api.get(
        `/api/v1/attendance/monthly/?year=${year}&month=${month}&class_id=${selectedCS.classId}&section_id=${selectedCS.sectionId}`,
      );
      setData(res.data);
    } catch {
      Alert.alert("Error", "Could not load attendance report");
    } finally {
      setLoading(false);
    }
  };

  const getStats = (student: StudentRecord) => {
    const values = Object.values(student.days);
    const p = values.filter((v) => v === "P").length;
    const l = values.filter((v) => v === "L").length;
    const a = values.filter((v) => v === "A").length;
    const el = values.filter((v) => v === "EL").length;
    const total = values.filter((v) => v !== "").length;
    const percent = total > 0 ? (((p + l) / total) * 100).toFixed(1) : "0.0";
    return { present: p + l, absent: a + el, percent };
  };

  const adjustMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m > 12) {
      m = 1;
      y++;
    }
    if (m < 1) {
      m = 12;
      y--;
    }
    setMonth(m);
    setYear(y);
    setData([]);
  };

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        {/* Month Selector */}
        <View style={styles.monthRow}>
          <TouchableOpacity
            onPress={() => adjustMonth(-1)}
            style={styles.arrowBtn}
          >
            <Ionicons name="chevron-back" size={20} color="#1e3a8a" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {MONTHS[month - 1]} {year}
          </Text>
          <TouchableOpacity
            onPress={() => adjustMonth(1)}
            style={styles.arrowBtn}
          >
            <Ionicons name="chevron-forward" size={20} color="#1e3a8a" />
          </TouchableOpacity>
        </View>

        {/* Section Selector */}
        {loadingSections ? (
          <ActivityIndicator color="#1e3a8a" />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sectionScroll}
          >
            {classSections.map((cs) => (
              <TouchableOpacity
                key={`${cs.classId}-${cs.sectionId}`}
                style={[
                  styles.sectionChip,
                  selectedCS?.sectionId === cs.sectionId &&
                    selectedCS?.classId === cs.classId &&
                    styles.sectionChipActive,
                ]}
                onPress={() => {
                  setSelectedCS(cs);
                  setData([]);
                }}
              >
                <Text
                  style={[
                    styles.sectionChipText,
                    selectedCS?.sectionId === cs.sectionId &&
                      selectedCS?.classId === cs.classId &&
                      styles.sectionChipTextActive,
                  ]}
                >
                  {cs.className} — {cs.sectionName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={fetchReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="bar-chart-outline" size={16} color="#fff" />
              <Text style={styles.generateBtnText}>Generate Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(STATUS_COLORS).map(([key, color]) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{key}</Text>
          </View>
        ))}
      </View>

      {/* Report Table */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="document-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>
            Select a section and tap{"\n"}Generate Report
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.colName, styles.headerText]}>Student</Text>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => (
                  <Text
                    key={day}
                    style={[
                      styles.colDay,
                      styles.headerText,
                      isWeekend(day) && styles.weekendHeader,
                    ]}
                  >
                    {day}
                  </Text>
                ),
              )}
              <Text
                style={[
                  styles.colStat,
                  styles.headerText,
                  { color: "#16a34a" },
                ]}
              >
                P+L
              </Text>
              <Text
                style={[
                  styles.colStat,
                  styles.headerText,
                  { color: "#dc2626" },
                ]}
              >
                A+EL
              </Text>
              <Text
                style={[
                  styles.colStat,
                  styles.headerText,
                  { color: "#2563eb" },
                ]}
              >
                %
              </Text>
            </View>

            {/* Student Rows */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {data.map((student, index) => {
                const stats = getStats(student);
                return (
                  <View
                    key={student.student_id}
                    style={[
                      styles.tableRow,
                      index % 2 === 0 && styles.tableRowAlt,
                    ]}
                  >
                    {/* Name + Roll */}
                    <View style={styles.colName}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {student.student_name}
                      </Text>
                      <Text style={styles.rollText}>Roll: {student.roll}</Text>
                    </View>

                    {/* Day Cells */}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                      (day) => {
                        const status = student.days[day.toString()];
                        const weekend = isWeekend(day);
                        return (
                          <View
                            key={day}
                            style={[
                              styles.colDay,
                              styles.dayCell,
                              weekend && !status && styles.weekendCell,
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                status && {
                                  color: STATUS_COLORS[status],
                                  fontWeight: "700",
                                },
                              ]}
                            >
                              {status || (weekend ? "—" : "")}
                            </Text>
                          </View>
                        );
                      },
                    )}

                    {/* Stats */}
                    <Text style={[styles.colStat, styles.statPresent]}>
                      {stats.present}
                    </Text>
                    <Text style={[styles.colStat, styles.statAbsent]}>
                      {stats.absent}
                    </Text>
                    <Text style={[styles.colStat, styles.statPercent]}>
                      {stats.percent}%
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const COL_NAME_WIDTH = 130;
const COL_DAY_WIDTH = 28;
const COL_STAT_WIDTH = 44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  filterBar: {
    backgroundColor: "#fff",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 10,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  arrowBtn: {
    padding: 6,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e3a8a",
    minWidth: 160,
    textAlign: "center",
  },
  sectionScroll: {
    flexGrow: 0,
  },
  sectionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionChipActive: {
    backgroundColor: "#1e3a8a",
    borderColor: "#1e3a8a",
  },
  sectionChipText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  sectionChipTextActive: {
    color: "#fff",
  },
  generateBtn: {
    backgroundColor: "#1e3a8a",
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  generateBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  legend: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 8,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 8,
  },
  headerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textAlign: "center",
  },
  weekendHeader: {
    color: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "center",
    paddingVertical: 6,
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  colName: {
    width: COL_NAME_WIDTH,
    paddingHorizontal: 8,
  },
  colDay: {
    width: COL_DAY_WIDTH,
    textAlign: "center",
  },
  colStat: {
    width: COL_STAT_WIDTH,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
  },
  studentName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  rollText: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 1,
  },
  dayCell: {
    alignItems: "center",
    justifyContent: "center",
    height: 32,
  },
  weekendCell: {
    backgroundColor: "#fef2f2",
  },
  dayText: {
    fontSize: 10,
    color: "#9ca3af",
  },
  statPresent: {
    color: "#16a34a",
  },
  statAbsent: {
    color: "#dc2626",
  },
  statPercent: {
    color: "#2563eb",
  },
});
