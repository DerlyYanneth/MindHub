import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import CourseCard from "../../components/CourseCard";
import { COLORS, RADIUS } from "../../constants/colors";
import { AuthContext } from "../../context/AuthContext";
import { getCourses } from "../../services/courseService";
import { getWorkshops } from "../../services/workshopService";

const toArray = (value) => (Array.isArray(value) ? value : []);

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { width } = useWindowDimensions();

  const [courses, setCourses] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const isDesktop = width >= 1100;
  const isTablet = width >= 700;
  const pageWidth = width >= 1600 ? 1980 : width >= 1100 ? 1400 : width;

  const firstName =
    user?.displayName?.trim()?.split(/\s+/)[0] ||
    user?.name?.trim()?.split(/\s+/)[0] ||
    "estudiante";

  const loadHome = useCallback(async () => {
    setError("");

    try {
      const [coursesResult, workshopsResult] = await Promise.all([
        getCourses(),
        getWorkshops(),
      ]);

      setCourses(toArray(coursesResult));
      setWorkshops(toArray(workshopsResult));
    } catch (err) {
      console.error("Error cargando inicio:", err);
      setError("No pudimos cargar todo el contenido. Intenta actualizar.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHome();
  }, [loadHome]);

  const popularCourses = courses.slice(0, 6);
  const featuredWorkshops = workshops.slice(0, 3);

  const openCourse = (course) => {
    if (!course?.id) return;

    router.push({
      pathname: "/tabs/course-detail",
      params: { id: String(course.id) },
    });
  };

  const openWorkshop = (workshop) => {
    if (!workshop?.id) return;

    router.push({
      pathname: "/tabs/workshop-detail",
      params: { id: String(workshop.id) },
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      <View
        style={[
          styles.page,
          {
            maxWidth: pageWidth,
            paddingHorizontal: width < 480 ? 16 : isDesktop ? 32 : 22,
            paddingTop: isDesktop ? 22 : 14,
          },
        ]}
      >
        <View style={styles.topBar}>
          <View style={styles.brandIcon}>
            <Ionicons name="school-outline" size={24} color={COLORS.white} />
          </View>

          <View style={styles.brandText}>
            <Text style={styles.brandName}>MindHub</Text>
            <Text style={styles.brandCaption}>Aprende. Crea. Evoluciona.</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/tabs/profile")}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
          >
            <Ionicons name="person-outline" size={21} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.welcomeCard,
            {
              padding: isDesktop ? 36 : width < 480 ? 21 : 28,
              minHeight: isDesktop ? 228 : undefined,
            },
          ]}
        >
          <View style={styles.welcomeDecoration} />

          <Text style={styles.eyebrow}>TU ESPACIO DE APRENDIZAJE</Text>

          <Text
            style={[
              styles.welcomeTitle,
              { fontSize: isDesktop ? 34 : width < 480 ? 25 : 30 },
            ]}
          >
            ¡Hola, {firstName}!
          </Text>

          <Text
            style={[
              styles.welcomeDescription,
              { maxWidth: isDesktop ? 650 : 510 },
            ]}
          >
            Explora nuevas habilidades, aprende a tu ritmo y transforma tus
            ideas en algo extraordinario.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/tabs/courses")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Explorar cursos</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchBox}
          onPress={() => router.push("/tabs/courses")}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Buscar cursos"
        >
          <Ionicons
            name="search-outline"
            size={21}
            color={COLORS.textSecondary}
          />

          <Text style={styles.searchPlaceholder}>
            ¿Qué te gustaría aprender?
          </Text>

          <Ionicons name="options-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        {error ? (
          <TouchableOpacity
            style={styles.errorBox}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={COLORS.danger}
            />
            <Text style={styles.errorText}>{error} Toca para reintentar.</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Cursos populares</Text>
              <Text style={styles.sectionSubtitle}>
                Encuentra tu próxima inspiración
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/tabs/courses")}
              style={styles.seeAllButton}
              activeOpacity={0.8}
            >
              <Text style={styles.seeAllText}>Ver todos</Text>
              <Ionicons
                name="chevron-forward"
                size={15}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando cursos...</Text>
            </View>
          ) : popularCourses.length > 0 ? (
            <FlatList
              data={popularCourses}
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) =>
                String(item.id || item.title || index)
              }
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.courseItem,
                    { marginRight: isDesktop ? 20 : 14 },
                  ]}
                >
                  <CourseCard
                    course={item}
                    horizontal
                    onPress={() => openCourse(item)}
                  />
                </View>
              )}
              contentContainerStyle={styles.horizontalList}
              removeClippedSubviews={false}
            />
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="book-outline"
                  size={25}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>Pronto habrá nuevos cursos</Text>

              <Text style={styles.emptyDescription}>
                Cuando se publiquen cursos, aparecerán aquí.
              </Text>

              <TouchableOpacity
                onPress={onRefresh}
                style={styles.outlineButton}
                activeOpacity={0.8}
              >
                <Text style={styles.outlineButtonText}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Talleres destacados</Text>
              <Text style={styles.sectionSubtitle}>
                Aprende creando y practicando
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/tabs/workshops")}
              style={styles.seeAllButton}
              activeOpacity={0.8}
            >
              <Text style={styles.seeAllText}>Ver todos</Text>
              <Ionicons
                name="chevron-forward"
                size={15}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBoxSmall}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : featuredWorkshops.length > 0 ? (
            <View
              style={[
                styles.workshopList,
                isDesktop && styles.workshopGridDesktop,
                isTablet && !isDesktop && styles.workshopGridTablet,
              ]}
            >
              {featuredWorkshops.map((workshop, index) => (
                <TouchableOpacity
                  key={String(workshop.id || workshop.title || index)}
                  style={[
                    styles.workshopCard,
                    isDesktop && styles.workshopCardDesktop,
                    isTablet && !isDesktop && styles.workshopCardTablet,
                  ]}
                  onPress={() => openWorkshop(workshop)}
                  activeOpacity={0.85}
                >
                  <View style={styles.workshopIcon}>
                    <Ionicons
                      name="color-palette-outline"
                      size={23}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={styles.workshopContent}>
                    <Text style={styles.workshopTitle} numberOfLines={2}>
                      {workshop.title || workshop.name || "Taller creativo"}
                    </Text>

                    <Text style={styles.workshopDescription} numberOfLines={2}>
                      {workshop.description ||
                        "Descubre nuevas técnicas y desarrolla tus habilidades."}
                    </Text>

                    <Text style={styles.workshopLink}>
                      Ver detalles
                      <Text style={styles.workshopArrow}> →</Text>
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.smallEmptyCard}>
              <Ionicons
                name="calendar-outline"
                size={23}
                color={COLORS.textSecondary}
              />
              <Text style={styles.smallEmptyText}>
                Los próximos talleres aparecerán aquí.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomNote}>
          <Ionicons
            name="sparkles-outline"
            size={18}
            color={COLORS.secondary}
          />
          <Text style={styles.bottomNoteText}>
            Cada habilidad nueva es una oportunidad para crecer.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 36,
  },

  page: {
    width: "100%",
    alignSelf: "center",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  brandText: {
    flex: 1,
    marginLeft: 12,
  },

  brandName: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },

  brandCaption: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  welcomeCard: {
    position: "relative",
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 28,
    overflow: "hidden",
    marginBottom: 18,
    justifyContent: "center",
  },

  welcomeDecoration: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -75,
    right: -45,
  },

  eyebrow: {
    color: "#DCE8FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 12,
  },

  welcomeTitle: {
    color: COLORS.white,
    fontSize: 30,
    lineHeight: 39,
    fontWeight: "800",
    marginBottom: 9,
  },

  welcomeDescription: {
    color: "#F0F5FF",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },

  primaryButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    backgroundColor: COLORS.white,
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  primaryButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  searchBox: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 32,
    gap: 12,
  },

  searchPlaceholder: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  section: {
    marginBottom: 32,
    minWidth: 0,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
    gap: 10,
  },

  sectionHeading: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },

  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingLeft: 8,
  },

  seeAllText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  horizontalList: {
    paddingTop: 2,
    paddingBottom: 7,
    paddingRight: 4,
  },

  courseItem: {
    alignSelf: "stretch",
  },

  loadingBox: {
    minHeight: 190,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
  },

  loadingBoxSmall: {
    padding: 25,
    alignItems: "center",
  },

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },

  emptyCard: {
    alignItems: "center",
    padding: 25,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
  },

  emptyIcon: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 15,
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 17,
    paddingVertical: 10,
  },

  outlineButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  workshopList: {
    gap: 12,
  },

  workshopGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  workshopGridDesktop: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "stretch",
  },

  workshopCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 16,
    minWidth: 0,
  },

  workshopCardTablet: {
    width: "48.5%",
  },

  workshopCardDesktop: {
    flex: 1,
  },

  workshopIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  workshopContent: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },

  workshopTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },

  workshopDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  workshopLink: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 9,
  },

  workshopArrow: {
    fontSize: 14,
  },

  smallEmptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 18,
  },

  smallEmptyText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: COLORS.dangerSoft,
    borderRadius: 10,
    padding: 13,
    marginBottom: 20,
  },

  errorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 12,
    lineHeight: 18,
  },

  bottomNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },

  bottomNoteText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
    flexShrink: 1,
  },
});
