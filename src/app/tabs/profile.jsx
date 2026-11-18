import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { getUserData, logoutUser } from "../../services/authService";
import { getUserEnrollments } from "../../services/enrollmentService";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [profile, setProfile] = useState(null);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [workshopCount, setWorkshopCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const isWideScreen = width >= 1000;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadProfile = async () => {
        if (!user?.uid) {
          if (isActive) {
            setProfile(null);
            setEnrollmentCount(0);
            setCourseCount(0);
            setWorkshopCount(0);
            setLoading(false);
          }
          return;
        }

        try {
          setLoading(true);

          const [userData, enrollments] = await Promise.all([
            getUserData(user.uid),
            getUserEnrollments(user.uid),
          ]);

          if (!isActive) return;

          const courses = Array.isArray(enrollments?.courses)
            ? enrollments.courses
            : [];

          const workshops = Array.isArray(enrollments?.workshops)
            ? enrollments.workshops
            : [];

          setProfile(userData);
          setCourseCount(courses.length);
          setWorkshopCount(workshops.length);
          setEnrollmentCount(courses.length + workshops.length);
        } catch (error) {
          console.error("Error al cargar el perfil:", error);

          if (isActive) {
            Alert.alert(
              "Error",
              "No fue posible cargar la información del perfil.",
            );
          }
        } finally {
          if (isActive) setLoading(false);
        }
      };

      loadProfile();

      return () => {
        isActive = false;
      };
    }, [user?.uid]),
  );

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      console.log("Iniciando cierre de sesión...");

      await logoutUser();

      console.log("Sesión cerrada correctamente.");

      router.replace("/auth/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);

      Alert.alert(
        "Error",
        error?.message
          ? `No fue posible cerrar la sesión: ${error.message}`
          : "No fue posible cerrar la sesión. Inténtalo nuevamente.",
      );

      setLoggingOut(false);
    }
  };

  const fullName =
    profile?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const email = profile?.email || user?.email || "Correo no disponible";

  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary || "#8B7CF6"} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="person-circle-outline" size={30} color="#6555D9" />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>MI CUENTA</Text>
            <Text style={styles.title}>Mi perfil</Text>
            <Text style={styles.subtitle}>
              Consulta tu información y tu actividad en MindHub.
            </Text>
          </View>
        </View>

        <View
          style={[styles.mainLayout, isWideScreen && styles.mainLayoutWide]}
        >
          {/* Información del usuario */}
          <View
            style={[styles.profileCard, isWideScreen && styles.profileCardWide]}
          >
            <View style={styles.profileTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials || "U"}</Text>
              </View>

              <View style={styles.identity}>
                <Text style={styles.name}>{fullName}</Text>
                <Text style={styles.email}>{email}</Text>

                <View style={styles.memberBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#6555D9" />
                  <Text style={styles.memberBadgeText}>Miembro de MindHub</Text>
                </View>
              </View>
            </View>

            <View style={styles.profileDivider} />

            <Text style={styles.menuSectionTitle}>Mi cuenta</Text>

            <MenuItem
              icon="book-outline"
              title="Mis inscripciones"
              description="Consulta tus cursos y talleres"
              onPress={() => router.push("/tabs/enrollment")}
            />

            <MenuItem
              icon="book"
              title="Manual de usuario"
              description="Aprende a utilizar la aplicación"
              onPress={() => router.push("/tabs/manual")}
            />

            <MenuItem
              icon="information-circle-outline"
              title="Acerca de MindHub"
              description="Conoce la aplicación"
              onPress={() => router.push("/tabs/about")}
            />

            <TouchableOpacity
              style={[
                styles.logoutButton,
                loggingOut && styles.logoutButtonDisabled,
              ]}
              activeOpacity={0.7}
              onPress={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color="#D9485F" />
              ) : (
                <Ionicons name="log-out-outline" size={21} color="#D9485F" />
              )}

              <Text style={styles.logoutText}>
                {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Actividad y resumen */}
          <View style={styles.detailsColumn}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Mi actividad</Text>
                <Text style={styles.sectionSubtitle}>
                  Resumen de tus inscripciones en MindHub
                </Text>
              </View>

              <View style={styles.activityIcon}>
                <Ionicons
                  name="stats-chart-outline"
                  size={22}
                  color="#6555D9"
                />
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                icon="layers-outline"
                label="Inscripciones"
                value={enrollmentCount}
                color="#8B7CF6"
                background="#F0EDFF"
              />

              <StatCard
                icon="book-outline"
                label="Cursos"
                value={courseCount}
                color="#4F83E5"
                background="#EAF2FF"
              />

              <StatCard
                icon="color-palette-outline"
                label="Talleres"
                value={workshopCount}
                color="#159A8C"
                background="#E5F7F3"
              />
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons name="bulb-outline" size={27} color="#6555D9" />
              </View>

              <View style={styles.infoTextContainer}>
                <Text style={styles.infoEyebrow}>SIGUE DESCUBRIENDO</Text>

                <Text style={styles.infoTitle}>Continúa aprendiendo</Text>

                <Text style={styles.infoDescription}>
                  Explora cursos y talleres para descubrir nuevas actividades de
                  aprendizaje creativo y seguir desarrollando tus habilidades.
                </Text>

                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => router.push("/tabs/courses")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.exploreButtonText}>Explorar cursos</Text>
                  <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tipCard}>
              <Ionicons name="heart-outline" size={21} color="#159A8C" />
              <Text style={styles.tipText}>
                En MindHub, cada actividad es una oportunidad para aprender y
                crear.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function MenuItem({ icon, title, description, onPress }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={21} color="#6555D9" />
      </View>

      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>

      <Ionicons name="chevron-forward" size={19} color="#A5A1B5" />
    </TouchableOpacity>
  );
}

function StatCard({ icon, label, value, color, background }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F7F5FC",
  },

  scrollContent: {
    flexGrow: 1,
    width: "100%",
    paddingBottom: 32,
  },

  page: {
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F5FC",
  },

  loadingText: {
    marginTop: 12,
    color: "#77738A",
    fontSize: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 28,
  },

  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDE9FF",
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: "#8B7CF6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 5,
  },

  title: {
    color: "#29273A",
    fontSize: 30,
    fontWeight: "800",
  },

  subtitle: {
    color: "#77738A",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },

  mainLayout: {
    width: "100%",
    gap: 22,
  },

  mainLayoutWide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
  },

  profileCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: "#EFEDF6",
  },

  profileCardWide: {
    width: "36%",
    maxWidth: 470,
    minWidth: 320,
    alignSelf: "stretch",
  },

  profileTop: {
    alignItems: "center",
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDE9FF",
    borderWidth: 3,
    borderColor: "#DCD5FF",
  },

  avatarText: {
    color: "#6555D9",
    fontSize: 29,
    fontWeight: "800",
  },

  identity: {
    width: "100%",
    alignItems: "center",
  },

  name: {
    color: "#29273A",
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 16,
  },

  email: {
    color: "#77738A",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },

  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 14,
  },

  memberBadgeText: {
    color: "#6555D9",
    fontSize: 12,
    fontWeight: "700",
  },

  profileDivider: {
    height: 1,
    backgroundColor: "#EFEDF6",
    marginVertical: 22,
  },

  menuSectionTitle: {
    color: "#29273A",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 5,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F1F8",
  },

  menuIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
  },

  menuTextContainer: {
    flex: 1,
  },

  menuTitle: {
    color: "#29273A",
    fontSize: 14,
    fontWeight: "700",
  },

  menuDescription: {
    color: "#88849A",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  logoutButton: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: "#F7D9DF",
    backgroundColor: "#FFF7F8",
    borderRadius: 13,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  logoutButtonDisabled: {
    opacity: 0.65,
  },

  logoutText: {
    color: "#D9485F",
    fontSize: 14,
    fontWeight: "700",
  },

  detailsColumn: {
    flex: 1,
    minWidth: 0,
    gap: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionTitle: {
    color: "#29273A",
    fontSize: 23,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#77738A",
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },

  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDE9FF",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  statCard: {
    flex: 1,
    minWidth: 135,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EFEDF6",
  },

  statIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  statValue: {
    color: "#29273A",
    fontSize: 29,
    fontWeight: "800",
  },

  statLabel: {
    color: "#77738A",
    fontSize: 12,
    marginTop: 5,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEDF6",
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 17,
  },

  infoIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
  },

  infoTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  infoEyebrow: {
    color: "#8B7CF6",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 7,
  },

  infoTitle: {
    color: "#29273A",
    fontSize: 19,
    fontWeight: "800",
  },

  infoDescription: {
    color: "#77738A",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 8,
  },

  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    gap: 9,
    backgroundColor: "#6555D9",
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 17,
  },

  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EAF8F4",
    borderRadius: 16,
    padding: 18,
  },

  tipText: {
    flex: 1,
    color: "#28796F",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
});
