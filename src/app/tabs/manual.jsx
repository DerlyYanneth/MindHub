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

const STEPS = [
  {
    number: "01",
    icon: "person-circle-outline",
    title: "Ingresa a tu cuenta",
    description:
      "Inicia sesión con tus credenciales. Si todavía no tienes una cuenta, utiliza la opción de registro disponible en la aplicación.",
  },
  {
    number: "02",
    icon: "book-outline",
    title: "Explora los cursos",
    description:
      "Consulta los cursos disponibles, revisa su descripción y abre el detalle para conocer la información de cada uno.",
  },
  {
    number: "03",
    icon: "color-palette-outline",
    title: "Consulta los talleres",
    description:
      "Explora los talleres publicados y revisa sus detalles antes de realizar una inscripción.",
  },
  {
    number: "04",
    icon: "checkmark-circle-outline",
    title: "Realiza tus inscripciones",
    description:
      "Utiliza la opción de inscripción de la actividad que te interese y sigue las indicaciones que aparezcan en pantalla.",
  },
  {
    number: "05",
    icon: "library-outline",
    title: "Revisa tus actividades",
    description:
      "Entra en Mis inscripciones para consultar los cursos y talleres asociados a tu cuenta.",
  },
  {
    number: "06",
    icon: "person-outline",
    title: "Consulta tu perfil",
    description:
      "Desde tu perfil puedes consultar el resumen de tus inscripciones, acceder al manual y conocer más sobre MindHub.",
  },
];

export default function ManualScreen() {
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
            <Ionicons name="document-text-outline" size={38} color="#FFFFFF" />
          </View>

          <Text style={styles.eyebrow}>GUÍA DE USO</Text>
          <Text style={styles.title}>Manual de usuario</Text>
          <Text style={styles.subtitle}>
            Sigue estos pasos para navegar por MindHub y consultar tus
            actividades de aprendizaje.
          </Text>
        </View>

        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>¿Cómo utilizar la aplicación?</Text>
          <Text style={styles.sectionSubtitle}>
            Recorre los pasos para conocer las principales funciones.
          </Text>

          <View style={styles.stepsList}>
            {STEPS.map((step, index) => (
              <View key={step.number} style={styles.stepRow}>
                <View style={styles.timeline}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.number}</Text>
                  </View>

                  {index !== STEPS.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>

                <View style={styles.stepCard}>
                  <View style={styles.stepHeading}>
                    <View style={styles.stepIcon}>
                      <Ionicons name={step.icon} size={22} color="#6555D9" />
                    </View>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                  </View>

                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="bulb-outline" size={25} color="#9A6A13" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Recomendación</Text>
            <Text style={styles.tipDescription}>
              Revisa la información de cada curso o taller antes de inscribirte.
              Si tienes dudas sobre las opciones de la aplicación, vuelve a esta
              guía cuando lo necesites.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.aboutButton}
          onPress={() => router.push("/tabs/about")}
          activeOpacity={0.8}
        >
          <Text style={styles.aboutButtonText}>Conocer más sobre MindHub</Text>
          <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
        </TouchableOpacity>
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
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
  },
  heroIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.17)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  eyebrow: {
    color: "#E9E4FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 9,
  },
  subtitle: {
    color: "#F1EEFF",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 700,
    marginTop: 11,
  },
  stepsSection: {
    marginTop: 30,
  },
  sectionTitle: {
    color: "#29273A",
    fontSize: 21,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: "#77738A",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 22,
  },
  stepsList: {
    gap: 0,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
  },
  timeline: {
    width: 48,
    alignItems: "center",
  },
  stepNumber: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "#E9E4FF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  stepNumberText: {
    color: "#6555D9",
    fontSize: 12,
    fontWeight: "800",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: "#E4DFFA",
  },
  stepCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEDF6",
    borderRadius: 18,
    padding: 20,
    marginBottom: 17,
  },
  stepHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    flex: 1,
    color: "#29273A",
    fontSize: 15,
    fontWeight: "800",
  },
  stepDescription: {
    color: "#77738A",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 13,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "#F5E6BE",
    borderRadius: 18,
    padding: 20,
    marginTop: 9,
  },
  tipIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#FFEDBF",
    alignItems: "center",
    justifyContent: "center",
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: "#6E5019",
    fontSize: 15,
    fontWeight: "800",
  },
  tipDescription: {
    color: "#806A3E",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 7,
  },
  aboutButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#6555D9",
    borderRadius: 14,
    marginTop: 23,
    paddingHorizontal: 18,
  },
  aboutButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
