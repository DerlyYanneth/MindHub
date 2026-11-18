import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebaseConfig";

// Obtener todos los usuarios.
export const getAllUsers = async () => {
  const snapshot = await getDocs(collection(db, "users"));

  return snapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
  }));
};

// Obtener un usuario por UID.
export const getUserData = async (uid) => {
  if (!uid) {
    throw new Error("Usuario no válido.");
  }

  const userRef = doc(db, "users", uid);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    return null;
  }

  return {
    ...userSnapshot.data(),
    id: userSnapshot.id,
    uid: userSnapshot.id,
  };
};

// Actualizar el rol.
export const updateUserRole = async (uid, newRole) => {
  if (!uid) {
    throw new Error("Usuario no válido.");
  }

  const validRoles = ["user", "instructor", "admin"];

  if (!validRoles.includes(newRole)) {
    throw new Error("El rol seleccionado no es válido.");
  }

  await updateDoc(doc(db, "users", uid), {
    role: newRole,
    roleStatus: "approved",
  });
};

// Aprobar una solicitud de instructor.
export const approveInstructor = async (uid) => {
  if (!uid) {
    throw new Error("Usuario no válido.");
  }

  await updateDoc(doc(db, "users", uid), {
    role: "instructor",
    roleStatus: "approved",
  });
};

// Actualizar información de un usuario.
export const updateUser = async (uid, data) => {
  if (!uid) {
    throw new Error("Usuario no válido.");
  }

  const allowedFields = [
    "firstName",
    "lastName1",
    "lastName2",
    "name",
    "email",
    "photoURL",
  ];

  const updatedData = {};

  Object.keys(data).forEach((key) => {
    if (allowedFields.includes(key)) {
      updatedData[key] = data[key];
    }
  });

  if (Object.keys(updatedData).length === 0) {
    throw new Error("No hay información válida para actualizar.");
  }

  await updateDoc(doc(db, "users", uid), updatedData);
};

// Eliminar documento de un usuario en Firestore.
export const deleteUser = async (uid) => {
  if (!uid) {
    throw new Error("Usuario no válido.");
  }

  await deleteDoc(doc(db, "users", uid));
};
