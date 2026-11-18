import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

const COLORS = {
  primary: "#8B7CF6",
  primaryDark: "#6555D9",
  secondary: "#E778C8",
  background: "#F7F5FC",
  card: "#FFFFFF",
  text: "#29273A",
  muted: "#77758A",
  border: "#E8E4F2",
  orange: "#E88B32",
  blue: "#3785C6",
  green: "#27865B",
};

const FEATURES = [
  {
    icon: "book-outline",
    color: COLORS.primary,
    title: "Cursos de aprendizaje",
    description:
      "Espacios formativos para consultar los contenidos de los cursos disponibles en la aplicación.",
  },
  {
    icon: "color-palette-outline",
    color: COLORS.secondary,
    title: "Talleres creativos",
    description:
      "Actividades orientadas al aprendizaje práctico y a la exploración de la creatividad.",
  },
  {
    icon: "people-outline",
    color: COLORS.blue,
    title: "Gestión de participantes",
    description:
      "Herramientas para consultar inscripciones y participantes de acuerdo con el rol y los permisos de cada cuenta.",
  },
  {
    icon: "trending-up-outline",
    color: COLORS.green,
    title: "Seguimiento del aprendizaje",
    description:
      "Funciones de seguimiento disponibles según el perfil y las características implementadas en la aplicación.",
  },
];

const ROLES = [
  {
    icon: "shield-checkmark-outline",
    color: COLORS.primaryDark,
    title: "Administrador",
    description:
      "Gestiona los cursos y talleres, administra sus contenidos y asigna instructores.",
  },
  {
    icon: "school-outline",
    color: COLORS.orange,
    title: "Instructor",
    description:
      "Consulta los cursos y talleres asignados y utiliza las funciones habilitadas para acompañar las actividades formativas.",
  },
  {
    icon: "person-outline",
    color: COLORS.blue,
    title: "Usuario",
    description:
      "Accede a las funciones de aprendizaje que estén disponibles para su cuenta.",
  },
];

export default function InstructorAbout() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/instructor/profile")}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={21} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>CONOCE LA PLATAFORMA</Text>
            <Text style={styles.title}>Acerca de MindHub</Text>
            <Text style={styles.subtitle}>
              Un espacio digital para apoyar el aprendizaje creativo.
            </Text>
          </View>
        </View>

        {/* Presentación */}
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Ionicons name="bulb-outline" size={43} color="#FFFFFF" />
          </View>

          <Text style={styles.brand}>MindHub</Text>
          <Text style={styles.tagline}>Aprendizaje creativo</Text>

          <View style={styles.heroDivider} />

          <Text style={styles.heroDescription}>
            MindHub es una aplicación móvil orientada al aprendizaje creativo.
            Su propósito es reunir herramientas para consultar cursos y
            talleres, acceder a contenidos formativos y apoyar la organización
            de las actividades de aprendizaje.
          </Text>
        </View>

        {/* Propósito */}
        <Text style={styles.sectionTitle}>Nuestro propósito</Text>

        <View style={styles.purposeCard}>
          <View style={styles.purposeIcon}>
            <Ionicons
              name="sparkles-outline"
              size={25}
              color={COLORS.primaryDark}
            />
          </View>

          <Text style={styles.purposeTitle}>Aprender, explorar y crear</Text>

          <Text style={styles.purposeDescription}>
            MindHub busca facilitar el acceso a experiencias de aprendizaje
            creativo mediante una interfaz organizada y funciones adaptadas a
            las responsabilidades de cada tipo de usuario.
          </Text>
        </View>

        {/* Funciones */}
        <Text style={styles.sectionTitle}>
          ¿Qué puedes encontrar en MindHub?
        </Text>

        <View style={styles.featuresGrid}>
          {FEATURES.map((feature) => (
            <View
              key={feature.title}
              style={[styles.featureCard, isWide && styles.featureCardWide]}
            >
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: `${feature.color}18` },
                ]}
              >
                <Ionicons name={feature.icon} size={24} color={feature.color} />
              </View>

              <Text style={styles.featureTitle}>{feature.title}</Text>

              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Roles */}
        <Text style={styles.sectionTitle}>Roles de la plataforma</Text>

        <View style={styles.rolesCard}>
          {ROLES.map((item, index) => (
            <View
              key={item.title}
              style={[
                styles.roleRow,
                index !== ROLES.length - 1 && styles.roleRowBorder,
              ]}
            >
              <View
                style={[
                  styles.roleIcon,
                  { backgroundColor: `${item.color}18` },
                ]}
              >
                <Ionicons name={item.icon} size={23} color={item.color} />
              </View>

              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>{item.title}</Text>
                <Text style={styles.roleDescription}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Información para el instructor */}
        <View style={styles.instructorNote}>
          <Ionicons
            name="information-circle-outline"
            size={23}
            color={COLORS.orange}
          />

          <View style={styles.noteTextContainer}>
            <Text style={styles.noteTitle}>Tu espacio como instructor</Text>
            <Text style={styles.noteDescription}>
              El administrador es responsable de crear, editar, eliminar y
              asignar cursos y talleres. Desde tu cuenta puedes consultar los
              contenidos asignados y acceder a las herramientas habilitadas para
              tu rol.
            </Text>
          </View>
        </View>

        {/* Cierre */}
        <View style={styles.footerCard}>
          <Ionicons name="heart-outline" size={25} color={COLORS.primary} />
          <Text style={styles.footerTitle}>MindHub</Text>
          <Text style={styles.footerText}>
            Una experiencia digital para descubrir, aprender y desarrollar la
            creatividad.
          </Text>
          <Text style={styles.version}>
            Información general de la aplicación
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backToProfile}
          onPress={() => router.replace("/instructor/profile")}
          activeOpacity={0.8}
        >
          <Ionicons name="person-outline" size={19} color="#FFFFFF" />
          <Text style={styles.backToProfileText}>Volver a mi perfil</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>MindHub · Aprendizaje creativo</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  content: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 32,
  },
  contentWide: {
    paddingHorizontal: 36,
    paddingTop: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    paddingTop: 2,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: "800",
    color: COLORS.primaryDark,
    marginBottom: 5,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
    marginTop: 6,
  },
  hero: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 26,
    padding: 25,
    alignItems: "center",
    marginBottom: 29,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: "#FFFFFF25",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  tagline: {
    color: "#E7E0FF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 5,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "#FFFFFF45",
    width: "45%",
    marginVertical: 20,
  },
  heroDescription: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 13,
  },
  purposeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 21,
    alignItems: "flex-start",
    marginBottom: 28,
  },
  purposeIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#F0ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  purposeTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  purposeDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 20,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  featureCard: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  featureCardWide: {
    width: "48%",
    flexGrow: 1,
    flexBasis: "45%",
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  featureTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 7,
  },
  featureDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  rolesCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 23,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    paddingVertical: 18,
  },
  roleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  roleIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 5,
  },
  roleDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  instructorNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFF7EB",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#F6DFC0",
    padding: 17,
    marginBottom: 24,
  },
  noteTextContainer: {
    flex: 1,
  },
  noteTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  noteDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  footerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 23,
    alignItems: "center",
    marginBottom: 20,
  },
  footerTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 9,
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 7,
  },
  version: {
    color: "#999BAD",
    fontSize: 10,
    marginTop: 14,
  },
  backToProfile: {
    minHeight: 51,
    backgroundColor: COLORS.primaryDark,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },
  backToProfileText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  footer: {
    textAlign: "center",
    fontSize: 10,
    color: "#999BAD",
    marginTop: 20,
  },
});
