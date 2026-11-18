import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../hooks/useAuth";

export default function CreateCourse() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E88B32" />
        <Text style={styles.text}>Verificando permisos...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (role !== "instructor") {
    return <Redirect href="/tabs/home" />;
  }

  return <Redirect href="/instructor/dashboard" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F6FC",
    padding: 24,
  },
  text: {
    color: "#777B91",
    marginTop: 12,
    fontSize: 13,
  },
});
