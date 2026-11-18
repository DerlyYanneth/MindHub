import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { logoutUser } from "../../services/authService";
import { getCoursesByInstructor } from "../../services/courseService";
import { getInstructorStudents } from "../../services/enrollmentService";
import { getWorkshopsByInstructor } from "../../services/workshopService";

const C = {
  primary: COLORS.instructor || "#E88B32",
  background: COLORS.background || "#F6F7FB",
  text: COLORS.textPrimary || "#20223A",
  muted: COLORS.textSecondary || "#777B91",
  border: "#E8E9F2",
  red: COLORS.danger || "#D94D67",
  green: "#159A75",
  purple: "#6555D9",
};

export default function InstructorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const isSmall = width < 600;
  const isWide = width >= 1100;

  const [courses, setCourses] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (refresh = false) => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const [courseData, workshopData, studentData] = await Promise.all([
          getCoursesByInstructor(user.uid),
          getWorkshopsByInstructor(user.uid),
          getInstructorStudents(user.uid),
        ]);

        setCourses(courseData || []);
        setWorkshops(workshopData || []);
        setStudents(studentData || []);
      } catch (err) {
        console.error("Error cargando el panel del instructor:", err);
        setError("No se pudo cargar toda la información. Intenta actualizar.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.uid],
  );

  useEffect(() => {
    load();
  }, [load]);

  const performLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutUser();
      router.replace("/auth/login");
    } catch (err) {
      console.error("Error cerrando sesión:", err);
      const message = "No fue posible cerrar la sesión. Inténtalo nuevamente.";

      if (Platform.OS === "web") {
        globalThis.alert?.(message);
      } else {
        Alert.alert("Error", message);
      }

      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (loggingOut) return;

    if (Platform.OS === "web") {
      performLogout();
      return;
    }

    Alert.alert("Cerrar sesión", "¿Deseas salir de MindHub?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: performLogout,
      },
    ]);
  };

  const stats = [
    {
      label: "Cursos asignados",
      value: courses.length,
      icon: "book-outline",
      color: C.purple,
      bg: "#EEEAFE",
    },
    {
      label: "Mis talleres",
      value: workshops.length,
      icon: "color-palette-outline",
      color: C.primary,
      bg: "#FFF0E0",
    },
    {
      label: "Estudiantes",
      value: students.length,
      icon: "people-outline",
      color: C.green,
      bg: "#DDF7EC",
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: isSmall ? 16 : isWide ? 38 : 25 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={undefined}
      >
        <View style={styles.topRow}>
          <View style={styles.heading}>
            <View style={styles.badge}>
              <Ionicons name="school-outline" size={15} color={C.primary} />
              <Text style={styles.badgeText}>PANEL DEL INSTRUCTOR</Text>
            </View>

            <Text style={[styles.title, { fontSize: isSmall ? 25 : 31 }]}>
              Mi espacio de enseñanza
            </Text>

            <Text style={styles.subtitle}>
              Consulta tus actividades asignadas y acompaña el aprendizaje de
              tus estudiantes.
            </Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.75}
            style={[styles.logout, loggingOut && styles.disabled]}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={C.red} />
            ) : (
              <Ionicons name="log-out-outline" size={20} color={C.red} />
            )}
            <Text style={styles.logoutText}>
              {loggingOut ? "Cerrando..." : "Cerrar sesión"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroText}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>BIENVENIDO A MINDHUB</Text>
            </View>

            <Text style={styles.heroTitle}>
              ¡Hola{user?.displayName ? `, ${user.displayName}` : ""}!
            </Text>

            <Text style={styles.heroDescription}>
              Aquí encontrarás los cursos y talleres que te ha asignado el
              administrador, junto con información de tus estudiantes.
            </Text>
          </View>

          {!isSmall && (
            <View style={styles.heroIcon}>
              <Ionicons name="school" size={48} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionText}>
            <Text style={styles.sectionTitle}>Resumen general</Text>
            <Text style={styles.sectionSubtitle}>
              Estado de tus actividades asignadas.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => load(true)}
            disabled={refreshing || loading}
            style={styles.refresh}
            accessibilityLabel="Actualizar información"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <Ionicons name="refresh-outline" size={21} color={C.primary} />
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <TouchableOpacity style={styles.errorBox} onPress={() => load(true)}>
            <Ionicons name="alert-circle-outline" size={20} color={C.red} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retry}>Reintentar</Text>
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Cargando tus actividades...</Text>
          </View>
        ) : (
          <View style={styles.stats}>
            {stats.map((item) => (
              <View
                key={item.label}
                style={[
                  styles.statCard,
                  { width: isSmall ? "100%" : isWide ? "31.5%" : "31%" },
                ]}
              >
                <View style={[styles.statIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionText}>
            <Text style={styles.sectionTitle}>Mis cursos</Text>
            <Text style={styles.sectionSubtitle}>
              Cursos que el administrador te ha asignado.
            </Text>
          </View>
        </View>

        {!loading && courses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="book-outline" size={30} color={C.primary} />
            <Text style={styles.emptyTitle}>
              Aún no tienes cursos asignados
            </Text>
            <Text style={styles.emptyText}>
              Cuando el administrador te asigne un curso, aparecerá aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.cardGrid}>
            {courses.map((course) => (
              <View
                key={course.id}
                style={[
                  styles.contentCard,
                  { width: isSmall ? "100%" : isWide ? "31.5%" : "48%" },
                ]}
              >
                <View style={styles.contentCardIcon}>
                  <Ionicons name="book-outline" size={24} color={C.purple} />
                </View>
                <Text style={styles.contentTitle} numberOfLines={2}>
                  {course.title || "Curso sin título"}
                </Text>
                <Text style={styles.contentDescription} numberOfLines={3}>
                  {course.description || "Sin descripción disponible."}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="people-outline" size={15} color={C.muted} />
                  <Text style={styles.metaText}>
                    {course.students ?? 0} estudiantes
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionText}>
            <Text style={styles.sectionTitle}>Mis talleres</Text>
            <Text style={styles.sectionSubtitle}>
              Consulta los detalles y los participantes de tus talleres.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.textLink}
            onPress={() => router.push("/instructor/workshops")}
          >
            <Text style={styles.textLinkLabel}>Ver todos</Text>
            <Ionicons name="arrow-forward" size={15} color={C.primary} />
          </TouchableOpacity>
        </View>

        {!loading && workshops.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="color-palette-outline"
              size={30}
              color={C.primary}
            />
            <Text style={styles.emptyTitle}>
              Aún no tienes talleres asignados
            </Text>
            <Text style={styles.emptyText}>
              Los talleres asignados por el administrador aparecerán aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.cardGrid}>
            {workshops.slice(0, 3).map((workshop) => (
              <View
                key={workshop.id}
                style={[
                  styles.contentCard,
                  { width: isSmall ? "100%" : isWide ? "31.5%" : "48%" },
                ]}
              >
                <View style={[styles.contentCardIcon, styles.workshopIcon]}>
                  <Ionicons
                    name="color-palette-outline"
                    size={24}
                    color={C.primary}
                  />
                </View>
                <Text style={styles.contentTitle} numberOfLines={2}>
                  {workshop.title || "Taller sin título"}
                </Text>
                <Text style={styles.contentDescription} numberOfLines={2}>
                  {workshop.description || "Sin descripción disponible."}
                </Text>
                <Text style={styles.metaText}>
                  Fecha: {workshop.date || "Por definir"}
                </Text>
                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={() =>
                    router.push({
                      pathname: "/instructor/students",
                      params: {
                        workshopId: workshop.id,
                        workshopTitle: workshop.title || "Taller",
                      },
                    })
                  }
                >
                  <Ionicons name="people-outline" size={16} color={C.primary} />
                  <Text style={styles.outlineButtonText}>Ver estudiantes</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Ionicons name="bulb-outline" size={17} color={C.primary} />
          <Text style={styles.footerText}>
            MindHub · Aprender, crear y descubrir
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: "100%", backgroundColor: C.background },
  scroll: { flex: 1, width: "100%" },
  content: {
    width: "100%",
    alignSelf: "stretch",
    paddingTop: 28,
    paddingBottom: 45,
  },
  topRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 25,
  },
  heading: { flex: 1, minWidth: 0 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFF0E0",
    marginBottom: 11,
  },
  badgeText: {
    color: C.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  title: { color: C.text, fontWeight: "900", letterSpacing: -0.6 },
  subtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 800,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 13,
    minHeight: 43,
    borderRadius: 12,
    backgroundColor: "#FFF0F2",
    borderWidth: 1,
    borderColor: "#F9DDE2",
    flexShrink: 0,
  },
  logoutText: { color: C.red, fontSize: 11, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  hero: {
    width: "100%",
    backgroundColor: "#5B4BDB",
    borderRadius: 24,
    padding: 25,
    marginBottom: 29,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  heroText: { flex: 1, minWidth: 0 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#FFFFFF25",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 9,
  },
  heroDescription: {
    color: "#F0EDFF",
    fontSize: 13,
    lineHeight: 21,
    maxWidth: 700,
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "#FFFFFF25",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 15,
    marginTop: 3,
  },
  sectionText: { flex: 1, minWidth: 0 },
  sectionTitle: { color: C.text, fontSize: 19, fontWeight: "900" },
  sectionSubtitle: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  refresh: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFF0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 28 },
  statCard: {
    flexGrow: 1,
    minWidth: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 19,
    borderWidth: 1,
    borderColor: C.border,
  },
  statIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { color: C.text, fontSize: 28, fontWeight: "900", marginTop: 12 },
  statLabel: { color: C.muted, fontSize: 12, fontWeight: "700", marginTop: 4 },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 28,
  },
  contentCard: {
    flexGrow: 1,
    minWidth: 240,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  contentCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EEEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  workshopIcon: { backgroundColor: "#FFF0E0" },
  contentTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
  },
  contentDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    minHeight: 38,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  metaText: { color: C.muted, fontSize: 11, marginTop: 8 },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#F2D8B8",
    backgroundColor: "#FFFAF4",
    borderRadius: 11,
    padding: 11,
    marginTop: 13,
  },
  outlineButtonText: { color: C.primary, fontSize: 11, fontWeight: "800" },
  textLink: { flexDirection: "row", alignItems: "center", gap: 5 },
  textLinkLabel: { color: C.primary, fontWeight: "800", fontSize: 12 },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 28,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 10,
    textAlign: "center",
  },
  emptyText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
    maxWidth: 420,
  },
  loadingBox: { alignItems: "center", justifyContent: "center", padding: 35 },
  loadingText: { color: C.muted, fontSize: 12, marginTop: 12 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF0F2",
    borderRadius: 12,
    padding: 13,
    marginBottom: 16,
  },
  errorText: { flex: 1, color: C.red, fontSize: 12 },
  retry: { color: C.red, fontSize: 11, fontWeight: "900" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 20,
    marginTop: 10,
  },
  footerText: { color: C.muted, fontSize: 11, fontWeight: "600" },
});
