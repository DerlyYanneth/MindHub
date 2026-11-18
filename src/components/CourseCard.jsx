import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/colors";

const IMAGE_FALLBACK =
  "https://placehold.co/800x500/EAF2FF/0061F2.png?text=MindHub";

function getInstructorName(instructor) {
  if (typeof instructor === "string" && instructor.trim()) {
    return instructor;
  }

  if (instructor && typeof instructor === "object") {
    return (
      instructor.name ||
      instructor.displayName ||
      instructor.email ||
      "Instructor MindHub"
    );
  }

  return "Instructor MindHub";
}

function formatPrice(price) {
  if (price === undefined || price === null || price === "") {
    return "Gratis";
  }

  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return "Gratis";
  }

  return `$${numericPrice.toLocaleString("es-CO")}`;
}

export default function CourseCard({ course, onPress, horizontal = false }) {
  if (!course) return null;

  const title = course.title || course.name || "Curso de MindHub";
  const category = course.category || "Aprendizaje creativo";

  const instructor = getInstructorName(
    course.instructorName || course.instructor,
  );

  const ratingValue = Number(course.rating);
  const rating =
    Number.isFinite(ratingValue) && ratingValue > 0
      ? ratingValue.toFixed(1)
      : "Nuevo";

  const imageUri =
    course.imageUrl || course.thumbnail || course.image || IMAGE_FALLBACK;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        horizontal ? styles.horizontalCard : styles.gridCard,
      ]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`Ver curso ${title}`}
    >
      <View
        style={[
          styles.imageContainer,
          horizontal && styles.horizontalImageContainer,
        ]}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText} numberOfLines={1}>
            {category}
          </Text>
        </View>

        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={13} color={COLORS.star} />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.instructorRow}>
          <Ionicons
            name="person-outline"
            size={14}
            color={COLORS.textSecondary}
          />

          <Text style={styles.instructor} numberOfLines={1}>
            {instructor}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceCaption}>Precio</Text>
            <Text style={styles.price}>{formatPrice(course.price)}</Text>
          </View>

          <View style={styles.arrowButton}>
            <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  gridCard: {
    flex: 1,
    minWidth: 0,
  },

  horizontalCard: {
    width: 258,
    marginRight: SPACING.md,
    marginBottom: SPACING.xs,
  },

  imageContainer: {
    height: 148,
    width: "100%",
    backgroundColor: COLORS.primarySoft,
    position: "relative",
  },

  horizontalImageContainer: {
    height: 142,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  categoryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    maxWidth: "76%",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
  },

  categoryBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "700",
  },

  ratingBadge: {
    position: "absolute",
    right: 10,
    top: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
  },

  ratingText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },

  content: {
    padding: SPACING.md,
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    minHeight: 44,
  },

  instructorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 14,
  },

  instructor: {
    flex: 1,
    minWidth: 0,
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginBottom: 12,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  priceContainer: {
    flex: 1,
    minWidth: 0,
  },

  priceCaption: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 3,
  },

  price: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },

  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
