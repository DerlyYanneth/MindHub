import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { registerUser } from "../../services/authService";
import { showAlert } from "../../utils/alert";

export default function RegisterScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName1, setLastName1] = useState("");
  const [lastName2, setLastName2] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [role, setRole] = useState("user");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validar campos obligatorios.
    if (
      !firstName.trim() ||
      !lastName1.trim() ||
      !lastName2.trim() ||
      !email.trim() ||
      !password ||
      !confirm
    ) {
      showAlert(
        "Campos obligatorios",
        "Completa todos los campos para continuar.",
      );
      return;
    }

    // Validar correo.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      showAlert(
        "Correo inválido",
        "Ingresa una dirección de correo electrónico válida.",
      );
      return;
    }

    // Validar contraseñas.
    if (password !== confirm) {
      showAlert("Contraseñas diferentes", "Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      showAlert(
        "Contraseña inválida",
        "La contraseña debe tener al menos 6 caracteres.",
      );
      return;
    }

    setLoading(true);

    try {
      await registerUser(
        email,
        password,
        firstName,
        lastName1,
        lastName2,
        role,
      );

      showAlert(
        "Cuenta creada",
        role === "instructor"
          ? "Tu solicitud como instructor fue registrada y está pendiente de aprobación."
          : "Tu cuenta ha sido creada correctamente.",
        [
          {
            text: "Continuar",
            onPress: () => router.replace("/auth/login"),
          },
        ],
      );
    } catch (error) {
      console.error("Error al registrar usuario:", error);

      let message = "No fue posible crear la cuenta.";

      if (error.code === "auth/email-already-in-use") {
        message = "Este correo electrónico ya está registrado.";
      } else if (error.code === "auth/invalid-email") {
        message = "El correo electrónico no es válido.";
      } else if (error.code === "auth/weak-password") {
        message = "La contraseña es demasiado débil.";
      } else if (error.message) {
        message = error.message;
      }

      showAlert("Error al registrarse", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta</Text>

            <Text style={styles.subtitle}>
              Regístrate para acceder a los cursos y talleres de MindHub.
            </Text>
          </View>

          {/* Nombre */}
          <Text style={styles.label}>Nombre *</Text>

          <TextInput
            style={styles.input}
            placeholder="Ingresa tu nombre"
            placeholderTextColor={COLORS.textLight}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            editable={!loading}
          />

          {/* Primer apellido */}
          <Text style={styles.label}>Primer apellido *</Text>

          <TextInput
            style={styles.input}
            placeholder="Ingresa tu primer apellido"
            placeholderTextColor={COLORS.textLight}
            value={lastName1}
            onChangeText={setLastName1}
            autoCapitalize="words"
            editable={!loading}
          />

          {/* Segundo apellido */}
          <Text style={styles.label}>Segundo apellido *</Text>

          <TextInput
            style={styles.input}
            placeholder="Ingresa tu segundo apellido"
            placeholderTextColor={COLORS.textLight}
            value={lastName2}
            onChangeText={setLastName2}
            autoCapitalize="words"
            editable={!loading}
          />

          {/* Correo */}
          <Text style={styles.label}>Correo electrónico *</Text>

          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={COLORS.textLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* Rol */}
          <Text style={styles.label}>Tipo de cuenta *</Text>

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                role === "user" && styles.roleSelected,
              ]}
              onPress={() => setRole("user")}
              disabled={loading}
            >
              <Ionicons
                name="person-outline"
                size={23}
                color={role === "user" ? COLORS.primary : COLORS.textSecondary}
              />

              <Text
                style={[
                  styles.roleTitle,
                  role === "user" && styles.roleTitleSelected,
                ]}
              >
                Usuario
              </Text>

              <Text style={styles.roleDescription}>
                Acceder a cursos y talleres.
              </Text>

              {role === "user" && (
                <Ionicons
                  name="checkmark-circle"
                  size={21}
                  color={COLORS.primary}
                  style={styles.roleCheck}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleOption,
                role === "instructor" && styles.roleSelected,
              ]}
              onPress={() => setRole("instructor")}
              disabled={loading}
            >
              <Ionicons
                name="school-outline"
                size={23}
                color={
                  role === "instructor" ? COLORS.primary : COLORS.textSecondary
                }
              />

              <Text
                style={[
                  styles.roleTitle,
                  role === "instructor" && styles.roleTitleSelected,
                ]}
              >
                Instructor
              </Text>

              <Text style={styles.roleDescription}>
                Solicitar acceso para gestionar contenidos.
              </Text>

              {role === "instructor" && (
                <Ionicons
                  name="checkmark-circle"
                  size={21}
                  color={COLORS.primary}
                  style={styles.roleCheck}
                />
              )}
            </TouchableOpacity>
          </View>

          {role === "instructor" && (
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={COLORS.primary}
              />

              <Text style={styles.infoText}>
                La solicitud de instructor requiere aprobación administrativa.
              </Text>
            </View>
          )}

          {/* Contraseña */}
          <Text style={styles.label}>Contraseña *</Text>

          <View style={styles.passWrap}>
            <TextInput
              style={styles.inputPass}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={COLORS.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              editable={!loading}
            />

            <TouchableOpacity
              onPress={() => setShowPass(!showPass)}
              style={styles.eye}
              disabled={loading}
            >
              <Ionicons
                name={showPass ? "eye-off" : "eye"}
                size={22}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* Confirmar contraseña */}
          <Text style={styles.label}>Confirmar contraseña *</Text>

          <View style={styles.passWrap}>
            <TextInput
              style={styles.inputPass}
              placeholder="Repite tu contraseña"
              placeholderTextColor={COLORS.textLight}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              editable={!loading}
            />

            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              style={styles.eye}
              disabled={loading}
            >
              <Ionicons
                name={showConfirm ? "eye-off" : "eye"}
                size={22}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* Botón crear cuenta */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryText}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Text>
          </TouchableOpacity>

          {/* Volver al login */}
          <Link href="/auth/login" asChild>
            <TouchableOpacity style={styles.linkWrap} disabled={loading}>
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta?{" "}
                <Text style={styles.linkBold}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 35,
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
  },

  header: {
    marginBottom: 22,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    color: COLORS.textSecondary,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },

  input: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: 16,
    minHeight: 54,
  },

  passWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 54,
  },

  inputPass: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
  },

  eye: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },

  roleOption: {
    flex: 1,
    minHeight: 145,
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    position: "relative",
  },

  roleSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F5F3FF",
  },

  roleTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 10,
  },

  roleTitleSelected: {
    color: COLORS.primary,
  },

  roleDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginTop: 5,
  },

  roleCheck: {
    position: "absolute",
    top: 10,
    right: 10,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#EEF2FF",
    padding: 13,
    borderRadius: 10,
    marginTop: 12,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    minHeight: 56,
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },

  linkWrap: {
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 8,
  },

  linkText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },

  linkBold: {
    color: COLORS.secondary,
    fontWeight: "bold",
  },
});
