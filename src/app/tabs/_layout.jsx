import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const { user, role, loading } = useAuth();
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 768;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (role === "admin" || role === "administrator") {
    return <Redirect href="/admin/dashboard" />;
  }

  if (role === "instructor") {
    return <Redirect href="/instructor/dashboard" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: [styles.tabBar, isWideScreen && styles.tabBarWeb],
        tabBarLabelStyle: [
          styles.tabBarLabel,
          isWideScreen && styles.tabBarLabelWeb,
        ],
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {/* Inicio */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      {/* Cursos */}
      <Tabs.Screen
        name="courses"
        options={{
          title: "Cursos",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      {/* Talleres */}
      <Tabs.Screen
        name="workshops"
        options={{
          title: "Talleres",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "color-palette" : "color-palette-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      {/* Perfil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      {/* Pantallas internas: no aparecen en la barra inferior */}
      <Tabs.Screen name="course-detail" options={{ href: null }} />
      <Tabs.Screen name="learning" options={{ href: null }} />

      <Tabs.Screen name="workshop-detail" options={{ href: null }} />

      <Tabs.Screen name="my-courses" options={{ href: null }} />

      <Tabs.Screen name="enrollment" options={{ href: null }} />

      <Tabs.Screen name="manual" options={{ href: null }} />

      {/* About permanece oculto en la barra inferior */}
      <Tabs.Screen name="about" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  tabBar: {
    height: 68,
    paddingTop: 7,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.borderLight,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  tabBarWeb: {
    height: 76,
    paddingTop: 10,
    paddingBottom: 10,
  },

  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  tabBarLabelWeb: {
    fontSize: 12,
  },

  tabBarItem: {
    paddingHorizontal: 2,
  },
});
