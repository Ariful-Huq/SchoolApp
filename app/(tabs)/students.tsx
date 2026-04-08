// SchoolApp/app/(tabs)/students.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
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
  photo: string | null;
  class_name: string;
  section_name: string;
  session_name: string;
}

const API_BASE = "http://192.168.68.100"; // same as in api.ts

export default function StudentsScreen() {
  const { user } = useAuth();
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [selectedCS, setSelectedCS] = useState<ClassSection | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSections, setLoadingSections] = useState(true);

  useEffect(() => {
    fetchClassSections();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(
          (s) =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
            s.roll_number.includes(q),
        ),
      );
    }
  }, [searchQuery, students]);

  const fetchClassSections = async () => {
    setLoadingSections(true);
    try {
      const res = await api.get(
        `/routine/routines/?teacher=${user?.teacher_id}`,
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
      if (unique.length > 0) {
        fetchStudents(unique[0]);
      }
    } catch {
      Alert.alert("Error", "Could not load your sections");
    } finally {
      setLoadingSections(false);
    }
  };

  const fetchStudents = async (cs: ClassSection) => {
    setSelectedCS(cs);
    setSearchQuery("");
    setLoading(true);
    try {
      const res = await api.get(
        `/students/?school_class=${cs.classId}&section=${cs.sectionId}`,
      );
      const list = res.data.results || res.data;
      setStudents(list);
      setFilteredStudents(list);
    } catch {
      Alert.alert("Error", "Could not load students");
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (photo: string | null) => {
    if (!photo) return null;
    if (photo.startsWith("http")) return photo;
    return `${API_BASE}${photo}`;
  };

  const renderStudent = ({ item, index }: { item: Student; index: number }) => (
    <TouchableOpacity
      style={styles.studentCard}
      onPress={() => router.push(`/student/${item.id}` as any)}
    >
      {/* Photo */}
      <View style={styles.photoContainer}>
        {item.photo ? (
          <Image
            source={{ uri: getPhotoUrl(item.photo) || "" }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoInitial}>
              {item.first_name[0]?.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.studentMeta}>Roll: {item.roll_number}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.class_name}</Text>
          </View>
          <View style={[styles.badge, styles.badgeSection]}>
            <Text style={[styles.badgeText, styles.badgeTextSection]}>
              Section {item.section_name}
            </Text>
          </View>
        </View>
      </View>

      {/* Index */}
      <View style={styles.indexBox}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Section Chips */}
      {loadingSections ? (
        <ActivityIndicator color="#1e3a8a" style={{ padding: 16 }} />
      ) : (
        <View style={styles.sectionBar}>
          <FlatList
            horizontal
            data={classSections}
            keyExtractor={(item) => `${item.classId}-${item.sectionId}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.sectionChip,
                  selectedCS?.sectionId === item.sectionId &&
                    selectedCS?.classId === item.classId &&
                    styles.sectionChipActive,
                ]}
                onPress={() => fetchStudents(item)}
              >
                <Text
                  style={[
                    styles.sectionChipText,
                    selectedCS?.sectionId === item.sectionId &&
                      selectedCS?.classId === item.classId &&
                      styles.sectionChipTextActive,
                  ]}
                >
                  {item.className} — {item.sectionName}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or roll..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Student Count */}
      {!loading && students.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {filteredStudents.length} of {students.length} students
          </Text>
        </View>
      )}

      {/* Student List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : filteredStudents.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? "No results found" : "No students found"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `No students match "${searchQuery}"`
              : "No students enrolled in this section"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStudent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  sectionBar: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionChipActive: {
    backgroundColor: "#1e3a8a",
    borderColor: "#1e3a8a",
  },
  sectionChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  sectionChipTextActive: {
    color: "#fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  countBar: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  countText: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600",
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
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  studentCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  photoContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "#e5e7eb",
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
    fontSize: 20,
    fontWeight: "700",
  },
  studentInfo: {
    flex: 1,
    gap: 3,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  studentMeta: {
    fontSize: 12,
    color: "#6b7280",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  badge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSection: {
    backgroundColor: "#f0fdf4",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1e3a8a",
  },
  badgeTextSection: {
    color: "#16a34a",
  },
  indexBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  indexText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9ca3af",
  },
});
