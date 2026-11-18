import {
  createUserWithEmailAndPassword,
  deleteUser as deleteFirebaseUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "./firebaseConfig";

/**
 * Normalizar y validar el rol.
 */
const validateRole = (role) => {
  const validRoles = ["user", "instructor"];

  if (!validRoles.includes(role)) {
    throw new Error("El rol seleccionado no es válido.");
  }

  return role;
};

/**
 * Iniciar sesión.
 */
export const loginUser = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  const credential = await signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    password,
  );

  const firebaseUser = credential.user;

  const userRef = doc(db, "users", firebaseUser.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await signOut(auth);
    throw new Error(
      "No se encontró el registro del usuario en la base de datos.",
    );
  }

  const userData = userDoc.data();

  return {
    ...userData,
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    role: userData.role || "user",
    name: userData.name || firebaseUser.displayName || "",
    photoURL: userData.photoURL || firebaseUser.photoURL || "",
    enrolledCourses: userData.enrolledCourses || [],
    enrolledWorkshops: userData.enrolledWorkshops || [],
    progress: userData.progress || {},
  };
};

/**
 * Registrar usuario.
 *
 * Recibe:
 * email
 * password
 * firstName
 * lastName1
 * lastName2
 * role
 */
export const registerUser = async (
  email,
  password,
  firstName,
  lastName1,
  lastName2,
  role = "user",
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const cleanFirstName = firstName.trim();
  const cleanLastName1 = lastName1.trim();
  const cleanLastName2 = lastName2.trim();

  const selectedRole = validateRole(role);

  // Validaciones de datos.
  if (
    !cleanFirstName ||
    !cleanLastName1 ||
    !cleanLastName2 ||
    !normalizedEmail ||
    !password
  ) {
    throw new Error("Todos los campos son obligatorios.");
  }

  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const fullName = [cleanFirstName, cleanLastName1, cleanLastName2].join(" ");

  let firebaseUser = null;

  try {
    // Crear cuenta en Firebase Authentication.
    const credential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password,
    );

    firebaseUser = credential.user;

    // Actualizar nombre visible en Firebase Authentication.
    await updateProfile(firebaseUser, {
      displayName: fullName,
    });

    // Información que se guardará en Firestore.
    const userData = {
      uid: firebaseUser.uid,

      firstName: cleanFirstName,
      lastName1: cleanLastName1,
      lastName2: cleanLastName2,

      name: fullName,
      email: normalizedEmail,

      role: selectedRole,

      // Estado de aprobación para solicitudes de instructor.
      roleStatus: selectedRole === "instructor" ? "pending" : "approved",

      photoURL: "",

      enrolledCourses: [],
      enrolledWorkshops: [],
      progress: {},

      createdAt: new Date().toISOString(),
    };

    // Crear documento del usuario.
    await setDoc(doc(db, "users", firebaseUser.uid), userData);

    return {
      ...userData,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
    };
  } catch (error) {
    // Evitar dejar una cuenta de autenticación sin documento.
    if (firebaseUser) {
      try {
        await deleteFirebaseUser(firebaseUser);
      } catch (deleteError) {
        console.error("No fue posible revertir la cuenta creada:", deleteError);
      }
    }

    throw error;
  }
};

/**
 * Recuperar contraseña mediante correo electrónico.
 */
export const resetPassword = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Ingresa tu correo electrónico.");
  }

  await sendPasswordResetEmail(auth, normalizedEmail);

  return true;
};

/**
 * Obtener información completa del usuario.
 */
export const getUserData = async (uid) => {
  if (!uid) {
    throw new Error("ID de usuario no válido.");
  }

  const userRef = doc(db, "users", uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  return {
    id: userDoc.id,
    uid: userDoc.id,
    ...userDoc.data(),
  };
};

/**
 * Cerrar sesión.
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error al cerrar sesión en Firebase:", error);
    throw error;
  }
};
