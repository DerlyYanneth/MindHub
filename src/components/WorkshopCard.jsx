import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/colors";

function getDateParts(workshop) {
  const dateValue = workshop?.date || workshop?.startDate;

  if (dateValue) {
    const date = new Date(dateValue);

    if (!Number.isNaN(date.getTime())) {
      return {
        day: date.toLocaleDateString("es-CO", { day: "2-digit" }),
        month: date
          .toLocaleDateString("es-CO", { month: "short" })
          .replace(".", "")
          .toUpperCase(),
      };
    }
  }

  return {
    day: "--",
    month: "FECHA",
  };
}

function getAvailableSpots(workshop) {
  const capacity = Number(workshop?.capacity);
  const enrolled = Array.isArray(workshop?.enrolled)
    ? workshop.enrolled.length
    : Number(workshop?.enrolledCount || 0);

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return null;
  }

  return Math.max(0, capacity - enrolled);
}

export default function WorkshopCard({ workshop, onPress }) {
  if (!workshop) return null;

  const title = workshop.title || "Taller de MindHub";
  const date = getDateParts(workshop);
  const availableSpots = getAvailableSpots(workshop);

  const schedule =
    workshop.schedule || workshop.time || "Horario por confirmar";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Ver taller ${title}`}
    >
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{workshop.day || date.day}</Text>
        <Text style={styles.dateMonth}>{workshop.month || date.month}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.scheduleRow}>
          <Ionicons
            name="time-outline"
            size={14}
            color={COLORS.textSecondary}
          />
          <Text style={styles.schedule} numberOfLines={1}>
            {schedule}
          </Text>
        </View>

        <View style={styles.spotsRow}>
          <Ionicons
            name="people-outline"
            size={14}
            color={
              availableSpots === 0
                ? COLORS.error || COLORS.textSecondary
                : COLORS.success
            }
          />

          <Text
            style={[styles.spots, availableSpots === 0 && styles.fullSpots]}
            numberOfLines={1}
          >
            {availableSpots === null
              ? "Cupos por confirmar"
              : availableSpots === 0
                ? "Cupos agotados"
                : `${availableSpots} cupos disponibles`}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white || "#FFFFFF",
    padding: SPACING.md || 12,
    borderRadius: RADIUS.lg || 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md || 12,
    shadowColor: COLORS.shadow || "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  dateBox: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: RADIUS.md || 12,
    alignItems: "center",
    justifyContent: "center",
    width: 62,
    minHeight: 64,
  },

  dateDay: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  dateMonth: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 3,
  },

  info: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
    marginRight: 8,
  },

  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },

  schedule: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  spotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },

  spots: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: COLORS.success,
  },

  fullSpots: {
    color: COLORS.textSecondary,
  },
});
