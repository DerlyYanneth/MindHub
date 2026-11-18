import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import CourseCard from "../../components/CourseCard";
import EmptyState from "../../components/EmptyState";
import { CATEGORIES } from "../../constants/categories";
import { COLORS } from "../../constants/colors";
import { getCourses } from "../../services/courseService";

function getCategoryName(category) {
  if (typeof category === "string") return category;
  return category?.label || category?.name || category?.title || "";
}

export default function CoursesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const numColumns =
    width >= 1440 ? 4 : width >= 1000 ? 3 : width >= 600 ? 2 : 2;
  const pageWidth = width >= 1440 ? 1980 : width >= 1000 ? 1120 : width;

  const categoryOptions = useMemo(() => {
    const names = (Array.isArray(CATEGORIES) ? CATEGORIES : [])
      .map(getCategoryName)
      .filter(Boolean);

    return ["Todos", ...new Set(names.filter((name) => name !== "Todos"))];
  }, []);

  const loadCourses = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result = await getCourses();
      setCourses(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Error al cargar los cursos:", err);
      setCourses([]);
      setError("No fue posible cargar los cursos. Intenta nuevamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return courses.filter((course) => {
      const title = String(course.title || course.name || "").toLowerCase();
      const description = String(course.description || "").toLowerCase();
      const category = String(course.category || "").toLowerCase();
      const instructor =
        typeof course.instructor === "string"
          ? course.instructor.toLowerCase()
          : String(
              course.instructor?.name || course.instructorName || "",
            ).toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        category.includes(normalizedSearch) ||
        instructor.includes(normalizedSearch);

      const matchesCategory =
        selectedCategory === "Todos" ||
        category === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [courses, search, selectedCategory]);

  const openCourse = useCallback(
    (course) => {
      if (!course?.id) return;
      router.push({
        pathname: "/tabs/course-detail",
        params: { id: String(course.id) },
      });
    },
    [router],
  );

  const renderCourse = useCallback(
    ({ item }) => (
      <View style={styles.courseCell}>
        <CourseCard course={item} onPress={() => openCourse(item)} />
      </View>
    ),
    [openCourse],
  );

  const listHeader = (
    <View style={styles.headerContent}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}>
          <Ionicons name="school-outline" size={24} color={COLORS.primary} />
        </View>

        <View style={styles.headingText}>
          <Text style={styles.heading}>Explora los cursos</Text>
          <Text style={styles.subtitle}>
            Aprende algo nuevo a tu propio ritmo.
          </Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={20}
          color={COLORS.textSecondary}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cursos, temas o instructores..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          accessibilityLabel="Buscar cursos"
        />

        {search.length > 0 && (
          <Ionicons
            name="close-circle"
            size={20}
            color={COLORS.textSecondary}
            onPress={() => setSearch("")}
          />
        )}
      </View>

      <FlatList
        horizontal
        data={categoryOptions}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        renderItem={({ item }) => {
          const selected = selectedCategory === item;

          return (
            <Text
              accessibilityRole="button"
              onPress={() => setSelectedCategory(item)}
              style={[
                styles.categoryChip,
                selected && styles.categoryChipSelected,
              ]}
            >
              {item}
            </Text>
          );
        }}
      />

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === "Todos" ? "Todos los cursos" : selectedCategory}
        </Text>
        {!loading && (
          <Text style={styles.resultsCount}>
            {filteredCourses.length}{" "}
            {filteredCourses.length === 1 ? "curso" : "cursos"}
          </Text>
        )}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={() => loadCourses()}>
            Reintentar
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando cursos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        key={`courses-${numColumns}`}
        data={filteredCourses}
        keyExtractor={(item, index) => String(item.id || index)}
        renderItem={renderCourse}
        numColumns={numColumns}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            title="No encontramos cursos"
            message={
              search || selectedCategory !== "Todos"
                ? "Prueba con otra búsqueda o categoría."
                : "Los cursos aparecerán aquí cuando estén disponibles."
            }
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadCourses(true)}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { maxWidth: pageWidth, alignSelf: "center", width: "100%" },
          filteredCourses.length === 0 && styles.emptyList,
        ]}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background || "#F6F8FC",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },
  headerContent: {
    width: "100%",
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  headingIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft || "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headingText: {
    flex: 1,
  },
  heading: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white || "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    outlineStyle: "none",
  },
  categories: {
    gap: 9,
    paddingBottom: 20,
  },
  categoryChip: {
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white || "#FFFFFF",
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    color: "#FFFFFF",
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  resultsCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  columnWrapper: {
    gap: 16,
    alignItems: "stretch",
  },
  courseCell: {
    flex: 1,
    minWidth: 0,
  },
  emptyList: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background || "#F6F8FC",
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
  },
  errorBox: {
    backgroundColor: "#FFF1F0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: "#B42318",
    fontSize: 13,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: "700",
    marginTop: 8,
  },
});
