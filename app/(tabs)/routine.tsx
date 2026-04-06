// SchoolApp/app/(tabs)/routine.tsx
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
interface PeriodDetail {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
}

interface RoutineEntry {
  id: number;
  school_class: number;
  section: number;
  day: string;
  period: number;
  subject: number;
  subject_name: string;
  subject_code: string;
  class_name: string;
  section_name: string;
  period_detail: PeriodDetail;
}

const DAYS = [
  { key: "sun", label: "Sun" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
];

const DAY_FULL: Record<string, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
};

// Get today's day key
const getTodayKey = () => {
  const day = new Date().getDay();
  const map: Record<number, string> = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
  };
  return map[day] || "sun";
};

const formatTime = (time: string) => {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
};

const PERIOD_COLORS = [
  "#1e3a8a",
  "#0369a1",
  "#0f766e",
  "#6d28d9",
  "#b45309",
  "#be185d",
  "#065f46",
  "#9a3412",
];

export default function RoutineScreen() {
  const { user } = useAuth();
  const [routine, setRoutine] = useState<RoutineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getTodayKey());

  useEffect(() => {
    fetchRoutine();
  }, []);

  const fetchRoutine = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/routine/routines/?teacher=${user?.teacher_id}`,
      );
      const data = res.data.results || res.data;
      setRoutine(data);
    } catch {
      Alert.alert("Error", "Could not load your routine");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort entries for selected day
  const dayEntries = routine
    .filter((r) => r.day === selectedDay)
    .sort((a, b) => a.period - b.period);

  return (
    <View style={styles.container}>
      {/* Day Tabs */}
      <View style={styles.dayTabBar}>
        {DAYS.map((d) => {
          const isToday = d.key === getTodayKey();
          const isSelected = d.key === selectedDay;
          return (
            <TouchableOpacity
              key={d.key}
              style={[styles.dayTab, isSelected && styles.dayTabActive]}
              onPress={() => setSelectedDay(d.key)}
            >
              <Text
                style={[
                  styles.dayTabText,
                  isSelected && styles.dayTabTextActive,
                ]}
              >
                {d.label}
              </Text>
              {isToday && (
                <View
                  style={[styles.todayDot, isSelected && styles.todayDotActive]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day Title */}
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{DAY_FULL[selectedDay]}</Text>
        <Text style={styles.daySubtitle}>
          {dayEntries.length} {dayEntries.length === 1 ? "period" : "periods"}{" "}
          assigned
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Loading routine...</Text>
        </View>
      ) : dayEntries.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No classes today</Text>
          <Text style={styles.emptySubtitle}>
            You have no periods assigned on {DAY_FULL[selectedDay]}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {dayEntries.map((entry, index) => {
            const color = PERIOD_COLORS[index % PERIOD_COLORS.length];
            return (
              <View key={entry.id} style={styles.card}>
                {/* Time Column */}
                <View style={[styles.timeCol, { backgroundColor: color }]}>
                  <Text style={styles.periodName}>
                    {entry.period_detail.name}
                  </Text>
                  <Text style={styles.timeText}>
                    {formatTime(entry.period_detail.start_time)}
                  </Text>
                  <Text style={styles.timeSep}>—</Text>
                  <Text style={styles.timeText}>
                    {formatTime(entry.period_detail.end_time)}
                  </Text>
                </View>

                {/* Info Column */}
                <View style={styles.infoCol}>
                  <Text style={styles.subjectName}>{entry.subject_name}</Text>
                  <Text style={styles.subjectCode}>{entry.subject_code}</Text>

                  <View style={styles.classBadgeRow}>
                    <View
                      style={[
                        styles.classBadge,
                        { backgroundColor: `${color}18` },
                      ]}
                    >
                      <Ionicons name="school-outline" size={12} color={color} />
                      <Text style={[styles.classBadgeText, { color }]}>
                        {entry.class_name}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.classBadge,
                        { backgroundColor: `${color}18` },
                      ]}
                    >
                      <Ionicons name="people-outline" size={12} color={color} />
                      <Text style={[styles.classBadgeText, { color }]}>
                        Section {entry.section_name}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  dayTabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 8,
  },
  dayTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  dayTabActive: {
    borderBottomColor: "#1e3a8a",
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9ca3af",
  },
  dayTabTextActive: {
    color: "#1e3a8a",
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#9ca3af",
  },
  todayDotActive: {
    backgroundColor: "#1e3a8a",
  },
  dayHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  daySubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingBottom: 60,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  timeCol: {
    width: 90,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  periodName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  timeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "600",
  },
  timeSep: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
  },
  infoCol: {
    flex: 1,
    padding: 14,
    gap: 4,
    justifyContent: "center",
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  subjectCode: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
  },
  classBadgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  classBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
