import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

const COLORS = {
  primary: "#5B4BDB",
  primaryDark: "#4435B5",
  primaryLight: "#EEEAFE",
  background: "#FFFFFF",
  text: "#24213E",
  muted: "#77758F",
  border: "#EAE8F5",
};

const NAV_ITEMS = [
  {
    label: "Panel",
    icon: "grid-outline",
    route: "/admin/dashboard",
    key: "dashboard",
  },
  {
    label: "Gestión de cursos",
    icon: "book-outline",
    route: "/admin/manage-content",
    key: "content",
  },
  {
    label: "Usuarios",
    icon: "people-outline",
    route: "/admin/users",
    key: "users",
  },
  {
    label: "Inscripciones",
    icon: "clipboard-outline",
    route: "/admin/enrollments",
    key: "enrollments",
  },
  {
    label: "Gestión de talleres",
    icon: "color-palette-outline",
    route: "/admin/manage-workshops",
    key: "workshops",
  },
];

export default function AdminHeader({ active }) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const isWideScreen = width >= 900;

  const currentItem =
    NAV_ITEMS.find((item) => item.key === active) ||
    NAV_ITEMS.find((item) => pathname === item.route) ||
    NAV_ITEMS[0];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, isWideScreen && styles.containerWide]}>
        <TouchableOpacity
          style={styles.brand}
          activeOpacity={0.8}
          onPress={() => router.push("/admin/dashboard")}
          accessibilityRole="button"
          accessibilityLabel="Ir al panel principal de MindHub"
        >
          <View style={styles.logo}>
            <Ionicons name="bulb" size={25} color="#FFFFFF" />
          </View>

          <View style={styles.brandText}>
            <Text style={styles.brandName}>MindHub</Text>
            <Text style={styles.brandSubtitle}>ADMINISTRACIÓN</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.sectionInfo}>
          <Text style={styles.sectionEyebrow}>CENTRO DE CONTROL</Text>
          <Text style={styles.sectionTitle}>{currentItem.label}</Text>
        </View>

        <View style={styles.rightArea}>
          <View style={styles.status}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Panel administrativo</Text>
          </View>
        </View>
      </View>

      <View style={styles.navBackground}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.navContent,
            isWideScreen && styles.navContentWide,
          ]}
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              active === item.key || (!active && pathname === item.route);

            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => router.push(item.route)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${item.label}`}
                accessibilityState={{ selected: isActive }}
                style={[styles.navItem, isActive && styles.navItemActive]}
              >
                <Ionicons
                  name={item.icon}
                  size={19}
                  color={isActive ? COLORS.primary : COLORS.muted}
                />

                <Text
                  style={[styles.navLabel, isActive && styles.navLabelActive]}
                >
                  {item.label}
                </Text>

                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
    elevation: 3,
  },
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 14,
  },
  containerWide: {
    paddingHorizontal: 36,
    paddingTop: 22,
    paddingBottom: 20,
    gap: 22,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },
  brandText: {
    justifyContent: "center",
  },
  brandName: {
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: COLORS.text,
  },
  brandSubtitle: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
    color: COLORS.primary,
  },
  divider: {
    width: 1,
    height: 38,
    backgroundColor: COLORS.border,
  },
  sectionInfo: {
    flex: 1,
    minWidth: 0,
  },
  sectionEyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: COLORS.muted,
  },
  sectionTitle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  rightArea: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#F1EEFF",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#32A879",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  navBackground: {
    borderTopWidth: 1,
    borderTopColor: "#F1EFF8",
    backgroundColor: "#FFFFFF",
  },
  navContent: {
    paddingHorizontal: 12,
    gap: 5,
    alignItems: "center",
  },
  navContentWide: {
    paddingHorizontal: 36,
    gap: 10,
  },
  navItem: {
    position: "relative",
    minHeight: 51,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
  },
  navItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
  },
  navLabelActive: {
    fontWeight: "800",
    color: COLORS.primary,
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 13,
    right: 13,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: COLORS.primary,
  },
});
