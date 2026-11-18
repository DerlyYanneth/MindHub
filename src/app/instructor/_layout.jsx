import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";

export default function InstructorLayout() {
  const { user, role, loading } = useAuth();
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 768;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.instructor || "#E88B32"}
        />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (role !== "instructor") {
    return <Redirect href="/tabs/home" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.instructor || "#E88B32",
        tabBarInactiveTintColor: "#85889D",
        tabBarStyle: {
          height: isWideScreen ? 72 : 66,
          paddingTop: 7,
          paddingBottom: 8,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E8E9F2",
          borderTopWidth: 1,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: isWideScreen ? 12 : 10,
          fontWeight: "700",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 1,
        },
      }}
    >
      {/* Inicio del instructor */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Mi espacio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size || 22} color={color} />
          ),
        }}
      />

      {/* Cursos asignados al instructor */}
      <Tabs.Screen
        name="courses"
        options={{
          title: "Mis cursos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size || 22} color={color} />
          ),
        }}
      />

      {/* Talleres asignados al instructor */}
      <Tabs.Screen
        name="workshops"
        options={{
          title: "Mis talleres",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="color-palette-outline"
              size={size || 22}
              color={color}
            />
          ),
        }}
      />

      {/* Perfil y opciones informativas */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Mi perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-circle-outline"
              size={size || 23}
              color={color}
            />
          ),
        }}
      />

      {/* Pantallas internas, no visibles en la barra */}
      <Tabs.Screen
        name="students"
        options={{
          href: null,
          title: "Estudiantes",
        }}
      />

      <Tabs.Screen
        name="create-course"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="manual"
        options={{
          href: null,
          title: "Manual del instructor",
        }}
      />

      <Tabs.Screen
        name="about"
        options={{
          href: null,
          title: "Acerca de MindHub",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F6F7FB",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#777B91",
  },
});
