import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import AdminHeader from "../../components/AdminHea";
import { getCourses } from "../../services/courseService";
import { getAllUsers } from "../../services/userService";
import {
  getWorkshops,
  getWorkshopStudents,
} from "../../services/workshopService";

const C = {
  primary: "#5B4BDB",
  light: "#EEEAFE",
  background: "#F6F7FB",
  surface: "#FFFFFF",
  text: "#20223A",
  muted: "#777B91",
  border: "#E8E9F2",
  green: "#159A75",
  orange: "#E88B32",
  red: "#D94D67",
};

const FILTERS = [
  { label: "Todas", value: "all", icon: "apps-outline" },
  { label: "Cursos", value: "courses", icon: "book-outline" },
  { label: "Talleres", value: "workshops", icon: "color-palette-outline" },
];

function normalizeId(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    return String(value.id || value.courseId || value.uid || value.title || "");
  }

  return String(value);
}

function getUserCourseIds(user) {
  const enrolled = user?.enrolledCourses;

  if (Array.isArray(enrolled)) {
    return enrolled.map(normalizeId).filter(Boolean);
  }

  if (enrolled && typeof enrolled === "object") {
    return Object.keys(enrolled).filter((key) => enrolled[key]);
  }

  return [];
}

function getCourseStudents(course, users) {
  const courseId = normalizeId(course.id);
  const courseTitle = String(course.title || "")
    .trim()
    .toLowerCase();

  return users.filter((user) => {
    const userIds = getUserCourseIds(user);

    return userIds.some((id) => {
      if (courseId && id === courseId) return true;
      return courseTitle && id.trim().toLowerCase() === courseTitle;
    });
  });
}

function getDisplayName(user) {
  return (
    user?.name ||
    user?.displayName ||
    user?.fullName ||
    user?.email ||
    "Usuario"
  );
}

function getUserKey(user, index) {
  return String(user?.uid || user?.id || user?.email || index);
}

export default function AdminEnrollmentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 600;
  const isTablet = width >= 600 && width < 1000;
  const isWideScreen = width >= 1000;

  const horizontalPadding = isSmallScreen ? 14 : isTablet ? 24 : 32;

  const workshopId = Array.isArray(params.workshopId)
    ? params.workshopId[0]
    : params.workshopId;

  const workshopTitleParam = Array.isArray(params.workshopTitle)
    ? params.workshopTitle[0]
    : params.workshopTitle;

  const [workshops, setWorkshops] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [studentsByWorkshop, setStudentsByWorkshop] = useState({});
  const [activeFilter, setActiveFilter] = useState(
    workshopId ? "workshops" : "all",
  );
  const [expandedId, setExpandedId] = useState(
    workshopId ? `workshop-${workshopId}` : null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadEnrollments = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const [workshopResult, courseResult, userResult] = await Promise.all([
          getWorkshops(),
          getCourses(),
          getAllUsers(),
        ]);

        let workshopList = Array.isArray(workshopResult) ? workshopResult : [];
        const courseList = Array.isArray(courseResult) ? courseResult : [];
        const userList = Array.isArray(userResult) ? userResult : [];

        if (workshopId) {
          workshopList = workshopList.filter(
            (item) => String(item.id) === String(workshopId),
          );
        }

        const workshopResults = await Promise.all(
          workshopList.map(async (workshop) => {
            const students = await getWorkshopStudents(workshop.id);
            return [
              String(workshop.id),
              Array.isArray(students) ? students : [],
            ];
          }),
        );

        setWorkshops(workshopList);
        setCourses(courseList);
        setUsers(userList);
        setStudentsByWorkshop(Object.fromEntries(workshopResults));
      } catch (err) {
        console.error("Error cargando inscripciones:", err);
        setError(
          "No se pudieron cargar las inscripciones. Comprueba tu conexión e inténtalo de nuevo.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workshopId],
  );

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const courseItems = useMemo(
    () =>
      courses.map((course) => ({
        ...course,
        id: String(course.id),
        enrollmentType: "course",
        participants: getCourseStudents(course, users),
      })),
    [courses, users],
  );

  const workshopItems = useMemo(
    () =>
      workshops.map((workshop) => ({
        ...workshop,
        id: String(workshop.id),
        enrollmentType: "workshop",
        participants: studentsByWorkshop[String(workshop.id)] || [],
      })),
    [workshops, studentsByWorkshop],
  );

  const totalCourseEnrollments = courseItems.reduce(
    (total, course) => total + course.participants.length,
    0,
  );

  const totalWorkshopEnrollments = workshopItems.reduce(
    (total, workshop) => total + workshop.participants.length,
    0,
  );

  const totalEnrollments = totalCourseEnrollments + totalWorkshopEnrollments;

  const displayedItems = useMemo(() => {
    if (activeFilter === "courses") return courseItems;
    if (activeFilter === "workshops") return workshopItems;
    return [...courseItems, ...workshopItems];
  }, [activeFilter, courseItems, workshopItems]);

  const renderParticipant = (participant, index) => {
    const name = getDisplayName(participant);
    const email = participant?.email || "Correo no disponible";

    return (
      <View key={getUserKey(participant, index)} style={styles.studentRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.trim().charAt(0).toUpperCase() || "U"}
          </Text>
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{name}</Text>
          <Text style={styles.studentEmail}>{email}</Text>
        </View>

        <View style={styles.numberBadge}>
          <Text style={styles.numberBadgeText}>{index + 1}</Text>
        </View>
      </View>
    );
  };

  const renderEnrollmentItem = ({ item }) => {
    const expandedKey = `${item.enrollmentType}-${item.id}`;
    const expanded = expandedId === expandedKey;
    const isCourse = item.enrollmentType === "course";
    const participants = item.participants || [];

    return (
      <View style={[styles.itemCard, isWideScreen && styles.itemCardWide]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.itemHeader}
          onPress={() => setExpandedId(expanded ? null : expandedKey)}
        >
          <View
            style={[
              styles.itemIcon,
              { backgroundColor: isCourse ? C.light : "#FFF0DF" },
            ]}
          >
            <Ionicons
              name={isCourse ? "book-outline" : "color-palette-outline"}
              size={23}
              color={isCourse ? C.primary : C.orange}
            />
          </View>

          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>
              {item.title ||
                (isCourse ? "Curso sin título" : "Taller sin título")}
            </Text>

            <Text style={styles.itemMeta}>
              {item.instructor || "Instructor no asignado"}
            </Text>

            <View style={styles.countRow}>
              <Ionicons name="people-outline" size={14} color={C.green} />
              <Text style={styles.countText}>
                {participants.length} inscrito
                {participants.length === 1 ? "" : "s"}
              </Text>

              {isCourse && item.level ? (
                <Text style={styles.metaTag}>· {item.level}</Text>
              ) : null}

              {!isCourse && Number(item.capacity) > 0 ? (
                <Text style={styles.metaTag}>· Cupos: {item.capacity}</Text>
              ) : null}
            </View>
          </View>

          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={C.muted}
          />
        </TouchableOpacity>

        {expanded ? (
          <View style={styles.participantList}>
            <View style={styles.listTitleRow}>
              <Text style={styles.listTitle}>
                {isCourse ? "Estudiantes inscritos" : "Participantes"}
              </Text>
              <Text style={styles.listCount}>{participants.length}</Text>
            </View>

            {participants.length === 0 ? (
              <View style={styles.emptyParticipants}>
                <Ionicons name="person-add-outline" size={28} color={C.muted} />
                <Text style={styles.emptyText}>
                  {isCourse
                    ? "No se encontraron estudiantes inscritos en este curso."
                    : "Todavía no hay personas inscritas en este taller."}
                </Text>
              </View>
            ) : (
              participants.map(renderParticipant)
            )}
          </View>
        ) : null}
      </View>
    );
  };

  const getEmptyTitle = () => {
    if (workshopId && activeFilter === "workshops") {
      return "No se encontró el taller";
    }
    if (activeFilter === "courses") return "No hay cursos";
    if (activeFilter === "workshops") return "No hay talleres";
    return "No hay actividades registradas";
  };

  const getEmptyDescription = () => {
    if (workshopId && activeFilter === "workshops") {
      return "El taller puede haber sido eliminado o el enlace ya no es válido.";
    }
    if (activeFilter === "courses") {
      return "Cuando existan cursos, aparecerán aquí para consultar sus inscripciones.";
    }
    if (activeFilter === "workshops") {
      return "Cuando existan talleres, aparecerán aquí para consultar sus participantes.";
    }
    return "Todavía no hay cursos ni talleres para mostrar.";
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <View style={styles.topHeader}>
        <AdminHeader active="enrollments" />
      </View>

      <View
        style={[styles.pageContainer, { paddingHorizontal: horizontalPadding }]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>

          <View style={styles.topBarText}>
            <Text style={styles.pageTitle}>Inscripciones</Text>
            <Text style={styles.pageSubtitle}>
              {workshopTitleParam || "Participantes de cursos y talleres"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => loadEnrollments(true)}
            accessibilityRole="button"
            accessibilityLabel="Actualizar inscripciones"
          >
            <Ionicons name="refresh-outline" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>

        <View
          style={[styles.summaryCard, isSmallScreen && styles.summaryCardSmall]}
        >
          <View style={styles.summaryIcon}>
            <Ionicons name="people" size={26} color={C.primary} />
          </View>

          <View style={styles.summaryInfo}>
            <Text style={styles.summaryValue}>{totalEnrollments}</Text>
            <Text style={styles.summaryLabel}>Inscripciones</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryInfo}>
            <Text style={styles.summaryValue}>{courses.length}</Text>
            <Text style={styles.summaryLabel}>Cursos</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryInfo}>
            <Text style={styles.summaryValue}>{workshops.length}</Text>
            <Text style={styles.summaryLabel}>Talleres</Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          {FILTERS.map((filter) => {
            const selected = activeFilter === filter.value;

            return (
              <TouchableOpacity
                key={filter.value}
                activeOpacity={0.8}
                style={[
                  styles.filterButton,
                  selected && styles.filterButtonActive,
                ]}
                onPress={() => {
                  setActiveFilter(filter.value);
                  setExpandedId(null);
                }}
              >
                <Ionicons
                  name={filter.icon}
                  size={17}
                  color={selected ? "#FFFFFF" : C.muted}
                />
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error ? (
          <TouchableOpacity
            style={styles.errorBox}
            onPress={() => loadEnrollments(true)}
          >
            <Ionicons name="alert-circle-outline" size={20} color={C.red} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>
              Cargando cursos, talleres e inscripciones...
            </Text>
          </View>
        ) : (
          <FlatList
            key={activeFilter}
            data={displayedItems}
            keyExtractor={(item) => `${item.enrollmentType}-${item.id}`}
            renderItem={renderEnrollmentItem}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={isWideScreen ? styles.columnWrapper : undefined}
            numColumns={isWideScreen ? 2 : 1}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadEnrollments(true)}
                tintColor={C.primary}
                colors={[C.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="clipboard-outline"
                    size={37}
                    color={C.primary}
                  />
                </View>

                <Text style={styles.emptyTitle}>{getEmptyTitle()}</Text>
                <Text style={styles.emptyText}>{getEmptyDescription()}</Text>

                {workshopId ? (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.replace("/admin/enrollments")}
                  >
                    <Text style={styles.primaryButtonText}>
                      Ver todas las inscripciones
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    backgroundColor: C.background,
  },

  topHeader: {
    width: "100%",
    flexShrink: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 100,
    elevation: 8,
  },

  // Ocupa todo el ancho disponible, sin límite máximo.
  pageContainer: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    alignSelf: "stretch",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 14,
    gap: 12,
  },

  backButton: {
    width: 43,
    height: 43,
    flexShrink: 0,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  topBarText: {
    flex: 1,
    minWidth: 0,
  },

  pageTitle: {
    color: C.text,
    fontSize: 21,
    fontWeight: "800",
  },

  pageSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 3,
  },

  refreshButton: {
    width: 43,
    height: 43,
    flexShrink: 0,
    backgroundColor: C.light,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryCard: {
    marginBottom: 17,
    padding: 18,
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  summaryCardSmall: {
    padding: 13,
    gap: 9,
  },

  summaryIcon: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: 15,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryInfo: {
    flex: 1,
    minWidth: 0,
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    color: C.text,
  },

  summaryLabel: {
    color: C.muted,
    fontSize: 11,
    marginTop: 3,
  },

  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: C.border,
  },

  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 16,
  },

  filterButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },

  filterButtonActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },

  filterText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "700",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  listContent: {
    paddingBottom: 35,
    gap: 12,
    flexGrow: 1,
  },

  columnWrapper: {
    gap: 14,
  },

  itemCard: {
    width: "100%",
    backgroundColor: C.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },

  itemCardWide: {
    flex: 1,
    minWidth: 0,
  },

  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    gap: 12,
  },

  itemIcon: {
    width: 47,
    height: 47,
    flexShrink: 0,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  itemInfo: {
    flex: 1,
    minWidth: 0,
  },

  itemTitle: {
    color: C.text,
    fontWeight: "800",
    fontSize: 15,
    flexShrink: 1,
  },

  itemMeta: {
    color: C.muted,
    fontSize: 12,
    marginTop: 4,
  },

  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 7,
    flexWrap: "wrap",
  },

  countText: {
    color: C.green,
    fontWeight: "700",
    fontSize: 11,
  },

  metaTag: {
    color: C.muted,
    fontSize: 11,
  },

  participantList: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 15,
    paddingBottom: 7,
  },

  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
  },

  listTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
  },

  listCount: {
    color: C.primary,
    backgroundColor: C.light,
    overflow: "hidden",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontWeight: "800",
    fontSize: 11,
  },

  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F6",
    gap: 10,
  },

  avatar: {
    width: 38,
    height: 38,
    flexShrink: 0,
    borderRadius: 13,
    backgroundColor: "#E7F7F1",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: C.green,
    fontWeight: "800",
    fontSize: 15,
  },

  studentInfo: {
    flex: 1,
    minWidth: 0,
  },

  studentName: {
    color: C.text,
    fontWeight: "700",
    fontSize: 13,
  },

  studentEmail: {
    color: C.muted,
    fontSize: 11,
    marginTop: 4,
  },

  numberBadge: {
    backgroundColor: "#F0F1F7",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  numberBadgeText: {
    color: C.muted,
    fontWeight: "700",
    fontSize: 11,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },

  loadingText: {
    color: C.muted,
    marginTop: 10,
    textAlign: "center",
  },

  emptyParticipants: {
    alignItems: "center",
    paddingVertical: 22,
    gap: 9,
  },

  emptyText: {
    color: C.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 400,
  },

  emptyState: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 24,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 8,
    textAlign: "center",
  },

  primaryButton: {
    backgroundColor: C.primary,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 13,
    marginTop: 18,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },

  errorBox: {
    marginBottom: 12,
    padding: 13,
    backgroundColor: "#FFF0F2",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  errorText: {
    flex: 1,
    color: C.red,
    fontSize: 12,
    lineHeight: 18,
  },

  retryText: {
    color: C.red,
    fontWeight: "800",
    fontSize: 12,
  },
});
