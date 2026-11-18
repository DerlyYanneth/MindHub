import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
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
    getUserCourseProgress,
    isUserEnrolled,
    updateCourseProgress,
} from "../../services/enrollmentService";
import { showAlert } from "../../utils/alert";

export default function LearningScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const courseId = Array.isArray(id) ? id[0] : id;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completedModules, setCompletedModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showCongratulations, setShowCongratulations] = useState(false);

  const modules =
    Array.isArray(course?.modules) && course.modules.length > 0
      ? course.modules
      : [
          {
            title: "Contenido principal",
            duration: course?.duration || "",
            videoUrl: course?.videoUrl || "",
            videoId: course?.videoId || "",
          },
        ];

  const totalModules = modules.length;
  const completedCount = completedModules.length;

  const progress = totalModules > 0 ? completedCount / totalModules : 0;

  const progressPercentage = Math.round(progress * 100);

  const allModulesCompleted =
    totalModules > 0 && completedCount === totalModules;

  const getYouTubeId = (value) => {
    if (!value || typeof value !== "string") return null;

    const input = value.trim();

    // Acepta directamente un ID de YouTube.
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return input;
    }

    // Acepta enlaces completos de YouTube.
    try {
      const url = new URL(
        input.startsWith("http") ? input : `https://${input}`,
      );

      const hostname = url.hostname.replace(/^www\./, "");

      if (
        hostname === "youtu.be" ||
        hostname === "m.youtube.com" ||
        hostname === "youtube.com" ||
        hostname === "youtube-nocookie.com"
      ) {
        if (hostname === "youtu.be") {
          return url.pathname.split("/").filter(Boolean)[0] || null;
        }

        const videoFromQuery = url.searchParams.get("v");

        if (videoFromQuery) return videoFromQuery;

        const parts = url.pathname.split("/").filter(Boolean);
        const videoIndex = parts.findIndex((part) =>
          ["embed", "shorts", "live"].includes(part),
        );

        if (videoIndex !== -1) {
          return parts[videoIndex + 1] || null;
        }
      }
    } catch (error) {
      console.log("No se pudo interpretar el enlace de YouTube.");
    }

    return null;
  };

  const loadLearning = useCallback(async () => {
    if (!courseId || !user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getCourseById(courseId);

      if (!data) {
        showAlert("Error", "No se encontró el curso.");
        setCourse(null);
        return;
      }

      const enrolled = await isUserEnrolled(user.uid, courseId);

      if (!enrolled) {
        showAlert(
          "Acceso restringido",
          "Debes inscribirte en este curso para acceder al contenido.",
        );

        router.replace(`/tabs/course-detail?id=${courseId}`);
        return;
      }

      setCourse(data);

      const courseModules =
        Array.isArray(data.modules) && data.modules.length > 0
          ? data.modules
          : [
              {
                title: "Contenido principal",
                duration: data.duration || "",
                videoUrl: data.videoUrl || "",
                videoId: data.videoId || "",
              },
            ];

      const savedProgress = await getUserCourseProgress(user.uid, courseId);

      const normalizedProgress = Math.max(
        0,
        Math.min(Number(savedProgress) || 0, 1),
      );

      const count = Math.round(normalizedProgress * courseModules.length);

      // El servicio actual guarda el progreso como una proporción.
      // Se reconstruye el número de módulos completados.
      setCompletedModules(Array.from({ length: count }, (_, index) => index));

      setSelectedModule(null);
      setShowCongratulations(false);
    } catch (error) {
      console.error("Error cargando el aprendizaje:", error);
      showAlert("Error", "No se pudo cargar el contenido del curso.");
    } finally {
      setLoading(false);
    }
  }, [courseId, user?.uid, router]);

  useEffect(() => {
    loadLearning();
  }, [loadLearning]);

  const openModule = (module, index) => {
    const rawVideo = module?.videoUrl || module?.videoId || module?.url || "";

    const videoId = getYouTubeId(rawVideo);

    if (!videoId) {
      showAlert(
        "Video no disponible",
        "Este módulo todavía no tiene un enlace de YouTube válido configurado.",
      );
      return;
    }

    setSelectedModule({
      ...module,
      videoId,
      index,
    });
  };

  const toggleModule = async (index) => {
    if (!user?.uid || !course || saving) return;

    const wasCompleted = completedModules.includes(index);

    const nextCompleted = wasCompleted
      ? completedModules.filter((item) => item !== index)
      : [...completedModules, index];

    const nextProgress =
      totalModules > 0 ? nextCompleted.length / totalModules : 0;

    try {
      setSaving(true);

      await updateCourseProgress(user.uid, courseId, nextProgress);

      // Actualiza el estado inmediatamente después de guardar.
      setCompletedModules(nextCompleted);

      if (!wasCompleted && nextCompleted.length === totalModules) {
        setShowCongratulations(true);
      }

      if (wasCompleted && nextCompleted.length < totalModules) {
        setShowCongratulations(false);
      }
    } catch (error) {
      console.error("Error guardando el progreso:", error);
      showAlert("Error", "No se pudo guardar tu progreso.");
    } finally {
      setSaving(false);
    }
  };

  const goToCourses = () => {
    setShowCongratulations(false);
    router.replace("/tabs/courses");
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tu aprendizaje...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.centered}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={COLORS.textSecondary}
        />

        <Text style={styles.emptyTitle}>No se encontró el curso</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/tabs/courses")}
        >
          <Text style={styles.primaryButtonText}>Explorar cursos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const generalVideoId = getYouTubeId(course.videoUrl || course.videoId || "");

  const displayedVideoId = selectedModule
    ? selectedModule.videoId
    : generalVideoId;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>MI APRENDIZAJE</Text>

        <Text style={styles.heading}>{course.title}</Text>

        <Text style={styles.description}>
          {course.description ||
            "Continúa aprendiendo a tu propio ritmo y completa cada módulo."}
        </Text>

        {/* PROGRESO DEL CURSO */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleContainer}>
              <Ionicons
                name="trending-up-outline"
                size={21}
                color={COLORS.primary}
              />

              <Text style={styles.progressTitle}>Tu progreso</Text>
            </View>

            <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                },
              ]}
            />
          </View>

          <View style={styles.progressFooter}>
            <Text style={styles.progressCount}>
              {completedCount} de {totalModules} módulos
            </Text>

            <Text style={styles.progressRemaining}>
              {allModulesCompleted
                ? "¡Curso completado!"
                : `Te faltan ${totalModules - completedCount}`}
            </Text>
          </View>
        </View>

        {/* REPRODUCTOR */}
        <View style={styles.videoCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="play-circle-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.videoHeadingContainer}>
              <Text style={styles.sectionTitle}>
                {selectedModule
                  ? selectedModule.title || `Módulo ${selectedModule.index + 1}`
                  : "Contenido audiovisual"}
              </Text>

              <Text style={styles.videoSubtitle}>
                {selectedModule
                  ? "Contenido del módulo seleccionado"
                  : "Selecciona un módulo para ver su video"}
              </Text>
            </View>
          </View>

          {displayedVideoId ? (
            <VideoPlayer
              key={displayedVideoId}
              videoId={displayedVideoId}
              height={230}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons
                name="videocam-outline"
                size={42}
                color={COLORS.textLight}
              />

              <Text style={styles.videoPlaceholderTitle}>
                Selecciona un módulo
              </Text>

              <Text style={styles.videoPlaceholderText}>
                El video del módulo aparecerá aquí cuando lo abras.
              </Text>
            </View>
          )}

          {selectedModule && (
            <TouchableOpacity
              style={styles.backToModules}
              onPress={() => setSelectedModule(null)}
            >
              <Ionicons
                name="arrow-back-outline"
                size={17}
                color={COLORS.primary}
              />

              <Text style={styles.backToModulesText}>
                Volver al contenido general
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LISTA DE MÓDULOS */}
        <View style={styles.modulesHeading}>
          <View>
            <Text style={styles.sectionTitle}>Módulos del curso</Text>

            <Text style={styles.modulesSubtitle}>
              Abre cada módulo y marca tu avance al terminarlo.
            </Text>
          </View>

          <View style={styles.modulesBadge}>
            <Text style={styles.modulesBadgeText}>
              {completedCount}/{totalModules}
            </Text>
          </View>
        </View>

        {modules.map((module, index) => {
          const completed = completedModules.includes(index);
          const selected = selectedModule?.index === index;

          return (
            <View
              key={`${module.title || "modulo"}-${index}`}
              style={[
                styles.moduleCard,
                selected && styles.moduleCardSelected,
                completed && styles.moduleCardCompleted,
              ]}
            >
              {/* Esta zona abre el video del módulo. */}
              <TouchableOpacity
                style={styles.moduleMain}
                onPress={() => openModule(module, index)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.moduleNumber,
                    completed && styles.moduleNumberCompleted,
                    selected && styles.moduleNumberSelected,
                  ]}
                >
                  {completed ? (
                    <Ionicons name="checkmark" size={21} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.moduleNumberText,
                        selected && styles.moduleNumberTextSelected,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>

                <View style={styles.moduleInfo}>
                  <Text style={styles.moduleTitle}>
                    {module.title || `Módulo ${index + 1}`}
                  </Text>

                  <View style={styles.moduleMetadata}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={COLORS.textSecondary}
                    />

                    <Text style={styles.moduleDuration}>
                      {module.duration || "Duración no especificada"}
                    </Text>
                  </View>

                  <View style={styles.openModuleLabel}>
                    <Ionicons
                      name="play-circle-outline"
                      size={15}
                      color={COLORS.primary}
                    />

                    <Text style={styles.openModuleText}>
                      {selected ? "Video abierto" : "Toca para ver el video"}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              {/* Esta acción es independiente: marca el módulo. */}
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  completed && styles.completeButtonActive,
                ]}
                onPress={() => toggleModule(index)}
                disabled={saving}
                activeOpacity={0.75}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons
                      name={completed ? "checkmark-circle" : "ellipse-outline"}
                      size={19}
                      color={completed ? COLORS.success : COLORS.textSecondary}
                    />

                    <Text
                      style={[
                        styles.completeButtonText,
                        completed && styles.completeButtonTextActive,
                      ]}
                    >
                      {completed
                        ? "Completado · Desmarcar"
                        : "Marcar como completado"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {allModulesCompleted && (
          <View style={styles.completedBanner}>
            <Ionicons name="trophy-outline" size={25} color={COLORS.success} />

            <View style={styles.completedBannerTextContainer}>
              <Text style={styles.completedBannerTitle}>
                ¡Excelente trabajo!
              </Text>

              <Text style={styles.completedBannerText}>
                Has completado todos los módulos de este curso.
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.bottomButton} onPress={goToCourses}>
          <Text style={styles.bottomButtonText}>Explorar más cursos</Text>

          <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* VENTANA DE FELICITACIONES */}
      <Modal
        visible={showCongratulations}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCongratulations(false)}
      >
        <View style={styles.congratulationsOverlay}>
          <View style={styles.congratulationsCard}>
            <View style={styles.congratulationsIcon}>
              <Ionicons name="trophy" size={44} color={COLORS.primary} />
            </View>

            <Text style={styles.congratulationsTitle}>¡Felicitaciones!</Text>

            <Text style={styles.congratulationsMessage}>
              ¡Has terminado tu curso! Completaste todos los módulos. Sigue
              aprendiendo y descubriendo nuevas habilidades en MindHub.
            </Text>

            <View style={styles.finishedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={19}
                color={COLORS.success}
              />

              <Text style={styles.finishedBadgeText}>
                Curso completado al 100%
              </Text>
            </View>

            <TouchableOpacity
              style={styles.exploreButton}
              onPress={goToCourses}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreButtonText}>Explorar más cursos</Text>

              <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setShowCongratulations(false)}
            >
              <Text style={styles.continueButtonText}>Volver al curso</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: COLORS.background,
  },

  content: {
    flexGrow: 1,
    width: "100%",
    alignSelf: "stretch",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 40,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  emptyTitle: {
    marginTop: 14,
    marginBottom: 20,
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 25,
    gap: 8,
  },

  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: COLORS.primary,
    marginBottom: 8,
  },

  heading: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.textSecondary,
    marginBottom: 23,
  },

  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  progressTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  progressTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  progressPercentage: {
    fontSize: 23,
    fontWeight: "800",
    color: COLORS.primary,
  },

  progressTrack: {
    height: 10,
    backgroundColor: "#ECE9F5",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },

  progressFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },

  progressCount: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  progressRemaining: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  videoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
    gap: 12,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F0ECFF",
    alignItems: "center",
    justifyContent: "center",
  },

  videoHeadingContainer: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },

  videoSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  videoPlaceholder: {
    minHeight: 210,
    borderRadius: 15,
    backgroundColor: "#F7F5FC",
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },

  videoPlaceholderTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },

  videoPlaceholderText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  backToModules: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 15,
    paddingVertical: 7,
  },

  backToModulesText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  modulesHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },

  modulesSubtitle: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  modulesBadge: {
    minWidth: 48,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#F0ECFF",
    alignItems: "center",
    justifyContent: "center",
  },

  modulesBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },

  moduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 13,
    overflow: "hidden",
  },

  moduleCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },

  moduleCardCompleted: {
    borderColor: "#CDEBDD",
  },

  moduleMain: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 17,
    gap: 13,
  },

  moduleNumber: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#F0ECFF",
    alignItems: "center",
    justifyContent: "center",
  },

  moduleNumberCompleted: {
    backgroundColor: COLORS.success,
  },

  moduleNumberSelected: {
    backgroundColor: "#E4DEFF",
  },

  moduleNumberText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },

  moduleNumberTextSelected: {
    color: COLORS.primary,
  },

  moduleInfo: {
    flex: 1,
    minWidth: 0,
  },

  moduleTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  moduleMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },

  moduleDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  openModuleLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },

  openModuleText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  completeButton: {
    minHeight: 46,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: "#FBFAFE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 8,
  },

  completeButtonActive: {
    backgroundColor: "#F0FBF5",
    borderTopColor: "#CDEBDD",
  },

  completeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  completeButtonTextActive: {
    color: COLORS.success,
  },

  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "#F0FBF5",
    borderColor: "#CDEBDD",
    borderWidth: 1,
    borderRadius: 17,
    padding: 17,
    marginTop: 8,
    marginBottom: 18,
  },

  completedBannerTextContainer: {
    flex: 1,
  },

  completedBannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },

  completedBannerText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  bottomButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 10,
  },

  bottomButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  congratulationsOverlay: {
    flex: 1,
    backgroundColor: "rgba(25, 20, 45, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  congratulationsCard: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    padding: 27,
    alignItems: "center",
  },

  congratulationsIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#F0ECFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 19,
  },

  congratulationsTitle: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },

  congratulationsMessage: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 18,
  },

  finishedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#F0FBF5",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 13,
    marginBottom: 22,
  },

  finishedBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.success,
  },

  exploreButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },

  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  continueButton: {
    paddingVertical: 14,
    marginTop: 4,
  },

  continueButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
