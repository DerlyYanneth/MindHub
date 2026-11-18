import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
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

import { AuthContext } from "../../context/AuthContext";
import { removeInstructorStudentEnrollment } from "../../services/enrollmentService";
import {
  getWorkshopById,
  getWorkshopStudents,
} from "../../services/workshopService";

const C = {
  primary: "#E88B32",
  background: "#F5F6FC",
  text: "#20223A",
  muted: "#686B80",
  border: "#E5E6F0",
};

export default function InstructorStudentsScreen() {
  const { workshopId, workshopTitle } = useLocalSearchParams();
  const { user, role, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isSmall = width < 600;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const loadStudents = useCallback(async () => {
    if (authLoading) return;

    if (!user?.uid || role !== "instructor") {
      router.replace("/auth/login");
      return;
    }

    if (!workshopId) {
      setError("No se especificó el taller que deseas consultar.");
      setStudents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const workshop = await getWorkshopById(String(workshopId));

      if (!workshop || workshop.instructorId !== user.uid) {
        throw new Error(
          "No tienes permiso para consultar los estudiantes de este taller.",
        );
      }

      const result = await getWorkshopStudents(workshop.id);
      setStudents(result || []);
    } catch (err) {
      setError(
        err.message || "No fue posible cargar los estudiantes inscritos.",
      );
    } finally {
      setLoading(false);
    }
  }, [authLoading, role, user?.uid, workshopId, router]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const removeStudent = async (student) => {
    if (!student?.uid || !user?.uid || !workshopId) return;

    try {
      setRemovingId(student.uid);

      await removeInstructorStudentEnrollment(
        student.uid,
        String(workshopId),
        "workshop",
        user.uid,
      );

      await loadStudents();

      const message = "El estudiante fue retirado del taller correctamente.";

      if (Platform.OS === "web") {
        globalThis.alert?.(message);
      } else {
        Alert.alert("Estudiante retirado", message);
      }
    } catch (err) {
      const message =
        err.message || "No fue posible retirar al estudiante del taller.";

      if (Platform.OS === "web") {
        globalThis.alert?.(message);
      } else {
        Alert.alert("No se pudo retirar", message);
      }
    } finally {
      setRemovingId(null);
    }
  };

  const confirmRemoveStudent = (student) => {
    const name = student.name || "este estudiante";
    const message = `¿Deseas retirar a ${name} de este taller? Esta acción no eliminará su cuenta ni sus otras inscripciones.`;

    if (Platform.OS === "web") {
      if (globalThis.confirm?.(message)) {
        removeStudent(student);
      }
      return;
    }

    Alert.alert("Retirar estudiante", message, [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Retirar",
        style: "destructive",
        onPress: () => removeStudent(student),
      },
    ]);
  };

  if (loading || authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Cargando estudiantes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: isSmall ? 16 : 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={19} color={C.primary} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="people-outline" size={29} color={C.primary} />
          </View>

          <Text style={[styles.heading, { fontSize: isSmall ? 25 : 30 }]}>
            Mis estudiantes
          </Text>

          <Text style={styles.subtitle}>
            {String(workshopTitle || "Taller asignado")}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={22} color="#D94D67" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadStudents}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.countCard}>
              <View style={styles.countIcon}>
                <Ionicons name="people-outline" size={22} color={C.primary} />
              </View>

              <View style={styles.countInfo}>
                <Text style={styles.countNumber}>{students.length}</Text>
                <Text style={styles.countLabel}>Estudiantes inscritos</Text>
              </View>
            </View>

            {students.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="person-outline" size={34} color={C.primary} />
                <Text style={styles.emptyTitle}>
                  Todavía no hay estudiantes inscritos
                </Text>
                <Text style={styles.emptyText}>
                  Los participantes aparecerán aquí cuando se registren en el
                  taller.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {students.map((student, index) => {
                  const isRemoving = removingId === student.uid;

                  return (
                    <View
                      key={
                        student.uid || student.id || `${student.email}-${index}`
                      }
                      style={styles.studentCard}
                    >
                      <View style={styles.avatar}>
                        <Ionicons
                          name="person-outline"
                          size={23}
                          color={C.primary}
                        />
                      </View>

                      <View style={styles.studentInfo}>
                        <Text style={styles.name}>
                          {student.name || "Usuario de MindHub"}
                        </Text>
                        <Text style={styles.email}>
                          {student.email || "Sin correo registrado"}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.removeButton,
                          isRemoving && styles.disabledButton,
                        ]}
                        onPress={() => confirmRemoveStudent(student)}
                        disabled={Boolean(removingId)}
                        activeOpacity={0.75}
                      >
                        {isRemoving ? (
                          <ActivityIndicator size="small" color="#D94D67" />
                        ) : (
                          <>
                            <Ionicons
                              name="person-remove-outline"
                              size={18}
                              color="#D94D67"
                            />
                            <Text style={styles.removeButtonText}>Retirar</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </>
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
  screen: {
    flex: 1,
    width: "100%",
    backgroundColor: C.background,
  },
  content: {
    flexGrow: 1,
    width: "100%",
    alignSelf: "stretch",
    paddingTop: 25,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.background,
    padding: 24,
  },
  loadingText: {
    color: C.muted,
    marginTop: 12,
    fontSize: 13,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 25,
  },
  backText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  header: {
    alignItems: "flex-start",
    marginBottom: 23,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#FFF0E0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heading: {
    color: C.text,
    fontWeight: "900",
  },
  subtitle: {
    color: C.muted,
    fontSize: 13,
    marginTop: 7,
    lineHeight: 20,
  },
  countCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    marginBottom: 20,
  },
  countIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFF0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  countInfo: {
    gap: 3,
  },
  countNumber: {
    color: C.text,
    fontSize: 24,
    fontWeight: "900",
  },
  countLabel: {
    color: C.muted,
    fontSize: 12,
  },
  list: {
    gap: 12,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#FFF0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  studentInfo: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
  },
  email: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
  },
  removeButton: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#FFF0F2",
  },
  removeButtonText: {
    color: "#D94D67",
    fontSize: 12,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.6,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    padding: 28,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 12,
    textAlign: "center",
  },
  emptyText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    textAlign: "center",
    maxWidth: 430,
  },
  errorBox: {
    gap: 10,
    backgroundColor: "#FFF0F2",
    borderRadius: 13,
    padding: 15,
  },
  errorText: {
    color: "#D94D67",
    fontSize: 12,
    lineHeight: 19,
  },
  retryButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  retryText: {
    color: "#D94D67",
    fontSize: 13,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 32,
    paddingTop: 20,
  },
  footerText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "600",
  },
});
