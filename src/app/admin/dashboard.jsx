import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import AdminHeader from "../../components/AdminHea";
import { AuthContext } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";
import { getCourses } from "../../services/courseService";
import { getAllUsers } from "../../services/userService";
import { getWorkshops } from "../../services/workshopService";

const C = {
  primary: "#5B4BDB",
  primaryDark: "#4435B5",
  primaryLight: "#EEEAFE",
  secondary: "#8B5CF6",
  background: "#F6F7FB",
  surface: "#FFFFFF",
  text: "#20223A",
  muted: "#777B91",
  border: "#E8E9F2",
  green: "#159A75",
  orange: "#E88B32",
  red: "#D94D67",
};

export default function AdminDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, role, loading: authLoading } = useContext(AuthContext);

  const isSmallScreen = width < 600;
  const isTablet = width >= 600 && width < 1924;
  const isWideScreen = width >= 2024;

  const [stats, setStats] = useState({
    users: 0,
    instructors: 0,
    courses: 0,
    workshops: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const loadStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [users, courses, workshops] = await Promise.all([
        getAllUsers(),
        getCourses(),
        getWorkshops(),
      ]);

      setStats({
        users: users.length,
        instructors: users.filter((item) => item.role === "instructor").length,
        courses: courses.length,
        workshops: workshops.length,
      });
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
      setError(
        "No fue posible actualizar las estadísticas. Intenta nuevamente.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Cierra la sesión y redirige al login.
  const performLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutUser();
      router.replace("/auth/login");
    } catch (err) {
      console.error("Error cerrando sesión:", err);

      const message =
        "No se pudo cerrar la sesión. Verifica tu conexión e inténtalo nuevamente.";

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

  const statCards = [
    {
      title: "Usuarios registrados",
      value: stats.users,
      icon: "people-outline",
      color: C.primary,
      description: "Personas en la plataforma",
    },
    {
      title: "Instructores",
      value: stats.instructors,
      icon: "school-outline",
      color: C.secondary,
      description: "Responsables de enseñar",
    },
    {
      title: "Cursos disponibles",
      value: stats.courses,
      icon: "book-outline",
      color: C.green,
      description: "Contenidos de aprendizaje",
    },
    {
      title: "Talleres disponibles",
      value: stats.workshops,
      icon: "color-palette-outline",
      color: C.orange,
      description: "Actividades creativas",
    },
  ];

  const shortcuts = [
    {
      title: "Gestión de contenido",
      description:
        "Crea, consulta, actualiza y elimina cursos de la plataforma.",
      icon: "library-outline",
      route: "/admin/manage-content",
      color: C.primary,
      tag: "Cursos",
    },
    {
      title: "Gestión de talleres",
      description:
        "Organiza talleres, revisa su información y administra sus cupos.",
      icon: "color-palette-outline",
      route: "/admin/manage-workshops",
      color: C.orange,
      tag: "Actividades",
    },
    {
      title: "Usuarios y roles",
      description:
        "Consulta las cuentas registradas y administra sus permisos.",
      icon: "people-outline",
      route: "/admin/users",
      color: C.green,
      tag: "Comunidad",
    },
    {
      title: "Inscripciones",
      description: "Consulta los participantes inscritos en cursos y talleres.",
      icon: "clipboard-outline",
      route: "/admin/enrollments",
      color: C.secondary,
      tag: "Seguimiento",
    },
  ];

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
      </View>
    );
  }

  if (role && role !== "admin" && role !== "administrador") {
    return (
      <View style={styles.center}>
        <View style={styles.deniedIcon}>
          <Ionicons name="lock-closed-outline" size={38} color={C.red} />
        </View>

        <Text style={styles.deniedTitle}>Acceso restringido</Text>

        <Text style={styles.deniedText}>
          Este panel está disponible únicamente para administradores.
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          activeOpacity={0.75}
          disabled={loggingOut}
          style={[styles.logoutButton, loggingOut && styles.disabledButton]}
          onPress={handleLogout}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color={C.red} />
          ) : (
            <Ionicons name="log-out-outline" size={20} color={C.red} />
          )}

          <Text style={styles.logoutText}>
            {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <AdminHeader active="dashboard" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: isSmallScreen ? 16 : isTablet ? 24 : 36,
            paddingTop: isSmallScreen ? 22 : 30,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadStats(true)}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        <View style={styles.pageTop}>
          <View style={styles.pageHeading}>
            <View style={styles.welcomeBadge}>
              <Ionicons name="sparkles" size={14} color={C.primary} />
              <Text style={styles.welcomeBadgeText}>
                TU ESPACIO DE ADMINISTRACIÓN
              </Text>
            </View>

            <Text style={styles.pageTitle}>¡Hola, administrador!</Text>

            <Text style={styles.pageSubtitle}>
              Bienvenido a MindHub. Administra los recursos, las actividades y
              la comunidad de aprendizaje desde un solo lugar.
            </Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            activeOpacity={0.8}
            disabled={loggingOut}
            style={[styles.logoutButton, loggingOut && styles.disabledButton]}
            onPress={handleLogout}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={C.red} />
            ) : (
              <Ionicons name="log-out-outline" size={20} color={C.red} />
            )}

            {!isSmallScreen && (
              <Text style={styles.logoutText}>
                {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.hero,
            {
              padding: isSmallScreen ? 20 : isTablet ? 26 : 32,
              borderRadius: isSmallScreen ? 20 : 26,
            },
          ]}
        >
          <View style={styles.heroTextContainer}>
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>RESUMEN DE MINDHUB</Text>
            </View>

            <Text
              style={[
                styles.heroTitle,
                {
                  fontSize: isSmallScreen ? 24 : isWideScreen ? 34 : 30,
                },
              ]}
            >
              Todo tu aprendizaje, en un solo lugar.
            </Text>

            <Text style={styles.heroDescription}>
              {user?.displayName || user?.name
                ? `Hola, ${
                    user.displayName || user.name
                  }. Desde aquí puedes supervisar el funcionamiento de MindHub.`
                : "Supervisa el funcionamiento de MindHub y mantén organizados sus recursos educativos."}
            </Text>
          </View>

          {!isSmallScreen && (
            <View style={styles.heroIllustration}>
              <View style={styles.heroIllustrationCircle}>
                <Ionicons name="analytics-outline" size={43} color="#FFFFFF" />
              </View>

              <View style={styles.floatingIconOne}>
                <Ionicons name="book-outline" size={20} color="#FFFFFF" />
              </View>

              <View style={styles.floatingIconTwo}>
                <Ionicons name="people-outline" size={20} color="#FFFFFF" />
              </View>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingText}>
            <Text style={styles.sectionTitle}>Resumen general</Text>

            <Text style={styles.sectionSubtitle}>
              Consulta las cifras actuales de tu plataforma.
            </Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Actualizar estadísticas"
            activeOpacity={0.75}
            onPress={() => loadStats(true)}
            disabled={refreshing}
            style={styles.refreshButton}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <Ionicons name="refresh-outline" size={20} color={C.primary} />
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.errorBox}
            onPress={() => loadStats(true)}
          >
            <Ionicons name="alert-circle-outline" size={22} color={C.red} />

            <Text style={styles.errorText}>{error}</Text>

            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator color={C.primary} size="large" />
            <Text style={styles.loadingText}>Cargando estadísticas...</Text>
          </View>
        ) : (
          <View style={[styles.statsGrid, { gap: isSmallScreen ? 12 : 16 }]}>
            {statCards.map((item) => (
              <View
                key={item.title}
                style={[
                  styles.statCard,
                  {
                    flexBasis: isSmallScreen ? "46%" : isTablet ? "45%" : "22%",
                    padding: isSmallScreen ? 15 : 22,
                  },
                ]}
              >
                <View style={styles.statCardTop}>
                  <View
                    style={[
                      styles.statIcon,
                      { backgroundColor: `${item.color}18` },
                    ]}
                  >
                    <Ionicons name={item.icon} size={23} color={item.color} />
                  </View>

                  <Ionicons
                    name="trending-up-outline"
                    size={18}
                    color={item.color}
                  />
                </View>

                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={styles.statValue}
                >
                  {item.value}
                </Text>

                <Text style={styles.statTitle}>{item.title}</Text>

                <Text style={styles.statDescription}>{item.description}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingText}>
            <Text style={styles.sectionTitle}>Accesos rápidos</Text>

            <Text style={styles.sectionSubtitle}>
              Ingresa directamente a las herramientas administrativas.
            </Text>
          </View>
        </View>

        <View
          style={[styles.shortcutList, isWideScreen && styles.shortcutGrid]}
        >
          {shortcuts.map((item) => (
            <TouchableOpacity
              key={item.title}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              style={[
                styles.shortcutCard,
                isWideScreen && styles.shortcutCardWide,
                {
                  padding: isSmallScreen ? 15 : 20,
                },
              ]}
              onPress={() => router.push(item.route)}
            >
              <View
                style={[
                  styles.shortcutIcon,
                  { backgroundColor: `${item.color}18` },
                ]}
              >
                <Ionicons name={item.icon} size={25} color={item.color} />
              </View>

              <View style={styles.shortcutText}>
                <Text style={styles.shortcutTag}>{item.tag}</Text>

                <Text style={styles.shortcutTitle}>{item.title}</Text>

                <Text style={styles.shortcutDescription}>
                  {item.description}
                </Text>
              </View>

              <View style={styles.shortcutArrow}>
                <Ionicons name="arrow-forward" size={18} color={item.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Ionicons name="bulb-outline" size={17} color={C.primary} />
          </View>

          <Text style={styles.footerText}>
            MindHub · Aprender, crear y descubrir
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    backgroundColor: C.background,
  },

  scroll: {
    flex: 1,
    width: "100%",
  },

  content: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    paddingBottom: 38,
  },

  center: {
    flex: 1,
    width: "100%",
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingText: {
    color: C.muted,
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },

  pageTop: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    marginBottom: 25,
  },

  pageHeading: {
    flex: 1,
    minWidth: 0,
  },

  welcomeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.primaryLight,
    marginBottom: 11,
  },

  welcomeBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: C.primary,
  },

  pageTitle: {
    color: C.text,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.7,
  },

  pageSubtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 700,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 13,
    height: 43,
    flexShrink: 0,
    borderRadius: 13,
    backgroundColor: "#FFF0F2",
    borderWidth: 1,
    borderColor: "#F9DDE2",
  },

  disabledButton: {
    opacity: 0.6,
  },

  logoutText: {
    color: C.red,
    fontSize: 12,
    fontWeight: "800",
  },

  hero: {
    width: "100%",
    backgroundColor: C.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    marginBottom: 31,
    overflow: "hidden",
  },

  heroTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 13,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFFFFF20",
  },

  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#A7F3D0",
  },

  heroBadgeText: {
    color: "#F1EEFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: -0.6,
    marginBottom: 10,
    maxWidth: 680,
  },

  heroDescription: {
    color: "#EFEDFF",
    fontSize: 13,
    lineHeight: 22,
    maxWidth: 700,
  },

  heroIllustration: {
    width: 155,
    height: 135,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  heroIllustrationCircle: {
    width: 88,
    height: 88,
    borderRadius: 29,
    backgroundColor: "#FFFFFF24",
    borderWidth: 1,
    borderColor: "#FFFFFF35",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-8deg" }],
  },

  floatingIconOne: {
    position: "absolute",
    top: 8,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: C.secondary,
    alignItems: "center",
    justifyContent: "center",
  },

  floatingIconTwo: {
    position: "absolute",
    bottom: 4,
    left: 9,
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#159A75",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
    marginTop: 2,
  },

  sectionHeadingText: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 19,
  },

  refreshButton: {
    width: 42,
    height: 42,
    flexShrink: 0,
    backgroundColor: C.primaryLight,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  statsGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 30,
  },

  statCard: {
    flexGrow: 1,
    minWidth: 0,
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#29205C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 2,
  },

  statCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  statIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    color: C.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  statTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 6,
  },

  statDescription: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  statsLoading: {
    paddingVertical: 38,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  shortcutList: {
    width: "100%",
    gap: 13,
  },

  shortcutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  shortcutCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#29205C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.025,
    shadowRadius: 9,
    elevation: 1,
  },

  shortcutCardWide: {
    width: "48%",
    flexGrow: 1,
    minWidth: 280,
  },

  shortcutIcon: {
    width: 49,
    height: 49,
    flexShrink: 0,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  shortcutText: {
    flex: 1,
    minWidth: 0,
  },

  shortcutTag: {
    color: C.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 5,
  },

  shortcutTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "900",
  },

  shortcutDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },

  shortcutArrow: {
    width: 34,
    height: 34,
    flexShrink: 0,
    borderRadius: 11,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  errorBox: {
    width: "100%",
    backgroundColor: "#FFF0F2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F9DDE2",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 17,
  },

  errorText: {
    flex: 1,
    minWidth: 0,
    color: C.red,
    fontSize: 12,
    lineHeight: 18,
  },

  retryText: {
    color: C.red,
    fontWeight: "900",
    fontSize: 12,
  },

  deniedIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#FFF0F2",
    alignItems: "center",
    justifyContent: "center",
  },

  deniedTitle: {
    color: C.text,
    fontWeight: "900",
    fontSize: 22,
    marginTop: 18,
    textAlign: "center",
  },

  deniedText: {
    color: C.muted,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 22,
    lineHeight: 21,
    maxWidth: 400,
  },

  primaryButton: {
    backgroundColor: C.primary,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  footer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 35,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },

  footerLogo: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  footerText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    flexShrink: 0,
    borderRadius: 13,
    backgroundColor: "#FFF0F2",
    borderWidth: 1,
    borderColor: "#F9DDE2",
    cursor: "pointer",
  },

  disabledButton: {
    opacity: 0.6,
  },

  logoutText: {
    color: C.red,
    fontSize: 12,
    fontWeight: "800",
  },
});
