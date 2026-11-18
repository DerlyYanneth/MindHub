import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";
import { COLORS } from "../../constants/colors";

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon = null,
  style,
}) {
  const variantStyles = {
    primary: { bg: COLORS.primary, text: "#fff", border: "transparent" },
    secondary: { bg: "#fff", text: COLORS.primary, border: COLORS.primary },
    danger: { bg: COLORS.danger, text: "#fff", border: "transparent" },
    outline: {
      bg: "transparent",
      text: COLORS.textPrimary,
      border: COLORS.border,
    },
  };
  const v = variantStyles[variant] || variantStyles.primary;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border },
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: v.text }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    gap: 8,
  },
  text: { fontSize: 16, fontWeight: "bold" },
});
