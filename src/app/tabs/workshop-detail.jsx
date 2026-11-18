import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AuthContext } from "../../context/AuthContext";
import {
  enrollInWorkshop,
  getWorkshopById,
} from "../../services/workshopService";

export default function WorkshopDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await getWorkshopById(String(id || ""));
        if (!active) return;

        setWorkshop(data);
        setEnrolled(Boolean(user?.uid && data?.enrolled?.includes(user.uid)));
      } catch (error) {
        Alert.alert("Error", error.message || "No se pudo cargar el taller.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id, user?.uid]);

  const enroll = async () => {
    if (!user?.uid) {
      router.push("/auth/login");
      return;
    }

    if (!workshop) return;

    if (Number(workshop.price || 0) > 0) {
      Alert.alert(
        "Taller con costo",
        "La inscripción directa está habilitada para esta versión sin pasarela de pagos. No se registrará un pago ni se confirmará una transacción.",
      );
      return;
    }

    try {
      setSaving(true);
      await enrollInWorkshop(workshop.id, {
        uid: user.uid,
        role: "user",
      });
      setEnrolled(true);
      setWorkshop(await getWorkshopById(workshop.id));
      Alert.alert(
        "Inscripción exitosa",
        "El taller ya aparece en tus actividades.",
      );
    } catch (error) {
      Alert.alert(
        "No se pudo completar",
        error.message || "Inténtalo de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6D5DFB" />
        <Text>Cargando información...</Text>
      </View>
    );
  }

  if (!workshop) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>No encontramos este taller.</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const enrolledCount = workshop.enrolled?.length || 0;
  const capacity = Number(workshop.capacity) || 20;
  const full = enrolledCount >= capacity;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>✦</Text>
        <Text style={styles.category}>
          {workshop.category || "Creatividad"}
        </Text>
        <Text style={styles.title}>{workshop.title}</Text>
        <Text style={styles.description}>{workshop.description}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Información del taller</Text>
        <Info
          label="Instructor"
          value={workshop.instructor || "Equipo MindHub"}
        />
        <Info label="Fecha" value={workshop.date || "Por definir"} />
        <Info label="Horario" value={workshop.schedule || "Por definir"} />
        <Info
          label="Modalidad o lugar"
          value={workshop.location || "Virtual"}
        />
        <Info label="Duración" value={workshop.duration || "Por definir"} />
        <Info
          label="Cupos disponibles"
          value={`${Math.max(0, capacity - enrolledCount)} de ${capacity}`}
        />
        <Info
          label="Precio"
          value={
            Number(workshop.price || 0) === 0
              ? "Gratuito"
              : `$${Number(workshop.price).toLocaleString("es-CO")} COP`
          }
        />
      </View>

      {!!workshop.objective && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Objetivo de aprendizaje</Text>
          <Text style={styles.description}>{workshop.objective}</Text>
        </View>
      )}

      {enrolled ? (
        <View style={styles.success}>
          <Text style={styles.successText}>
            Ya estás inscrito en este taller.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => router.push("/tabs/enrollment")}
          >
            <Text style={styles.buttonText}>Ver mis inscripciones</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.button, (full || saving) && styles.disabled]}
          onPress={enroll}
          disabled={full || saving}
        >
          <Text style={styles.buttonText}>
            {saving
              ? "Procesando..."
              : full
                ? "Cupos agotados"
                : Number(workshop.price || 0) > 0
                  ? "Consultar inscripción"
                  : "Inscribirme gratis"}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F6FC" },
  content: { padding: 18, paddingBottom: 35, gap: 14 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  hero: { backgroundColor: "#EEEAFE", borderRadius: 20, padding: 20, gap: 9 },
  heroIcon: { color: "#6D5DFB", fontSize: 34 },
  category: { color: "#5948D6", fontWeight: "800" },
  title: { color: "#20223A", fontSize: 25, fontWeight: "800" },
  description: { color: "#60637A", lineHeight: 22 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 17, gap: 12 },
  sectionTitle: { color: "#20223A", fontSize: 18, fontWeight: "800" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  infoLabel: { flex: 1, color: "#777A8E", fontSize: 13 },
  infoValue: {
    flex: 1,
    textAlign: "right",
    color: "#20223A",
    fontWeight: "700",
    fontSize: 13,
  },
  button: {
    backgroundColor: "#6D5DFB",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "800" },
  disabled: { opacity: 0.5 },
  success: {
    gap: 10,
    backgroundColor: "#E7F7ED",
    borderRadius: 14,
    padding: 14,
  },
  successText: { color: "#236D43", fontWeight: "800" },
});
