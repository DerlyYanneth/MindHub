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
  primary: "#E88B32",
  background: "#F6F7FB",
  card: "#FFFFFF",
  text: "#29273A",
  muted: "#777B91",
  border: "#E8E9F2",
  blue: "#3785C6",
  purple: "#7865D8",
  green: "#27865B",
};

const SECTIONS = [
  {
    number: "01",
    icon: "grid-outline",
    color: COLORS.primary,
    title: "Mi espacio",
    description:
      "Es la pantalla principal del instructor. Allí puedes consultar el resumen de tus cursos, talleres y estudiantes asignados.",
    steps: [
      "Ingresa a tu cuenta con tus credenciales.",
      "Consulta la información disponible en el panel.",
      "Utiliza las opciones de navegación para acceder a las demás secciones.",
    ],
  },
  {
    number: "02",
    icon: "book-outline",
    color: COLORS.blue,
    title: "Mis cursos",
    description:
      "Permite consultar los cursos que el administrador te ha asignado como instructor.",
    steps: [
      "Entra en la opción Mis cursos de la barra inferior.",
      "Selecciona un curso para consultar la información que esté disponible.",
      "Si no aparece un curso, verifica con el administrador que esté asignado a tu cuenta.",
    ],
  },
  {
    number: "03",
    icon: "color-palette-outline",
    color: COLORS.purple,
    title: "Mis talleres",
    description:
      "Permite consultar los talleres que tienes asignados y revisar la información de sus participantes cuando la opción esté disponible.",
    steps: [
      "Abre Mis talleres desde la barra inferior.",
      "Consulta los datos del taller, como fecha, horario, ubicación y capacidad.",
      "Utiliza la opción para consultar estudiantes, si aparece disponible.",
    ],
  },
  {
    number: "04",
    icon: "people-outline",
    color: COLORS.green,
    title: "Consultar estudiantes",
    description:
      "Desde un taller asignado puedes acceder a la lista de participantes, cuando tengas permiso para consultarla.",
    steps: [
      "Abre el taller correspondiente.",
      "Pulsa la opción para consultar estudiantes.",
      "Revisa los datos que la aplicación permita visualizar.",
    ],
  },
  {
    number: "05",
    icon: "person-circle-outline",
    color: COLORS.purple,
    title: "Mi perfil",
    description:
      "Esta sección reúne la información de tu cuenta y los recursos de ayuda de MindHub.",
    steps: [
      "Entra en Mi perfil desde la barra inferior.",
      "Consulta tu nombre, correo electrónico y tipo de cuenta.",
      "Abre el Manual del instructor o la sección Acerca de MindHub cuando lo necesites.",
    ],
  },
  {
    number: "06",
    icon: "log-out-outline",
    color: "#D84E62",
    title: "Cerrar sesión",
    description:
      "Permite finalizar tu sesión para evitar que otras personas accedan a tu cuenta desde el mismo dispositivo.",
    steps: [
      "Abre Mi perfil.",
      "Pulsa Cerrar sesión.",
      "Confirma la acción para salir de tu cuenta.",
    ],
  },
];

export default function InstructorManual() {
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
            onPress={() => router.replace("/instructor/profile")}
            style={styles.backButton}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={21} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>CENTRO DE AYUDA</Text>
            <Text style={styles.title}>Manual del instructor</Text>
            <Text style={styles.subtitle}>
              Aprende a utilizar las herramientas de tu cuenta de MindHub.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="book-outline" size={28} color={COLORS.primary} />
          </View>
        </View>

        {/* Bienvenida */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="school-outline" size={28} color="#FFFFFF" />
          </View>

          <View style={styles.welcomeText}>
            <Text style={styles.welcomeTitle}>¡Bienvenido a tu espacio!</Text>
            <Text style={styles.welcomeDescription}>
              Esta guía te ayudará a conocer las opciones disponibles para
              consultar tus cursos, talleres y participantes.
            </Text>
          </View>
        </View>

        {/* Navegación */}
        <Text style={styles.sectionHeading}>Contenido del manual</Text>

        <View style={styles.contentsCard}>
          {SECTIONS.map((section, index) => (
            <TouchableOpacity
              key={section.number}
              style={[
                styles.contentsItem,
                index !== SECTIONS.length - 1 && styles.contentsItemBorder,
              ]}
              onPress={() =>
                router.push({
                  pathname: "/instructor/manual",
                  params: { section: section.number },
                })
              }
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.smallIcon,
                  { backgroundColor: `${section.color}18` },
                ]}
              >
                <Ionicons name={section.icon} size={19} color={section.color} />
              </View>

              <Text style={styles.contentsText}>
                {section.number}. {section.title}
              </Text>

              <Ionicons name="chevron-forward" size={17} color="#A0A2B3" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Instrucciones detalladas */}
        <Text style={styles.sectionHeading}>Guía paso a paso</Text>

        {SECTIONS.map((section) => (
          <View key={section.number} style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <View
                style={[
                  styles.guideIcon,
                  { backgroundColor: `${section.color}18` },
                ]}
              >
                <Ionicons name={section.icon} size={23} color={section.color} />
              </View>

              <View style={styles.guideTitleContainer}>
                <Text style={styles.guideNumber}>SECCIÓN {section.number}</Text>
                <Text style={styles.guideTitle}>{section.title}</Text>
              </View>
            </View>

            <Text style={styles.guideDescription}>{section.description}</Text>

            <View style={styles.steps}>
              {section.steps.map((step, index) => (
                <View key={`${section.number}-${index}`} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>

                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Permisos */}
        <View style={styles.noticeCard}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={COLORS.primary}
          />

          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Sobre tus permisos</Text>
            <Text style={styles.noticeText}>
              El administrador crea, edita, elimina y asigna cursos y talleres.
              Como instructor, puedes consultar el contenido asignado y utilizar
              las funciones habilitadas para tu cuenta. Si necesitas una
              asignación o detectas información incorrecta, comunícate con el
              administrador.
            </Text>
          </View>
        </View>

        {/* Pie */}
        <TouchableOpacity
          style={styles.backToProfile}
          onPress={() => router.replace("/instructor/profile")}
          activeOpacity={0.8}
        >
          <Ionicons name="person-outline" size={19} color="#FFFFFF" />
          <Text style={styles.backToProfileText}>Volver a mi perfil</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          MindHub · Manual de usuario del instructor
        </Text>
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
    letterSpacing: 1.4,
    fontWeight: "800",
    color: COLORS.primary,
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
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#FFF0E1",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 27,
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF30",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 7,
  },
  welcomeDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: "#FFFFFF",
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 13,
  },
  contentsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    marginBottom: 27,
  },
  contentsItem: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  contentsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  smallIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contentsText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  guideCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  guideHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  guideIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  guideTitleContainer: {
    flex: 1,
  },
  guideNumber: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: COLORS.muted,
    fontWeight: "800",
    marginBottom: 4,
  },
  guideTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "800",
  },
  guideDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.muted,
    marginBottom: 16,
  },
  steps: {
    gap: 13,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#FFF0E1",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "800",
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.text,
    paddingTop: 2,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFF7EB",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#F6DFC0",
    padding: 17,
    marginTop: 9,
    marginBottom: 22,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.muted,
  },
  backToProfile: {
    minHeight: 51,
    backgroundColor: COLORS.primary,
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
