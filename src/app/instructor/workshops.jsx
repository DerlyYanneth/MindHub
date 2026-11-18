import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { useAuth } from "../../hooks/useAuth";
import { getWorkshopsByInstructor } from "../../services/workshopService";

const C = {
  primary: "#E88B32",
  background: "#F5F6FC",
  surface: "#FFFFFF",
  text: "#20223A",
  muted: "#686B80",
  border: "#E5E6F0",
};

export default function InstructorWorkshopsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isSmall = width < 600;
  const isWide = width >= 1100;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?.uid) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getWorkshopsByInstructor(user.uid);
      setItems(result || []);
    } catch (err) {
      console.error("Error consultando talleres:", err);
      setError("No se pudieron cargar tus talleres.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: isSmall ? 16 : isWide ? 38 : 25 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingRow}>
          <View style={styles.headingText}>
            <View style={styles.badge}>
              <Ionicons
                name="color-palette-outline"
                size={15}
                color={C.primary}
              />
              <Text style={styles.badgeText}>MIS ACTIVIDADES</Text>
            </View>

            <Text style={[styles.title, { fontSize: isSmall ? 25 : 31 }]}>
              Mis talleres
            </Text>

            <Text style={styles.subtitle}>
              Consulta los talleres que te ha asignado el administrador y revisa
              sus participantes.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={load}
            disabled={loading}
            accessibilityLabel="Actualizar talleres"
          >
            {loading ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <Ionicons name="refresh-outline" size={21} color={C.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Ionicons name="calendar-outline" size={25} color={C.primary} />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryNumber}>{items.length}</Text>
            <Text style={styles.summaryLabel}>Talleres asignados</Text>
          </View>
        </View>

        {error ? (
          <TouchableOpacity style={styles.errorBox} onPress={load}>
            <Ionicons name="alert-circle-outline" size={21} color="#D94D67" />
            <Text style={styles.errorText}>{error} Toca para reintentar.</Text>
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Cargando tus talleres...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="color-palette-outline"
                size={35}
                color={C.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>No tienes talleres asignados</Text>
            <Text style={styles.emptyText}>
              Cuando el administrador te asigne un taller, podrás consultar aquí
              su información y los estudiantes inscritos.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {items.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  { width: isSmall ? "100%" : isWide ? "31.5%" : "48%" },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardIcon}>
                    <Ionicons
                      name="color-palette-outline"
                      size={24}
                      color={C.primary}
                    />
                  </View>
                  <View style={styles.status}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Asignado</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>
                  {item.title || "Taller sin título"}
                </Text>

                <Text style={styles.description}>
                  {item.description || "No hay descripción disponible."}
                </Text>

                {item.objective ? (
                  <View style={styles.detail}>
                    <Ionicons name="flag-outline" size={16} color={C.muted} />
                    <Text style={styles.detailText}>
                      Objetivo: {item.objective}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.detail}>
                  <Ionicons
                    name="calendar-outline"
                    size={17}
                    color={C.primary}
                  />
                  <Text style={styles.detailText}>
                    Fecha: {item.date || "Por definir"}
                  </Text>
                </View>

                <View style={styles.detail}>
                  <Ionicons name="time-outline" size={17} color={C.primary} />
                  <Text style={styles.detailText}>
                    Horario: {item.schedule || "Por definir"}
                  </Text>
                </View>

                <View style={styles.detail}>
                  <Ionicons
                    name="location-outline"
                    size={17}
                    color={C.primary}
                  />
                  <Text style={styles.detailText}>
                    {item.location || "Modalidad por definir"}
                  </Text>
                </View>

                <View style={styles.detail}>
                  <Ionicons name="people-outline" size={17} color={C.primary} />
                  <Text style={styles.detailText}>
                    Inscritos:{" "}
                    {Array.isArray(item.enrolled) ? item.enrolled.length : 0}
                    {" / "}
                    {item.capacity ?? 20}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.studentsButton}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: "/instructor/students",
                      params: {
                        workshopId: item.id,
                        workshopTitle: item.title || "Taller",
                      },
                    })
                  }
                >
                  <Ionicons name="people-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.studentsButtonText}>
                    Consultar estudiantes
                  </Text>
                  <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
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
    paddingBottom: 42,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 23,
  },
  headingText: { flex: 1, minWidth: 0 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFF0E0",
    marginBottom: 10,
  },
  badgeText: {
    color: C.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  title: { color: C.text, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 750,
  },
  refreshButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#FFF0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 18,
    backgroundColor: C.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 23,
  },
  summaryIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: "#FFF0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: { gap: 3 },
  summaryNumber: { color: C.text, fontSize: 23, fontWeight: "900" },
  summaryLabel: { color: C.muted, fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 15 },
  card: {
    flexGrow: 1,
    minWidth: 250,
    backgroundColor: C.surface,
    borderRadius: 19,
    padding: 19,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: "#FFF0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF8F3",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#159A75",
  },
  statusText: { color: "#16866B", fontSize: 10, fontWeight: "800" },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: "900", lineHeight: 22 },
  description: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 13,
  },
  detail: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
  },
  detailText: { flex: 1, color: C.muted, fontSize: 12, lineHeight: 18 },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginTop: 3,
    marginBottom: 3,
  },
  studentsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 19,
  },
  studentsButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 45,
  },
  loadingText: { color: C.muted, marginTop: 12, fontSize: 12 },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 21,
    backgroundColor: "#FFF0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 15,
    textAlign: "center",
  },
  emptyText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 7,
    textAlign: "center",
    maxWidth: 470,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#FFF0F2",
    borderRadius: 12,
    padding: 13,
    marginBottom: 16,
  },
  errorText: { flex: 1, color: "#D94D67", fontSize: 12, lineHeight: 18 },
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
  footerText: { color: C.muted, fontSize: 11, fontWeight: "600" },
});
