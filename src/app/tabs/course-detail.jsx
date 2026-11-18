import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import VideoPlayer from "../../components/VideoPlayer";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { getCourseById } from "../../services/courseService";
import {
  enrollInCourse,
  isUserEnrolled,
} from "../../services/enrollmentService";
import { showAlert } from "../../utils/alert";

export default function CourseDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    load();
  }, [id, user]);

  const load = async () => {
    try {
      setLoading(true);

      const data = await getCourseById(id);
      setCourse(data);

      if (user && data) {
        const alreadyEnrolled = await isUserEnrolled(user.uid, data.id);

        setEnrolled(alreadyEnrolled);
      }
    } catch (error) {
      console.log("Error cargando detalle del curso:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (enrolled) {
      router.push({
        pathname: "/tabs/learning",
        params: { id: String(id) },
      });
      return;
    }

    setEnrolling(true);

    try {
      await enrollInCourse(user.uid, id);

      setEnrolled(true);

      showAlert(
        "¡Inscripción exitosa!",
        "Ahora puedes comenzar tu aprendizaje.",
        [
          {
            text: "Comenzar curso",
            onPress: () =>
              router.push({
                pathname: "/tabs/learning",
                params: { id: String(id) },
              }),
          },
        ],
      );
    } catch (error) {
      showAlert("No fue posible inscribirte", error.message);
    } finally {
      setEnrolling(false);
    }
  };

  const getYouTubeId = (value) => {
    if (!value) return null;

    if (!value.includes("youtube.com") && !value.includes("youtu.be")) {
      return value;
    }

    const shortsMatch = value.match(/youtube\.com\/shorts\/([^?&/]+)/);

    if (shortsMatch?.[1]) {
      return shortsMatch[1];
    }

    const watchMatch = value.match(/[?&]v=([^?&]+)/);

    if (watchMatch?.[1]) {
      return watchMatch[1];
    }

    const shortMatch = value.match(/youtu\.be\/([^?&/]+)/);

    if (shortMatch?.[1]) {
      return shortMatch[1];
    }

    return null;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando curso...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.center}>
        <Ionicons name="book-outline" size={60} color={COLORS.textLight} />
        <Text style={styles.notFoundTitle}>Curso no encontrado</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const videoId = getYouTubeId(course.videoUrl || course.videoId);

  const modules =
    course.modules && course.modules.length > 0 ? course.modules : [];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mediaContainer}>
          {videoId ? (
            <VideoPlayer videoId={videoId} height={235} />
          ) : (
            <Image
              source={{
                uri: course.imageUrl || "https://via.placeholder.com/600x350",
              }}
              style={styles.headerImage}
            />
          )}

          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.categoryBadge}>
            <Ionicons
              name="sparkles-outline"
              size={13}
              color={COLORS.primary}
            />
            <Text style={styles.categoryText}>
              {course.category || "Creatividad"}
            </Text>
          </View>

          <Text style={styles.title}>{course.title}</Text>

          <Text style={styles.instructor}>
            Creado por{" "}
            <Text style={styles.instructorBold}>
              {course.instructor || "Instructor MindHub"}
            </Text>
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="star" size={16} color={COLORS.star} />
              </View>

              <View>
                <Text style={styles.statValue}>{course.rating || "4.5"}</Text>
                <Text style={styles.statLabel}>Valoración</Text>
              </View>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons
                  name="time-outline"
                  size={17}
                  color={COLORS.primary}
                />
              </View>

              <View>
                <Text style={styles.statValue}>
                  {course.duration || "4 horas"}
                </Text>
                <Text style={styles.statLabel}>Duración</Text>
              </View>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons
                  name="bar-chart-outline"
                  size={17}
                  color={COLORS.primary}
                />
              </View>

              <View>
                <Text style={styles.statValue}>
                  {course.level || "Principiante"}
                </Text>
                <Text style={styles.statLabel}>Nivel</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Ionicons
                name="laptop-outline"
                size={20}
                color={COLORS.primary}
              />

              <View style={styles.infoCardText}>
                <Text style={styles.infoLabel}>Modalidad</Text>
                <Text style={styles.infoValue}>
                  {course.modality || "Virtual"}
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Ionicons
                name="people-outline"
                size={20}
                color={COLORS.primary}
              />

              <View style={styles.infoCardText}>
                <Text style={styles.infoLabel}>Estudiantes</Text>
                <Text style={styles.infoValue}>{course.students || 0}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre este curso</Text>

            <Text style={styles.description}>
              {course.description ||
                "Aprende nuevas habilidades mediante ejercicios prácticos y actividades creativas."}
            </Text>
          </View>

          <View style={styles.objectiveBox}>
            <View style={styles.objectiveIcon}>
              <Ionicons name="flag-outline" size={22} color={COLORS.primary} />
            </View>

            <View style={styles.objectiveContent}>
              <Text style={styles.objectiveTitle}>Objetivo del curso</Text>

              <Text style={styles.objectiveText}>
                {course.objective ||
                  "Desarrollar habilidades creativas mediante ejercicios progresivos y actividades prácticas."}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contenido del curso</Text>

              <View style={styles.moduleCountBadge}>
                <Text style={styles.moduleCountText}>
                  {modules.length} módulos
                </Text>
              </View>
            </View>

            {modules.length > 0 ? (
              modules.map((module, index) => (
                <View
                  key={`${module.title}-${index}`}
                  style={styles.moduleItem}
                >
                  <View style={styles.moduleNumber}>
                    <Text style={styles.moduleNumberText}>{index + 1}</Text>
                  </View>

                  <View style={styles.moduleInfo}>
                    <Text style={styles.moduleTitle}>
                      {module.title || `Módulo ${index + 1}`}
                    </Text>

                    {module.duration && (
                      <View style={styles.moduleDurationRow}>
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color={COLORS.textLight}
                        />

                        <Text style={styles.moduleDuration}>
                          {module.duration}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Ionicons
                    name="play-circle-outline"
                    size={23}
                    color={COLORS.primary}
                  />
                </View>
              ))
            ) : (
              <View style={styles.noModules}>
                <Ionicons
                  name="list-outline"
                  size={25}
                  color={COLORS.textLight}
                />

                <Text style={styles.noModulesText}>
                  El contenido detallado se publicará próximamente.
                </Text>
              </View>
            )}
          </View>

          {videoId && (
            <View style={styles.videoReference}>
              <Ionicons name="logo-youtube" size={22} color="#FF0000" />

              <View style={{ flex: 1 }}>
                <Text style={styles.videoReferenceTitle}>
                  Material audiovisual
                </Text>

                <Text style={styles.videoReferenceText}>
                  Este curso incluye contenido audiovisual de apoyo mediante
                  YouTube.
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Precio</Text>

          <Text style={styles.price}>${course.price || "0"}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.enrollButton,
            enrolled && styles.enrolledButton,
            enrolling && styles.disabledButton,
          ]}
          onPress={handleEnroll}
          disabled={enrolling}
        >
          <Ionicons
            name={enrolled ? "checkmark-circle" : "play"}
            size={19}
            color="#fff"
          />

          <Text style={styles.enrollText}>
            {enrolled
              ? "Continuar curso"
              : enrolling
                ? "Inscribiendo..."
                : "Inscribirme"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 25,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
  },

  notFoundTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 15,
  },

  backButton: {
    marginTop: 20,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },

  backButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  scrollContent: {
    paddingBottom: 20,
  },

  mediaContainer: {
    position: "relative",
    backgroundColor: "#111",
  },

  headerImage: {
    width: "100%",
    height: 235,
    backgroundColor: "#eee",
  },

  backIcon: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    padding: 20,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF0FF",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },

  categoryText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 5,
  },

  title: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 13,
  },

  instructor: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 7,
  },

  instructorBold: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },

  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 17,
    padding: 13,
    marginTop: 20,
  },

  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 7,
  },

  statValue: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },

  statLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
    marginHorizontal: 5,
  },

  infoCards: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  infoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8FC",
    borderRadius: 14,
    padding: 12,
  },

  infoCardText: {
    marginLeft: 9,
  },

  infoLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 2,
  },

  section: {
    marginTop: 27,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 11,
  },

  description: {
    fontSize: 14,
    color: "#4B4B55",
    lineHeight: 23,
  },

  objectiveBox: {
    flexDirection: "row",
    backgroundColor: "#F3F1FF",
    borderRadius: 17,
    padding: 15,
    marginTop: 25,
  },

  objectiveIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  objectiveContent: {
    flex: 1,
  },

  objectiveTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 5,
  },

  objectiveText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  moduleCountBadge: {
    backgroundColor: "#F0F0F8",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  moduleCountText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  moduleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFC",
    borderRadius: 14,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "#F0F0F3",
  },

  moduleNumber: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#EEF0FF",
    justifyContent: "center",
    alignItems: "center",
  },

  moduleNumberText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 13,
  },

  moduleInfo: {
    flex: 1,
    marginHorizontal: 12,
  },

  moduleTitle: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },

  moduleDurationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  moduleDuration: {
    fontSize: 10,
    color: COLORS.textLight,
    marginLeft: 4,
  },

  noModules: {
    alignItems: "center",
    padding: 25,
    backgroundColor: COLORS.background,
    borderRadius: 15,
  },

  noModulesText: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },

  videoReference: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7F7",
    borderRadius: 15,
    padding: 14,
    marginTop: 25,
  },

  videoReferenceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  videoReferenceText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    backgroundColor: "#fff",
  },

  priceLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  price: {
    fontSize: 21,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },

  enrollButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 23,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 165,
  },

  enrolledButton: {
    backgroundColor: COLORS.success,
  },

  disabledButton: {
    opacity: 0.65,
  },

  enrollText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    marginLeft: 7,
  },
});
