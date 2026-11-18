import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
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

import EmptyState from "../../components/EmptyState";
import ProgressBar from "../../components/ProgressBar";
import { COLORS, RADIUS, SPACING } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import {
  cancelCourseEnrollment,
  getEnrolledCourses,
  getUserCourseProgress,
} from "../../services/enrollmentService";

export default function MyCourses() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const numColumns = width >= 1440 ? 3 : width >= 1000 ? 2 : 1;
  const pageWidth = width >= 1440 ? 1980 : width >= 1000 ? 1120 : width;
  const horizontalPadding = width < 600 ? 12 : 24;
  const columnGap = numColumns > 1 ? 16 : 0;

  const cardWidth = Math.max(
    0,
    (pageWidth - horizontalPadding * 2 - columnGap * (numColumns - 1)) /
      numColumns,
  );

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const formatProgress = (value) => {
    const numericValue = Number(value) || 0;
    const normalized = numericValue > 1 ? numericValue / 100 : numericValue;

    return Math.max(0, Math.min(normalized, 1));
  };

  const load = useCallback(
    async (showLoader = true) => {
      if (!user?.uid) {
        setCourses([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (showLoader) setLoading(true);

        setLoadError(false);

        const data = await getEnrolledCourses(user.uid);
        const enrolledCourses = Array.isArray(data) ? data : [];

        const coursesWithProgress = await Promise.all(
          enrolledCourses.map(async (course) => {
            let progress = course.progress || 0;

            try {
              progress = await getUserCourseProgress(user.uid, course.id);
            } catch (error) {
              console.error(
                `Error obteniendo progreso del curso ${course.id}:`,
                error,
              );
            }

            return { ...course, progress };
          }),
        );

        setCourses(coursesWithProgress);
      } catch (error) {
        console.error("Error cargando mis cursos:", error);
        setLoadError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.uid],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(false);
  }, [load]);

  const performCancel = async (course) => {
    if (!user?.uid || !course?.id) return;

    setCancellingId(course.id);

    try {
      await cancelCourseEnrollment(user.uid, course.id);

      setCourses((current) => current.filter((item) => item.id !== course.id));

      if (Platform.OS === "web") {
        globalThis.alert?.("La inscripción al curso fue anulada.");
      } else {
        Alert.alert(
          "Inscripción anulada",
          "El curso se retiró de tu biblioteca.",
        );
      }
    } catch (error) {
      console.error("Error anulando curso:", error);

      if (Platform.OS === "web") {
        globalThis.alert?.(
          error.message || "No fue posible anular la inscripción.",
        );
      } else {
        Alert.alert(
          "No se pudo anular",
          error.message || "Inténtalo nuevamente.",
        );
      }
    } finally {
      setCancellingId(null);
    }
  };

  const confirmCancel = (course) => {
    const message = `¿Deseas anular tu inscripción a "${course.title || "este curso"}"? También se eliminará el progreso guardado de este curso.`;

    if (Platform.OS === "web") {
      if (globalThis.confirm?.(message)) {
        performCancel(course);
      }
      return;
    }

    Alert.alert("Anular inscripción", message, [
      { text: "Conservar curso", style: "cancel" },
      {
        text: "Anular inscripción",
        style: "destructive",
        onPress: () => performCancel(course),
      },
    ]);
  };

  const completedCount = courses.filter(
    (course) => formatProgress(course.progress) >= 1,
  ).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tu biblioteca...</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="cloud-offline-outline"
          size={44}
          color={COLORS.primary}
        />
        <Text style={styles.errorTitle}>No pudimos cargar tus cursos</Text>
        <Text style={styles.loadingText}>
          Comprueba tu conexión e inténtalo de nuevo.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        key={`my-course-grid-${numColumns}`}
        data={courses}
        numColumns={numColumns}
        keyExtractor={(item) => String(item.id)}
        columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => {
          const progress = formatProgress(item.progress);
          const completed = progress >= 1;
          const isCancelling = cancellingId === item.id;

          return (
            <View
              style={[
                styles.courseCard,
                { width: cardWidth },
                numColumns === 1 && styles.courseCardSingle,
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.courseMain}
                onPress={() => router.push(`/tabs/course-detail?id=${item.id}`)}
              >
                <View
                  style={[
                    styles.imageContainer,
                    numColumns === 1 && styles.imageContainerSingle,
                  ]}
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons
                        name="book-outline"
                        size={36}
                        color={COLORS.primary}
                      />
                      <Text style={styles.placeholderText}>MindHub</Text>
                    </View>
                  )}

                  <View style={styles.playBadge}>
                    <Ionicons
                      name={completed ? "checkmark" : "play"}
                      size={17}
                      color="#FFFFFF"
                    />
                  </View>

                  {completed ? (
                    <View style={styles.completedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={15}
                        color="#15803D"
                      />
                      <Text style={styles.completedText}>Completado</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardInfo}>
                  <View style={styles.cardTopLine}>
                    <Text style={styles.category} numberOfLines={1}>
                      {item.category || "Creatividad"}
                    </Text>
                    <Text style={styles.level} numberOfLines={1}>
                      {item.level || "Todos los niveles"}
                    </Text>
                  </View>

                  <Text style={styles.courseTitle} numberOfLines={2}>
                    {item.title || "Curso sin título"}
                  </Text>

                  <View style={styles.metaItem}>
                    <Ionicons
                      name="time-outline"
                      size={17}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.duration || "Duración por definir"}
                    </Text>
                  </View>

                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Tu progreso</Text>
                    <Text style={styles.progressValue}>
                      {Math.round(progress * 100)}%
                    </Text>
                  </View>

                  <ProgressBar progress={progress} />

                  <View style={styles.cardFooter}>
                    <Text style={styles.continueText}>
                      {completed ? "Repasar curso" : "Continuar aprendiendo"}
                    </Text>
                    <Ionicons
                      name="arrow-forward-circle"
                      size={23}
                      color={COLORS.primary}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  isCancelling && styles.disabledButton,
                ]}
                onPress={() => confirmCancel(item)}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#D94D67" />
                ) : (
                  <Ionicons
                    name="close-circle-outline"
                    size={19}
                    color="#D94D67"
                  />
                )}
                <Text style={styles.cancelButtonText}>
                  {isCancelling ? "Anulando..." : "Anular inscripción"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListHeaderComponent={
          <View
            style={[
              styles.pageHeader,
              { width: pageWidth - horizontalPadding * 2 },
            ]}
          >
            <View style={styles.headerTop}>
              <View style={styles.headerIcon}>
                <Ionicons name="book" size={27} color={COLORS.primary} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.eyebrow}>TU ESPACIO DE APRENDIZAJE</Text>
                <Text style={styles.header}>Mis cursos</Text>
                <Text style={styles.subheader}>
                  Continúa aprendiendo y avanza a tu propio ritmo.
                </Text>
              </View>
            </View>

            <View style={styles.summaryPanel}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="library-outline"
                  size={25}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryNumber}>{courses.length}</Text>
                <Text style={styles.summaryLabel}>
                  {courses.length === 1
                    ? "curso en tu biblioteca"
                    : "cursos en tu biblioteca"}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryNumber}>{completedCount}</Text>
                <Text style={styles.summaryLabel}>completados</Text>
              </View>
            </View>

            <View style={styles.catalogHeader}>
              <View>
                <Text style={styles.catalogTitle}>Tu biblioteca</Text>
                <Text style={styles.catalogSubtitle}>
                  Selecciona un curso para continuar.
                </Text>
              </View>
              <View style={styles.gridIcon}>
                <Ionicons
                  name="grid-outline"
                  size={21}
                  color={COLORS.primary}
                />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View
            style={[
              styles.emptyContainer,
              { width: pageWidth - horizontalPadding * 2 },
            ]}
          >
            <EmptyState
              icon="book-outline"
              title="Aún no tienes cursos"
              message="Explora nuestro catálogo y comienza a desarrollar nuevas habilidades."
              actionLabel="Explorar cursos"
              onAction={() => router.push("/tabs/courses")}
            />
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: horizontalPadding },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.screenBackground || COLORS.background || "#F7F8FC",
  },
  listContent: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 110,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.screenBackground || COLORS.background || "#F7F8FC",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary || "#7B8494",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  errorTitle: {
    color: COLORS.textPrimary || "#1F2937",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 20,
  },
  retryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  pageHeader: { alignSelf: "center" },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 22,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg || 16,
    backgroundColor: COLORS.primarySoft || "#EEEEFF",
    borderWidth: 1,
    borderColor: COLORS.border || "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  headerInfo: { flex: 1 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.primaryDark || COLORS.primary,
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  header: {
    fontSize: 31,
    fontWeight: "900",
    color: COLORS.textPrimary || "#1F2937",
  },
  subheader: {
    fontSize: 15,
    color: COLORS.textSecondary || "#7B8494",
    marginTop: 5,
    lineHeight: 22,
  },
  summaryPanel: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface || "#FFFFFF",
    borderRadius: RADIUS.xl || 22,
    borderWidth: 1,
    borderColor: COLORS.border || "#E5E7EB",
    padding: 19,
    marginBottom: 29,
  },
  summaryIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft || "#EEEEFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  summaryInfo: { flex: 1 },
  summaryNumber: {
    color: COLORS.textPrimary || "#1F2937",
    fontSize: 26,
    fontWeight: "900",
  },
  summaryLabel: {
    color: COLORS.textSecondary || "#7B8494",
    fontSize: 13,
    marginTop: 3,
  },
  summaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: COLORS.border || "#E5E7EB",
    marginHorizontal: 18,
  },
  catalogHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  catalogTitle: {
    color: COLORS.textPrimary || "#1F2937",
    fontSize: 23,
    fontWeight: "900",
  },
  catalogSubtitle: {
    color: COLORS.textSecondary || "#7B8494",
    fontSize: 14,
    marginTop: 4,
  },
  gridIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft || "#EEEEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  gridRow: { width: "100%", justifyContent: "flex-start", gap: 16 },
  courseCard: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: COLORS.surface || "#FFFFFF",
    borderRadius: RADIUS.lg || 18,
    marginBottom: SPACING.md || 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderLight || "#EAECF2",
    shadowColor: COLORS.shadow || "#26315C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  courseMain: { flex: 1 },
  courseCardSingle: { flexDirection: "row", alignItems: "stretch" },
  imageContainer: {
    width: "100%",
    height: 165,
    backgroundColor: COLORS.primarySoft || "#EEEEFF",
    position: "relative",
  },
  imageContainerSingle: { width: 190, height: "auto", minHeight: 230 },
  thumbnail: { width: "100%", height: "100%" },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft || "#EEEEFF",
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 6,
  },
  playBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  completedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
    gap: 4,
  },
  completedText: { color: "#15803D", fontSize: 11, fontWeight: "900" },
  cardInfo: { padding: 16, flex: 1, minWidth: 0 },
  cardTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
  },
  category: {
    flex: 1,
    color: COLORS.primaryDark || COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  level: {
    flexShrink: 1,
    color: COLORS.textSecondary || "#7B8494",
    fontSize: 12,
    textAlign: "right",
  },
  courseTitle: {
    color: COLORS.textPrimary || "#1F2937",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    minHeight: 48,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 7,
  },
  metaText: {
    flex: 1,
    color: COLORS.textSecondary || "#7B8494",
    fontSize: 14,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 8,
  },
  progressLabel: {
    color: COLORS.textSecondary || "#7B8494",
    fontSize: 13,
    fontWeight: "700",
  },
  progressValue: {
    color: COLORS.primaryDark || COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight || "#EAECF2",
    marginTop: 15,
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  continueText: {
    flex: 1,
    color: COLORS.primaryDark || COLORS.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  cancelButton: {
    minHeight: 46,
    margin: 12,
    borderRadius: 11,
    backgroundColor: "#FFF0F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelButtonText: { color: "#D94D67", fontSize: 14, fontWeight: "900" },
  disabledButton: { opacity: 0.6 },
  emptyContainer: { alignSelf: "center" },
});
