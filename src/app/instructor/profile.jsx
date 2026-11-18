import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
import { getUserData } from "../../services/userService";

const THEME = {
  primary: COLORS.instructor || "#E88B32",
  background: "#F6F7FB",
  card: "#FFFFFF",
  text: "#29273A",
  muted: "#777B91",
  border: "#E8E9F2",
  purple: "#7865D8",
  blue: "#3785C6",
  green: "#27865B",
  red: "#D84E62",
};

export default function InstructorProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user?.uid) {
      setLoadingProfile(false);
      return;
    }

    try {
      setLoadingProfile(true);
      const data = await getUserData(user.uid);
      setProfile(data || null);
    } catch (error) {
      console.error("Error cargando perfil del instructor:", error);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.uid]);

  // Carga el perfil cuando se abre esta pantalla.
  const { useFocusEffect } = require("expo-router");

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const displayName =
    profile?.name || profile?.fullName || user?.displayName || "Instructor";

  const email = profile?.email || user?.email || "Correo no disponible";

  const initial = displayName.trim().charAt(0).toUpperCase() || "I";

  const openManual = () => {
    router.push("/instructor/manual");
  };

  const openAbout = () => {
    router.push("/instructor/about");
  };

  const confirmLogout = () => {
    if (loggingOut) return;

    // En web, usar el mismo comportamiento que Mi espacio.
    if (Platform.OS === "web") {
      handleLogout();
      return;
    }

    Alert.alert("Cerrar sesión", "¿Deseas salir de tu cuenta de MindHub?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: handleLogout,
      },
    ]);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutUser();
      router.replace("/auth/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);

      Alert.alert(
        "Error",
        "No fue posible cerrar la sesión. Inténtalo nuevamente.",
      );

      setLoggingOut(false);
    }
  };

  const MenuOption = ({ icon, color, title, description, onPress }) => (
    <TouchableOpacity
      style={styles.menuOption}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.menuIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={23} color={color} />
      </View>

      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#A0A2B3" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>MI CUENTA</Text>
            <Text style={styles.pageTitle}>Mi perfil</Text>
            <Text style={styles.pageSubtitle}>
              Consulta tu información y las herramientas disponibles.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="person-circle-outline"
              size={30}
              color={THEME.primary}
            />
          </View>
        </View>

        {/* Tarjeta del perfil */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <View style={styles.profileIdentity}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.email}>{email}</Text>

              <View style={styles.roleBadge}>
                <Ionicons
                  name="school-outline"
                  size={14}
                  color={THEME.primary}
                />
                <Text style={styles.roleText}>Instructor</Text>
              </View>
            </View>
          </View>

          <View style={styles.profileDivider} />

          {loadingProfile ? (
            <View style={styles.loadingProfile}>
              <ActivityIndicator color={THEME.primary} size="small" />
              <Text style={styles.loadingText}>Cargando información...</Text>
            </View>
          ) : (
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={19} color={THEME.muted} />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Nombre</Text>
                  <Text style={styles.detailValue}>{displayName}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={19} color={THEME.muted} />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Correo electrónico</Text>
                  <Text style={styles.detailValue}>{email}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color={THEME.muted}
                />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Tipo de cuenta</Text>
                  <Text style={styles.detailValue}>Instructor de MindHub</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Opciones de ayuda e información */}
        <Text style={styles.sectionTitle}>Ayuda e información</Text>

        <View style={styles.menuCard}>
          <MenuOption
            icon="book-outline"
            color={THEME.blue}
            title="Manual del instructor"
            description="Aprende a utilizar las funciones de tu cuenta."
            onPress={openManual}
          />

          <View style={styles.menuDivider} />

          <MenuOption
            icon="information-circle-outline"
            color={THEME.green}
            title="Acerca de MindHub"
            description="Conoce el propósito y las características de la aplicación."
            onPress={openAbout}
          />
        </View>

        {/* Sesión */}
        <Text style={styles.sectionTitle}>Seguridad</Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={confirmLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          {loggingOut ? (
            <ActivityIndicator color={THEME.red} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={21} color={THEME.red} />
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>MindHub · Aprendizaje creativo</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    backgroundColor: THEME.background,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  content: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 30,
  },
  contentWide: {
    paddingHorizontal: 36,
    paddingTop: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
    gap: 12,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "800",
    color: THEME.primary,
    marginBottom: 5,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: THEME.text,
  },
  pageSubtitle: {
    marginTop: 5,
    color: THEME.muted,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 500,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#FFF0E1",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    backgroundColor: THEME.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 26,
    width: "100%",
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#FFF0E1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: THEME.primary,
    fontSize: 30,
    fontWeight: "800",
  },
  profileIdentity: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: THEME.text,
    fontSize: 19,
    fontWeight: "800",
  },
  email: {
    color: THEME.muted,
    fontSize: 12,
    marginTop: 5,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "#FFF0E1",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
  },
  roleText: {
    color: THEME.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  profileDivider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 20,
  },
  loadingProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    color: THEME.muted,
    fontSize: 13,
  },
  details: {
    gap: 19,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: THEME.muted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: THEME.text,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    color: THEME.text,
    fontWeight: "800",
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 19,
    paddingHorizontal: 15,
    marginBottom: 26,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
    gap: 12,
  },
  menuIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: THEME.text,
  },
  menuDescription: {
    color: THEME.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  menuDivider: {
    height: 1,
    backgroundColor: THEME.border,
  },
  logoutButton: {
    minHeight: 54,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2D6DA",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: 14,
  },
  logoutText: {
    color: THEME.red,
    fontSize: 14,
    fontWeight: "800",
  },
  footer: {
    textAlign: "center",
    color: "#999BAD",
    fontSize: 11,
    marginTop: 25,
  },
});
