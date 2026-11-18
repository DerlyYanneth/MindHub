import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { COLORS } from "../constants/colors";

export default function Header({
  title,
  subtitle,
  onBack,
  showBell = false,
  onBellPress,
}) {
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 768;

  return (
    <View style={[styles.container, isWideScreen && styles.containerWeb]}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      )}

      <View style={styles.textWrap}>
        <Text
          style={[styles.title, isWideScreen && styles.titleWeb]}
          numberOfLines={2}
        >
          {title}
        </Text>

        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {showBell && (
        <TouchableOpacity
          onPress={onBellPress}
          style={styles.bellBtn}
          accessibilityRole="button"
          accessibilityLabel="Notificaciones"
          activeOpacity={0.75}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 30,
    width: "100%",
  },

  containerWeb: {
    paddingVertical: 18,
    marginTop: 18,
  },

  backBtn: {
    marginRight: 12,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },

  bellBtn: {
    marginLeft: "auto",
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },

  textWrap: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },

  titleWeb: {
    fontSize: 27,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
