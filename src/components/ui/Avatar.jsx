import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function Avatar({
  name,
  uri,
  size = 50,
  color = COLORS.primary,
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>
        {(name || "?").charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { justifyContent: "center", alignItems: "center" },
  text: { color: "#fff", fontWeight: "bold" },
});
