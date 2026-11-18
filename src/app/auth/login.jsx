import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { loginUser, resetPassword } from "../../services/authService";

import { showAlert } from "../../utils/alert";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert("Error", "Completa todos los campos.");
      return;
    }

    try {
      setLoading(true);

      const loggedUser = await loginUser(email, password);

      const userRole = loggedUser?.role || "user";

      if (userRole === "admin" || userRole === "administrador") {
        router.replace("/admin/dashboard");
        return;
      }

      if (userRole === "instructor" && loggedUser.roleStatus === "approved") {
        router.replace("/instructor/dashboard");
        return;
      }

      if (userRole === "instructor") {
        showAlert(
          "Solicitud pendiente",
          "Tu solicitud para acceder como instructor todavía está pendiente de aprobación.",
        );

        router.replace("/tabs/home");
        return;
      }

      router.replace("/tabs/home");
    } catch (error) {
      console.log("Error iniciando sesión:", error);

      let message = "No fue posible iniciar sesión.";

      if (error.code === "auth/invalid-credential") {
        message = "El correo o la contraseña son incorrectos.";
      } else if (error.code === "auth/user-not-found") {
        message = "No existe una cuenta con este correo.";
      } else if (error.code === "auth/wrong-password") {
        message = "La contraseña es incorrecta.";
      } else if (error.code === "auth/invalid-email") {
        message = "El correo electrónico no es válido.";
      } else if (error.message) {
        message = error.message;
      }

      showAlert("Error al iniciar sesión", message);
    } finally {
      setLoading(false);
    }
  };

  // Recuperación de contraseña.
  const handleResetPassword = async () => {
    if (!email.trim()) {
      showAlert(
        "Recuperar contraseña",
        "Primero ingresa el correo electrónico de tu cuenta.",
      );
      return;
    }

    try {
      setResetLoading(true);

      await resetPassword(email);

      showAlert(
        "Correo enviado",
        "Si la dirección corresponde a una cuenta registrada, recibirás las instrucciones para restablecer tu contraseña. Revisa también la carpeta de correo no deseado.",
      );
    } catch (error) {
      console.error("Error recuperando contraseña:", error);

      let message = "No fue posible enviar el correo de recuperación.";

      if (error.code === "auth/invalid-email") {
        message = "El correo electrónico no es válido.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Demasiados intentos. Inténtalo nuevamente más tarde.";
      } else if (error.message) {
        message = error.message;
      }

      showAlert("Error", message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="sparkles" size={36} color="#FFFFFF" />
          </View>

          <Text style={styles.logoText}>MindHub</Text>

          <Text style={styles.logoSubtitle}>Aprende. Crea. Explora.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Bienvenido</Text>

          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

          {/* Correo */}
          <Text style={styles.label}>Correo electrónico</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={21} color="#64748B" />

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !resetLoading}
            />
          </View>

          {/* Contraseña */}
          <Text style={styles.label}>Contraseña</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={21} color="#64748B" />

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !resetLoading}
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              onPress={() => setShowPass(!showPass)}
              disabled={loading || resetLoading}
            >
              <Ionicons
                name={showPass ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          {/* Recuperar contraseña */}
          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={handleResetPassword}
            disabled={loading || resetLoading}
          >
            {resetLoading ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            )}
          </TouchableOpacity>

          {/* Iniciar sesión */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading || resetLoading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Iniciar sesión</Text>

                <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Crear cuenta */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes una cuenta?</Text>

            <Link href="/auth/register" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={styles.registerLink}>Crear cuenta</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 28,
  },

  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  logoText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0F172A",
  },

  logoSubtitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 5,
  },

  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  title: {
    fontSize: 29,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginTop: 7,
    marginBottom: 25,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 9,
    marginTop: 15,
  },

  inputContainer: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    gap: 10,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    paddingVertical: 13,
  },

  forgotContainer: {
    alignItems: "flex-end",
    marginTop: 15,
    minHeight: 28,
  },

  forgotText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "700",
  },

  loginButton: {
    minHeight: 56,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },

  disabledButton: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  registerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    flexWrap: "wrap",
  },

  registerText: {
    color: "#64748B",
    fontSize: 15,
  },

  registerLink: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 6,
  },
});
