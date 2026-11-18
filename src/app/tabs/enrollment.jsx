import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import {
  cancelCourseEnrollment,
  cancelWorkshopEnrollment,
  getEnrolledCourses,
  getEnrolledWorkshops,
} from "../../services/enrollmentService";

const FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Cursos", value: "course" },
  { label: "Talleres", value: "workshop" },
];

export default function EnrollmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [courses, setCourses] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const loadEnrollments = useCallback(
    async (isRefresh = false) => {
      if (!user?.uid) {
        setCourses([]);
        setWorkshops([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(false);

        const [courseResults, workshopResults] = await Promise.all([
          getEnrolledCourses(user.uid),
          getEnrolledWorkshops(user.uid),
        ]);

        setCourses(Array.isArray(courseResults) ? courseResults : []);
        setWorkshops(Array.isArray(workshopResults) ? workshopResults : []);

        return true;
      } catch (err) {
        console.error("Error al cargar las inscripciones:", err);
        setError(true);
        return false;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.uid],
  );

  useFocusEffect(
    useCallback(() => {
      loadEnrollments();
    }, [loadEnrollments]),
  );

  const items = useMemo(() => {
    const courseItems = courses.map((course) => ({
      ...course,
      id: course.id,
      type: "course",
    }));

    const workshopItems = workshops.map((workshop) => ({
      ...workshop,
      id: workshop.id,
      type: "workshop",
    }));

    const allItems = [...courseItems, ...workshopItems];

    if (filter === "course") {
      return allItems.filter((item) => item.type === "course");
    }

    if (filter === "workshop") {
      return allItems.filter((item) => item.type === "workshop");
    }

    return allItems;
  }, [courses, workshops, filter]);

  const openItem = (item) => {
    router.push({
      pathname:
        item.type === "course"
          ? "/tabs/course-detail"
          : "/tabs/workshop-detail",
      params: { id: item.id },
    });
  };

  const performCancel = async (item) => {
    if (!user?.uid || !item?.id || cancellingId) return;

    const key = `${item.type}-${item.id}`;
    setCancellingId(key);

    try {
      if (item.type === "course") {
        await cancelCourseEnrollment(user.uid, item.id);
      } else {
        await cancelWorkshopEnrollment(user.uid, item.id);
      }

      // Actualiza la lista después de confirmar la cancelación en Firestore.
      const refreshed = await loadEnrollments(true);

      if (!refreshed) {
        if (Platform.OS === "web") {
          globalThis.alert?.(
            "La inscripción se anuló, pero no se pudo actualizar la lista. Intenta recargar.",
          );
        } else {
          Alert.alert(
            "Inscripción anulada",
            "La inscripción se anuló, pero no se pudo actualizar la lista. Intenta recargar.",
          );
        }
        return;
      }

      if (Platform.OS === "web") {
        globalThis.alert?.("La inscripción se anuló correctamente.");
      } else {
        Alert.alert(
          "Inscripción anulada",
          "Se actualizó tu registro correctamente.",
        );
      }
    } catch (err) {
      console.error("Error anulando inscripción:", err);

      const message = err?.message || "No fue posible anular la inscripción.";

      if (Platform.OS === "web") {
        globalThis.alert?.(message);
      } else {
        Alert.alert("No se pudo anular", message);
      }
    } finally {
      setCancellingId(null);
    }
  };

  const confirmCancel = (item) => {
    const typeLabel = item.type === "course" ? "el curso" : "el taller";
    const itemTitle = item.title || item.name || "";
    const message = `¿Estás seguro de que deseas anular tu inscripción a ${typeLabel} "${itemTitle}"?`;

    if (Platform.OS === "web") {
      if (globalThis.confirm?.(message)) {
        performCancel(item);
      }
      return;
    }

    Alert.alert("Anular inscripción", message, [
      { text: "Conservar inscripción", style: "cancel" },
      {
        text: "Anular inscripción",
        style: "destructive",
        onPress: () => performCancel(item),
      },
    ]);
  };

  const renderEmpty = () => {
    if (loading) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={38} color="#8B7CF6" />
          <Text style={styles.emptyTitle}>
            No se pudieron cargar las inscripciones
          </Text>
          <Text style={styles.emptyDescription}>
            Comprueba tu conexión e inténtalo nuevamente.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadEnrollments()}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={filter === "all" ? "library-outline" : "filter-outline"}
          size={40}
          color="#8B7CF6"
        />
        <Text style={styles.emptyTitle}>
          {filter === "all"
            ? "Aún no tienes inscripciones"
            : `Todavía no tienes ${
                filter === "course" ? "cursos" : "talleres"
              } inscritos`}
        </Text>
        <Text style={styles.emptyDescription}>
          Explora los contenidos disponibles y encuentra una actividad para
          comenzar tu aprendizaje.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.push("/tabs/courses")}
        >
          <Text style={styles.retryButtonText}>Explorar cursos</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary || "#8B7CF6"} />
        <Text style={styles.loadingText}>Cargando tus inscripciones...</Text>
      </View>
    );
  }

  const columns = width >= 1100 ? 3 : width >= 650 ? 2 : 1;

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => (
          <EnrollmentCard
            item={item}
            onPress={() => openItem(item)}
            onCancel={() => confirmCancel(item)}
            cancelling={cancellingId === `${item.type}-${item.id}`}
          />
        )}
        numColumns={columns}
        key={`${columns}-columns`}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: width >= 1100 ? 36 : 20 },
          items.length === 0 && styles.listContentEmpty,
        ]}
        columnWrapperStyle={
          items.length > 0 && columns > 1 ? styles.columnWrapper : undefined
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>MI APRENDIZAJE</Text>
            <Text style={styles.title}>Mis inscripciones</Text>
            <Text style={styles.subtitle}>
              Encuentra y continúa las actividades a las que te has inscrito.
            </Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="library-outline" size={27} color="#6555D9" />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryNumber}>
                  {courses.length + workshops.length}
                </Text>
                <Text style={styles.summaryLabel}>Actividades inscritas</Text>
              </View>
              <View style={styles.summaryBreakdown}>
                <Text style={styles.summaryBreakdownText}>
                  {courses.length} {courses.length === 1 ? "curso" : "cursos"}
                </Text>
                <Text style={styles.summaryBreakdownText}>
                  {workshops.length}{" "}
                  {workshops.length === 1 ? "taller" : "talleres"}
                </Text>
              </View>
            </View>

            <View style={styles.filterHeader}>
              <Text style={styles.sectionTitle}>Tus actividades</Text>
              <TouchableOpacity
                onPress={() => loadEnrollments(true)}
                style={styles.refreshButton}
                disabled={refreshing}
              >
                <Ionicons name="refresh-outline" size={21} color="#6555D9" />
              </TouchableOpacity>
            </View>

            <View style={styles.filters}>
              {FILTERS.map((filterItem) => {
                const selected = filter === filterItem.value;

                return (
                  <TouchableOpacity
                    key={filterItem.value}
                    onPress={() => setFilter(filterItem.value)}
                    style={[
                      styles.filterButton,
                      selected && styles.filterButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        selected && styles.filterTextSelected,
                      ]}
                    >
                      {filterItem.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEnrollments(true)}
            tintColor={COLORS.primary || "#8B7CF6"}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function EnrollmentCard({ item, onPress, onCancel, cancelling }) {
  const isCourse = item.type === "course";
  const imageUrl = item.imageUrl || item.image || item.thumbnail || null;
  const title = item.title || item.name || (isCourse ? "Curso" : "Taller");
  const description =
    item.description ||
    item.objective ||
    "Consulta los detalles de esta actividad.";

  const progressValue = Number(item.progress);
  const hasProgress = isCourse && Number.isFinite(progressValue);
  const progress = hasProgress
    ? Math.max(
        0,
        Math.min(100, progressValue > 1 ? progressValue : progressValue * 100),
      )
    : 0;

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        ) : (
          <View
            style={[
              styles.cardImagePlaceholder,
              { backgroundColor: isCourse ? "#EAF2FF" : "#E5F7F3" },
            ]}
          >
            <Ionicons
              name={isCourse ? "book-outline" : "color-palette-outline"}
              size={39}
              color={isCourse ? "#4F83E5" : "#159A8C"}
            />
          </View>
        )}

        <View style={styles.cardContent}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: isCourse ? "#EAF2FF" : "#E5F7F3" },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                { color: isCourse ? "#356AC4" : "#117E73" },
              ]}
            >
              {isCourse ? "CURSO" : "TALLER"}
            </Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={3}>
            {description}
          </Text>

          {hasProgress ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Progreso</Text>
                <Text style={styles.progressValue}>
                  {Math.round(progress)}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
            </View>
          ) : null}

          {item.date ? (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color="#89859A" />
              <Text style={styles.dateText}>{String(item.date)}</Text>
            </View>
          ) : null}

          <View style={styles.cardFooter}>
            <Text style={styles.detailsText}>Ver detalles</Text>
            <Ionicons name="arrow-forward" size={18} color="#6555D9" />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.cancelContainer}>
        <TouchableOpacity
          style={[styles.cancelButton, cancelling && styles.disabledButton]}
          onPress={onCancel}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color="#D94D67" />
          ) : (
            <Ionicons name="close-circle-outline" size={19} color="#D94D67" />
          )}
          <Text style={styles.cancelButtonText}>
            {cancelling ? "Anulando..." : "Anular inscripción"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: "100%", backgroundColor: "#F7F5FC" },
  listContent: {
    width: "100%",
    alignSelf: "stretch",
    paddingTop: 28,
    paddingBottom: 40,
    flexGrow: 1,
  },
  listContentEmpty: { flexGrow: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F5FC",
  },
  loadingText: { color: "#77738A", fontSize: 15, marginTop: 12 },
  header: { width: "100%", marginBottom: 22 },
  eyebrow: {
    color: "#8B7CF6",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  title: { color: "#29273A", fontSize: 32, fontWeight: "900" },
  subtitle: { color: "#77738A", fontSize: 15, lineHeight: 23, marginTop: 7 },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEDF6",
    borderRadius: 20,
    padding: 20,
    marginTop: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  summaryIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTextContainer: { flex: 1 },
  summaryNumber: { color: "#29273A", fontSize: 28, fontWeight: "900" },
  summaryLabel: { color: "#77738A", fontSize: 13, marginTop: 2 },
  summaryBreakdown: { alignItems: "flex-end", gap: 5 },
  summaryBreakdownText: {
    color: "#77738A",
    fontSize: 13,
    fontWeight: "700",
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
  },
  sectionTitle: { color: "#29273A", fontSize: 21, fontWeight: "900" },
  refreshButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0EDFF",
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 15 },
  filterButton: {
    borderWidth: 1,
    borderColor: "#E7E3F1",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 19,
    paddingVertical: 11,
  },
  filterButtonSelected: { backgroundColor: "#6555D9", borderColor: "#6555D9" },
  filterText: { color: "#77738A", fontSize: 14, fontWeight: "700" },
  filterTextSelected: { color: "#FFFFFF" },
  columnWrapper: { gap: 18, alignItems: "stretch" },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EFEDF6",
    marginBottom: 18,
  },
  cardImage: { width: "100%", height: 170, backgroundColor: "#F0EDFF" },
  cardImagePlaceholder: {
    width: "100%",
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { padding: 18 },
  typeBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  typeBadgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  cardTitle: {
    color: "#29273A",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 25,
  },
  cardDescription: {
    color: "#77738A",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    minHeight: 40,
  },
  progressContainer: { marginTop: 17 },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: { color: "#77738A", fontSize: 13, fontWeight: "600" },
  progressValue: { color: "#6555D9", fontSize: 13, fontWeight: "900" },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: "#EEEAF8",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#8B7CF6",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 13,
  },
  dateText: { color: "#89859A", fontSize: 13, flex: 1 },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F0EDF6",
    marginTop: 17,
    paddingTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailsText: { color: "#6555D9", fontSize: 14, fontWeight: "900" },
  cancelContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F0EDF6",
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  cancelButton: {
    minHeight: 43,
    borderRadius: 11,
    backgroundColor: "#FFF0F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelButtonText: { color: "#D94D67", fontSize: 14, fontWeight: "800" },
  disabledButton: { opacity: 0.6 },
  emptyContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 55,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEDF6",
    borderRadius: 20,
  },
  emptyTitle: {
    color: "#29273A",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 15,
  },
  emptyDescription: {
    color: "#77738A",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 460,
    marginTop: 9,
  },
  retryButton: {
    backgroundColor: "#6555D9",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginTop: 20,
  },
  retryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
});
