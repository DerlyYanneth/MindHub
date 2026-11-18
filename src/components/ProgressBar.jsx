import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";

export default function ProgressBar({
  progress = 0,
  showLabel = true,
  color = COLORS.primary,
}) {
  const pct = Math.min(Math.max(progress, 0), 1);
  return (
    <View style={styles.wrap}>
      <View style={styles.bg}>
        <View
          style={[
            styles.fill,
            { width: `${pct * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>{Math.round(pct * 100)}% completado</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 6 },
  bg: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3 },
  label: { fontSize: 12, color: COLORS.textSecondary, marginTop: 5 },
});
