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

import { COLORS } from "../../constants/colors";

const FEATURES = [
  {
    icon: "book-outline",
    title: "Cursos",
    description:
      "Consulta la oferta de cursos disponibles y accede a sus contenidos de aprendizaje.",
    color: "#4F83E5",
    background: "#EAF2FF",
  },
  {
    icon: "color-palette-outline",
    title: "Talleres",
    description:
      "Explora actividades prácticas orientadas al aprendizaje creativo.",
    color: "#159A8C",
    background: "#E5F7F3",
  },
  {
    icon: "layers-outline",
    title: "Mis inscripciones",
    description:
      "Consulta los cursos y talleres en los que te has inscrito desde un mismo lugar.",
    color: "#8B7CF6",
    background: "#F0EDFF",
  },
  {
    icon: "person-circle-outline",
    title: "Perfil de usuario",
    description:
      "Accede a tu información personal y revisa el resumen de tu actividad.",
    color: "#D977A8",
    background: "#FCECF5",
  },
];

export default function AboutScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 900;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[styles.page, { paddingHorizontal: isWideScreen ? 40 : 20 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={19} color="#6555D9" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="bulb-outline" size={45} color="#FFFFFF" />
          </View>

          <Text style={styles.eyebrow}>CONOCE LA APLICACIÓN</Text>
          <Text style={styles.heroTitle}>Acerca de MindHub</Text>
          <Text style={styles.heroDescription}>
            Un espacio digital orientado al aprendizaje creativo, donde puedes
            explorar cursos, conocer talleres y organizar tus actividades de
            aprendizaje.
          </Text>
        </View>

        <View style={[styles.introCard, isWideScreen && styles.introCardWide]}>
          <Text style={styles.sectionTitle}>¿Qué es MindHub?</Text>
          <Text style={styles.bodyText}>
            MindHub es una aplicación móvil diseñada para facilitar la consulta
            y organización de contenidos y actividades de aprendizaje creativo.
            Desde la aplicación, los usuarios pueden explorar la oferta
            disponible, revisar la información de cada actividad y consultar sus
            inscripciones.
          </Text>
          <Text style={[styles.bodyText, { marginTop: 12 }]}>
            La aplicación reúne estas opciones en una interfaz que busca ofrecer
            una experiencia clara, organizada y sencilla de utilizar.
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>¿Qué puedes hacer en MindHub?</Text>
          <Text style={styles.sectionSubtitle}>
            Estas son algunas de las opciones disponibles en la aplicación.
          </Text>

          <View
            style={[
              styles.featuresGrid,
              isWideScreen && styles.featuresGridWide,
            ]}
          >
            {FEATURES.map((feature) => (
              <View
                key={feature.title}
                style={[
                  styles.featureCard,
                  isWideScreen && styles.featureCardWide,
                ]}
              >
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: feature.background },
                  ]}
                >
                  <Ionicons
                    name={feature.icon}
                    size={25}
                    color={feature.color}
                  />
                </View>

                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.helpCard}>
          <View style={styles.helpIcon}>
            <Ionicons
              name="document-text-outline"
              size={25}
              color={COLORS.primary || "#8B7CF6"}
            />
          </View>

          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>
              ¿Necesitas ayuda para comenzar?
            </Text>
            <Text style={styles.helpDescription}>
              Consulta el manual de usuario para conocer los pasos básicos de
              navegación y uso de la aplicación.
            </Text>

            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => router.push("/tabs/manual")}
              activeOpacity={0.8}
            >
              <Text style={styles.helpButtonText}>Consultar manual</Text>
              <Ionicons
                name="arrow-forward"
                size={17}
                color={COLORS.primary || "#8B7CF6"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>MindHub · Aprendizaje creativo</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FC",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 35,
  },
  page: {
    width: "100%",
    maxWidth: 1800,
    alignSelf: "center",
    paddingTop: 22,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingVertical: 9,
    paddingRight: 12,
    marginBottom: 18,
  },
  backText: {
    color: "#6555D9",
    fontSize: 14,
    fontWeight: "700",
  },
  hero: {
    backgroundColor: "#6555D9",
    borderRadius: 25,
    paddingHorizontal: 26,
    paddingVertical: 35,
    alignItems: "center",
    overflow: "hidden",
  },
  heroIcon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.17)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  eyebrow: {
    color: "#E9E4FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
    textAlign: "center",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
  },
  heroDescription: {
    color: "#F1EEFF",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 750,
    marginTop: 13,
  },
  introCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEDF6",
    borderRadius: 20,
    padding: 25,
    marginTop: 23,
  },
  introCardWide: {
    padding: 32,
  },
  sectionTitle: {
    color: "#29273A",
    fontSize: 21,
    fontWeight: "800",
  },
  bodyText: {
    color: "#6F6B82",
    fontSize: 14,
    lineHeight: 23,
    marginTop: 13,
  },
  featuresSection: {
    marginTop: 30,
  },
  sectionSubtitle: {
    color: "#77738A",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 18,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  featuresGridWide: {
    alignItems: "stretch",
  },
  featureCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEDF6",
    borderRadius: 18,
    padding: 21,
  },
  featureCardWide: {
    width: "48%",
    flexGrow: 1,
    flexBasis: 260,
  },
  featureIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  featureTitle: {
    color: "#29273A",
    fontSize: 16,
    fontWeight: "800",
  },
  featureDescription: {
    color: "#77738A",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 8,
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEDF6",
    borderRadius: 20,
    padding: 23,
    marginTop: 28,
  },
  helpIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    color: "#29273A",
    fontSize: 16,
    fontWeight: "800",
  },
  helpDescription: {
    color: "#77738A",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 8,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginTop: 15,
  },
  helpButtonText: {
    color: "#6555D9",
    fontSize: 13,
    fontWeight: "800",
  },
  footer: {
    color: "#9A96AA",
    fontSize: 12,
    textAlign: "center",
    marginTop: 27,
  },
});
