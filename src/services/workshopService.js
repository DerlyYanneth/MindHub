import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebaseConfig";

const workshopsRef = collection(db, "workshops");

const clean = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeWorkshop = (data = {}) => {
  const capacity = Number(data.capacity);
  const price = Number(data.price);

  return {
    title: clean(data.title),
    description: clean(data.description),
    objective: clean(data.objective),
    instructor: clean(data.instructor),
    instructorId: clean(data.instructorId),
    date: clean(data.date),
    schedule: clean(data.schedule),
    location: clean(data.location) || "Modalidad virtual",
    capacity: Number.isInteger(capacity) && capacity >= 1 ? capacity : 20,
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    imageUrl: clean(data.imageUrl),
    category: clean(data.category) || "Creatividad",
    duration: clean(data.duration) || "2 horas",
  };
};

const mapSnapshot = (snapshot) =>
  snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

const isAdmin = (role) =>
  ["admin", "administrador"].includes(clean(role).toLowerCase());

const assertValidWorkshop = (workshop) => {
  if (!workshop.title) {
    throw new Error("El título del taller es obligatorio.");
  }

  if (!workshop.description) {
    throw new Error("La descripción del taller es obligatoria.");
  }

  if (!workshop.instructor) {
    throw new Error("Debes seleccionar un instructor.");
  }

  if (!workshop.instructorId) {
    throw new Error("No se identificó al instructor.");
  }

  if (!Number.isInteger(workshop.capacity) || workshop.capacity < 1) {
    throw new Error("La capacidad debe ser un entero mayor que cero.");
  }

  if (!Number.isFinite(workshop.price) || workshop.price < 0) {
    throw new Error("El precio debe ser igual o mayor que cero.");
  }
};

/* =========================================================
   OBTENER TALLERES
========================================================= */

export const getWorkshops = async () => {
  const snapshot = await getDocs(workshopsRef);
  return mapSnapshot(snapshot);
};

/* =========================================================
   OBTENER TALLER POR ID
========================================================= */

export const getWorkshopById = async (id) => {
  if (!id) return null;

  const snapshot = await getDoc(doc(db, "workshops", id));

  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

/* =========================================================
   OBTENER TALLERES DE UN INSTRUCTOR
========================================================= */

export const getWorkshopsByInstructor = async (instructorId) => {
  if (!instructorId) return [];

  const workshopsQuery = query(
    workshopsRef,
    where("instructorId", "==", instructorId),
  );

  return mapSnapshot(await getDocs(workshopsQuery));
};

/* =========================================================
   CREAR TALLER
========================================================= */

export const createWorkshop = async (data) => {
  const workshop = normalizeWorkshop(data);

  assertValidWorkshop(workshop);

  const now = new Date().toISOString();

  const ref = await addDoc(workshopsRef, {
    ...workshop,
    enrolled: [],
    createdAt: now,
    updatedAt: now,
  });

  return ref.id;
};

/* =========================================================
   ACTUALIZAR TALLER
========================================================= */

export const updateWorkshop = async (id, data, currentUser = {}) => {
  if (!id) {
    throw new Error("ID de taller no válido.");
  }

  if (!currentUser.uid) {
    throw new Error("No se pudo identificar al usuario actual.");
  }

  const ref = doc(db, "workshops", id);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error("El taller no existe.");
  }

  const existing = snapshot.data();
  const admin = isAdmin(currentUser.role);

  if (!admin && existing.instructorId !== currentUser.uid) {
    throw new Error("Solo puedes editar tus propios talleres.");
  }

  // El instructor conserva su asignación. Solo un administrador
  // puede cambiar el instructor responsable.
  const dataToNormalize = {
    ...existing,
    ...data,
    instructorId: admin
      ? clean(data.instructorId) || existing.instructorId
      : existing.instructorId,
  };

  const workshop = normalizeWorkshop(dataToNormalize);

  assertValidWorkshop(workshop);

  await updateDoc(ref, {
    ...workshop,
    updatedAt: new Date().toISOString(),
  });

  return true;
};

/* =========================================================
   ELIMINAR TALLER
========================================================= */

export const deleteWorkshop = async (id, currentUser = {}) => {
  if (!id) {
    throw new Error("ID de taller no válido.");
  }

  if (!currentUser.uid) {
    throw new Error("No se pudo identificar al usuario actual.");
  }

  const ref = doc(db, "workshops", id);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) return false;

  const existing = snapshot.data();
  const admin = isAdmin(currentUser.role);

  if (!admin && existing.instructorId !== currentUser.uid) {
    throw new Error("Solo puedes eliminar tus propios talleres.");
  }

  const enrolled = Array.isArray(existing.enrolled) ? existing.enrolled : [];

  if (enrolled.length > 0) {
    throw new Error(
      "No puedes eliminar un taller que tiene inscritos. Gestiona primero sus inscripciones.",
    );
  }

  await deleteDoc(ref);

  return true;
};

/* =========================================================
   INSCRIBIR USUARIO A TALLER
   Parámetros: workshopId, user
========================================================= */

export const enrollInWorkshop = async (workshopId, user) => {
  if (!workshopId || !user?.uid) {
    throw new Error("No se pudo identificar el taller o el usuario.");
  }

  const workshopRef = doc(db, "workshops", workshopId);
  const userRef = doc(db, "users", user.uid);

  return runTransaction(db, async (transaction) => {
    const workshopSnap = await transaction.get(workshopRef);
    const userSnap = await transaction.get(userRef);

    if (!workshopSnap.exists()) {
      throw new Error("El taller ya no está disponible.");
    }

    if (!userSnap.exists()) {
      throw new Error("No se encontró tu perfil de usuario.");
    }

    const workshop = workshopSnap.data();
    const userData = userSnap.data();

    const enrolled = Array.isArray(workshop.enrolled) ? workshop.enrolled : [];

    const enrolledWorkshops = Array.isArray(userData.enrolledWorkshops)
      ? userData.enrolledWorkshops
      : [];

    if (enrolled.includes(user.uid) || enrolledWorkshops.includes(workshopId)) {
      return {
        alreadyEnrolled: true,
        type: "workshop",
        id: workshopId,
      };
    }

    const capacity = Math.max(1, Number(workshop.capacity) || 20);

    if (enrolled.length >= capacity) {
      throw new Error("Este taller ya no tiene cupos disponibles.");
    }

    transaction.update(workshopRef, {
      enrolled: arrayUnion(user.uid),
      updatedAt: new Date().toISOString(),
    });

    transaction.update(userRef, {
      enrolledWorkshops: arrayUnion(workshopId),
    });

    return {
      alreadyEnrolled: false,
      type: "workshop",
      id: workshopId,
    };
  });
};

/* =========================================================
   CANCELAR INSCRIPCIÓN A TALLER
   Parámetros: workshopId, userId
========================================================= */

export const cancelWorkshopEnrollment = async (workshopId, userId) => {
  if (!workshopId || !userId) {
    throw new Error("Faltan datos para cancelar la inscripción.");
  }

  const workshopRef = doc(db, "workshops", workshopId);
  const userRef = doc(db, "users", userId);

  return runTransaction(db, async (transaction) => {
    const workshopSnap = await transaction.get(workshopRef);
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists()) {
      throw new Error("No se encontró el perfil del usuario.");
    }

    const userData = userSnap.data();

    const enrolledWorkshops = Array.isArray(userData.enrolledWorkshops)
      ? userData.enrolledWorkshops
      : [];

    if (!enrolledWorkshops.includes(workshopId)) {
      throw new Error("El usuario no está inscrito en este taller.");
    }

    transaction.update(userRef, {
      enrolledWorkshops: arrayRemove(workshopId),
    });

    if (workshopSnap.exists()) {
      const workshop = workshopSnap.data();
      const enrolled = Array.isArray(workshop.enrolled)
        ? workshop.enrolled
        : [];

      if (enrolled.includes(userId)) {
        transaction.update(workshopRef, {
          enrolled: arrayRemove(userId),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return true;
  });
};

/* =========================================================
   OBTENER TALLERES INSCRITOS POR USUARIO
========================================================= */

export const getEnrolledWorkshops = async (userId) => {
  if (!userId) return [];

  const userSnap = await getDoc(doc(db, "users", userId));

  if (!userSnap.exists()) return [];

  const ids = Array.isArray(userSnap.data().enrolledWorkshops)
    ? userSnap.data().enrolledWorkshops
    : [];

  if (!ids.length) return [];

  const results = await Promise.all(ids.map((id) => getWorkshopById(id)));

  return results.filter(Boolean);
};

/* =========================================================
   OBTENER ESTUDIANTES DE UN TALLER
========================================================= */

export const getWorkshopStudents = async (workshopId) => {
  const workshop = await getWorkshopById(workshopId);

  if (!workshop) return [];

  const enrolled = Array.isArray(workshop.enrolled) ? workshop.enrolled : [];

  const users = await Promise.all(
    enrolled.map(async (uid) => {
      const snapshot = await getDoc(doc(db, "users", uid));

      if (!snapshot.exists()) {
        return {
          uid,
          name: "Usuario no disponible",
          email: "",
        };
      }

      const data = snapshot.data();

      return {
        uid,
        name: data.name || data.displayName || data.fullName || "Usuario",
        email: data.email || "",
      };
    }),
  );

  return users;
};
