import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { COLORS } from "../constants/colors";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/auth/login");
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>MindHub</Text>

        <Text style={styles.subtitle}>Aprende. Crea. Explora.</Text>
      </View>

      <ActivityIndicator size="large" color={COLORS.primary || "#2563EB"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  logo: {
    fontSize: 38,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: -1,
  },

  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 6,
  },
});
