import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { getCoursesByInstructor } from "../../services/courseService";
import { db } from "../../services/firebaseConfig";

const PRIMARY = "#6555D9";
const ACCENT = COLORS.instructor || "#E88B32";

export default function InstructorCourses() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [studentsError, setStudentsError] = useState("");

  const columns = width >= 1500 ? 4 : width >= 950 ? 3 : width >= 600 ? 2 : 1;

  const loadCourses = useCallback(async () => {
    if (!user?.uid) {
      setCourses([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError("");
      const result = await getCoursesByInstructor(user.uid);
      setCourses(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Error cargando cursos:", err);
      setError("No fue posible cargar tus cursos. Intenta nuevamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCourses();
    }, [loadCourses]),
  );

  const openCourse = async (course) => {
    setSelectedCourse(course);
    setStudents([]);
    setStudentsError("");
    setStudentsLoading(true);

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));

      const enrolledStudents = usersSnapshot.docs
        .map((userDoc) => ({
          id: userDoc.id,
          ...userDoc.data(),
        }))
        .filter((student) => {
          const enrolledCourses = Array.isArray(student.enrolledCourses)
            ? student.enrolledCourses
            : [];

          return enrolledCourses.includes(course.id);
        })
        .map((student) => ({
          ...student,
          name:
            student.name ||
            student.fullName ||
            student.displayName ||
            "Estudiante",
          email: student.email || "Correo no disponible",
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setStudents(enrolledStudents);
    } catch (err) {
      console.error("Error cargando estudiantes del curso:", err);
      setStudentsError(
        "No fue posible consultar los estudiantes inscritos. Intenta nuevamente.",
      );
    } finally {
      setStudentsLoading(false);
    }
  };

  const retryStudents = () => {
    if (selectedCourse) {
      openCourse(selectedCourse);
    }
  };

  const getTitle = (course) =>
    course.title || course.name || "Curso sin título";

  const getDescription = (course) =>
    course.description || course.objective || "Sin descripción disponible.";

  const goBack = () => {
    setSelectedCourse(null);
    setStudents([]);
    setStudentsError("");
  };

  const renderStudent = (student, index) => {
    const initials = student.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");

    return (
      <View key={student.id || index} style={styles.studentCard}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentInitials}>{initials || "E"}</Text>
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentEmail}>{student.email}</Text>
        </View>

        <Ionicons name="checkmark-circle" size={22} color="#159A75" />
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCourses();
            }}
            tintColor={ACCENT}
          />
        }
      >
        <View style={styles.page}>
          {selectedCourse ? (
            <>
              <TouchableOpacity
                style={styles.backButton}
                onPress={goBack}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={19} color={PRIMARY} />
                <Text style={styles.backText}>Volver a mis cursos</Text>
              </TouchableOpacity>

              <View style={styles.detailHeader}>
                <View style={styles.headerIcon}>
                  <Ionicons name="book-outline" size={29} color={ACCENT} />
                </View>

                <View style={styles.headerText}>
                  <Text style={styles.title}>{getTitle(selectedCourse)}</Text>
                  <Text style={styles.subtitle}>
                    Detalles y estudiantes inscritos
                  </Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.sectionHeading}>Información del curso</Text>

                <Text style={styles.fieldLabel}>Descripción</Text>
                <Text style={styles.description}>
                  {getDescription(selectedCourse)}
                </Text>

                {selectedCourse.objective ? (
                  <>
                    <Text style={styles.fieldLabel}>Objetivo</Text>
                    <Text style={styles.description}>
                      {selectedCourse.objective}
                    </Text>
                  </>
                ) : null}

                {selectedCourse.category ? (
                  <View style={styles.metadataRow}>
                    <Ionicons
                      name="pricetag-outline"
                      size={18}
                      color={PRIMARY}
                    />
                    <Text style={styles.metadataText}>
                      Categoría: {selectedCourse.category}
                    </Text>
                  </View>
                ) : null}

                {Array.isArray(selectedCourse.modules) ? (
                  <View style={styles.metadataRow}>
                    <Ionicons name="layers-outline" size={18} color={PRIMARY} />
                    <Text style={styles.metadataText}>
                      {selectedCourse.modules.length} módulos
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.studentsHeader}>
                <View style={styles.studentsHeaderText}>
                  <Text style={styles.sectionHeading}>
                    Estudiantes inscritos
                  </Text>
                  <Text style={styles.subtitle}>
                    Usuarios registrados en este curso.
                  </Text>
                </View>

                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {studentsLoading ? "…" : students.length}
                  </Text>
                </View>
              </View>

              {studentsLoading ? (
                <View style={styles.state}>
                  <ActivityIndicator size="large" color={PRIMARY} />
                  <Text style={styles.stateText}>
                    Consultando estudiantes...
                  </Text>
                </View>
              ) : studentsError ? (
                <View style={styles.state}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={36}
                    color="#D9534F"
                  />
                  <Text style={styles.stateTitle}>
                    No se pudo cargar la lista
                  </Text>
                  <Text style={styles.stateText}>{studentsError}</Text>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={retryStudents}
                  >
                    <Text style={styles.primaryButtonText}>
                      Intentar nuevamente
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : students.length === 0 ? (
                <View style={styles.state}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="people-outline" size={35} color={PRIMARY} />
                  </View>
                  <Text style={styles.stateTitle}>
                    Aún no hay estudiantes inscritos
                  </Text>
                  <Text style={styles.stateText}>
                    Cuando un usuario se inscriba en este curso, aparecerá aquí.
                  </Text>
                </View>
              ) : (
                <View style={styles.studentList}>
                  {students.map(renderStudent)}
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.pageHeader}>
                <View style={styles.headerIcon}>
                  <Ionicons name="book-outline" size={29} color={ACCENT} />
                </View>

                <View style={styles.headerText}>
                  <Text style={styles.title}>Mis cursos</Text>
                  <Text style={styles.subtitle}>
                    Consulta los cursos que tienes asignados y revisa sus
                    estudiantes inscritos.
                  </Text>
                </View>
              </View>

              <View style={styles.summary}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="library-outline" size={25} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.summaryNumber}>{courses.length}</Text>
                  <Text style={styles.summaryLabel}>
                    {courses.length === 1
                      ? "Curso asignado"
                      : "Cursos asignados"}
                  </Text>
                </View>
              </View>

              {loading ? (
                <View style={styles.state}>
                  <ActivityIndicator size="large" color={ACCENT} />
                  <Text style={styles.stateText}>Cargando tus cursos...</Text>
                </View>
              ) : error ? (
                <View style={styles.state}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={38}
                    color="#D9534F"
                  />
                  <Text style={styles.stateTitle}>
                    No se pudieron cargar los cursos
                  </Text>
                  <Text style={styles.stateText}>{error}</Text>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => {
                      setLoading(true);
                      loadCourses();
                    }}
                  >
                    <Text style={styles.primaryButtonText}>
                      Intentar nuevamente
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : courses.length === 0 ? (
                <View style={styles.state}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="book-outline" size={35} color={PRIMARY} />
                  </View>
                  <Text style={styles.stateTitle}>
                    No tienes cursos asignados
                  </Text>
                  <Text style={styles.stateText}>
                    Cuando el administrador te asigne cursos, aparecerán aquí.
                  </Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {courses.map((course, index) => (
                    <TouchableOpacity
                      key={course.id || course.courseId || index}
                      style={[
                        styles.courseCard,
                        { width: `${100 / columns - 1}%` },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => openCourse(course)}
                    >
                      <View style={styles.cardTop}>
                        <View style={styles.courseIcon}>
                          <Ionicons name="book" size={24} color={PRIMARY} />
                        </View>

                        <Ionicons
                          name="chevron-forward-circle-outline"
                          size={25}
                          color={PRIMARY}
                        />
                      </View>

                      <Text style={styles.courseTitle}>{getTitle(course)}</Text>

                      <Text style={styles.courseDescription} numberOfLines={4}>
                        {getDescription(course)}
                      </Text>

                      <View style={styles.cardDivider} />

                      <View style={styles.statItem}>
                        <Ionicons
                          name="people-outline"
                          size={18}
                          color={PRIMARY}
                        />
                        <Text style={styles.statText}>
                          {Number(course.students) || 0} estudiantes
                        </Text>
                      </View>

                      <View style={styles.openLabel}>
                        <Text style={styles.openLabelText}>
                          Ver detalles y estudiantes
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={15}
                          color={PRIMARY}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={styles.footer}>
            <Ionicons name="bulb-outline" size={17} color={ACCENT} />
            <Text style={styles.footerText}>
              MindHub · Aprender, crear y descubrir
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F7F5FC",
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  content: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  page: {
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 26,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 25,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 19,
    backgroundColor: "#FFF0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#29273A",
  },
  subtitle: {
    fontSize: 14,
    color: "#77758B",
    marginTop: 6,
    lineHeight: 21,
  },
  summary: {
    width: "100%",
    minHeight: 105,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
    marginBottom: 26,
  },
  summaryIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#8173E7",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryNumber: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "900",
  },
  summaryLabel: {
    color: "#F0EDFF",
    fontSize: 13,
    marginTop: 3,
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    justifyContent: "flex-start",
    gap: 16,
  },
  courseCard: {
    flexGrow: 1,
    flexBasis: "auto",
    minWidth: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEEAF7",
    padding: 21,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 19,
  },
  courseIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: "#F0ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  courseTitle: {
    color: "#29273A",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 24,
  },
  courseDescription: {
    color: "#77758B",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9,
    minHeight: 60,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F0EDF6",
    marginVertical: 17,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    color: "#77758B",
    fontSize: 12,
    flexShrink: 1,
  },
  openLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "#F0ECFF",
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 18,
  },
  openLabelText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "800",
    flexShrink: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE7F4",
    marginBottom: 25,
  },
  backText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: "800",
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEEAF7",
    borderRadius: 20,
    padding: 23,
    marginBottom: 28,
  },
  sectionHeading: {
    color: "#29273A",
    fontSize: 19,
    fontWeight: "900",
  },
  fieldLabel: {
    color: "#49465E",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 19,
    marginBottom: 7,
  },
  description: {
    color: "#77758B",
    fontSize: 14,
    lineHeight: 22,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 17,
  },
  metadataText: {
    color: "#77758B",
    fontSize: 13,
    flexShrink: 1,
  },
  studentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  studentsHeaderText: {
    flex: 1,
  },
  countBadge: {
    minWidth: 43,
    height: 43,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#F0ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: PRIMARY,
    fontSize: 17,
    fontWeight: "900",
  },
  studentList: {
    gap: 12,
  },
  studentCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEEAF7",
    borderRadius: 16,
    padding: 17,
  },
  studentAvatar: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: "#F0ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  studentInitials: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: "900",
  },
  studentInfo: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    color: "#29273A",
    fontSize: 14,
    fontWeight: "800",
  },
  studentEmail: {
    color: "#858298",
    fontSize: 12,
    marginTop: 5,
  },
  state: {
    width: "100%",
    minHeight: 270,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 23,
    backgroundColor: "#F0ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  stateTitle: {
    color: "#29273A",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 14,
  },
  stateText: {
    color: "#858298",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#EAE7F4",
    marginTop: 32,
    paddingTop: 20,
    paddingBottom: 8,
  },
  footerText: {
    color: "#A19DB2",
    fontSize: 12,
    fontWeight: "600",
  },
});
