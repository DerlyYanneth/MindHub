import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";

import { db } from "./firebaseConfig";

/* =========================================================
   INSCRIPCIÓN A CURSOS
========================================================= */

export const enrollInCourse = async (userId, courseId) => {
  if (!userId || !courseId) {
    throw new Error("Información de inscripción incompleta.");
  }

  const userRef = doc(db, "users", userId);
  const courseRef = doc(db, "courses", courseId);

  return runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const courseSnap = await transaction.get(courseRef);

    if (!userSnap.exists()) throw new Error("Usuario no encontrado.");
    if (!courseSnap.exists()) throw new Error("Curso no encontrado.");

    const userData = userSnap.data();
    const courseData = courseSnap.data();

    const enrolledCourses = Array.isArray(userData.enrolledCourses)
      ? userData.enrolledCourses
      : [];

    if (enrolledCourses.includes(courseId)) {
      return { alreadyEnrolled: true, type: "course", id: courseId };
    }

    const currentStudents = Math.max(0, Number(courseData.students) || 0);
    const currentProgress =
      userData.progress && typeof userData.progress === "object"
        ? userData.progress
        : {};

    transaction.update(userRef, {
      enrolledCourses: arrayUnion(courseId),
      progress: {
        ...currentProgress,
        [courseId]: 0,
      },
    });

    transaction.update(courseRef, {
      students: currentStudents + 1,
    });

    return { alreadyEnrolled: false, type: "course", id: courseId };
  });
};

/* =========================================================
   CONSULTAR INSCRIPCIÓN A CURSO
========================================================= */

export const isUserEnrolled = async (userId, courseId) => {
  if (!userId || !courseId) return false;

  const userSnap = await getDoc(doc(db, "users", userId));

  if (!userSnap.exists()) return false;

  const enrolledCourses = userSnap.data().enrolledCourses || [];

  return Array.isArray(enrolledCourses) && enrolledCourses.includes(courseId);
};

/* =========================================================
   OBTENER CURSOS INSCRITOS
========================================================= */

export const getEnrolledCourses = async (userId) => {
  if (!userId) return [];

  const userSnap = await getDoc(doc(db, "users", userId));

  if (!userSnap.exists()) return [];

  const userData = userSnap.data();

  const ids = Array.isArray(userData.enrolledCourses)
    ? userData.enrolledCourses
    : [];

  const progress =
    userData.progress && typeof userData.progress === "object"
      ? userData.progress
      : {};

  if (!ids.length) return [];

  const courses = await Promise.all(
    ids.map((id) => getDoc(doc(db, "courses", id))),
  );

  return courses
    .filter((course) => course.exists())
    .map((course) => ({
      id: course.id,
      ...course.data(),
      progress: progress[course.id] ?? 0,
    }));
};

/* =========================================================
   CONSULTAR Y ACTUALIZAR PROGRESO
========================================================= */

export const getUserCourseProgress = async (userId, courseId) => {
  if (!userId || !courseId) return 0;

  const userSnap = await getDoc(doc(db, "users", userId));

  if (!userSnap.exists()) return 0;

  const progress = userSnap.data().progress || {};

  return progress[courseId] ?? 0;
};

export const updateCourseProgress = async (userId, courseId, progress) => {
  if (!userId || !courseId) {
    throw new Error("Información de progreso incompleta.");
  }

  const userRef = doc(db, "users", userId);
  const normalizedProgress = Math.max(0, Math.min(Number(progress) || 0, 1));

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);

    if (!snap.exists()) throw new Error("Usuario no encontrado.");

    const currentProgress = snap.data().progress || {};

    transaction.update(userRef, {
      progress: {
        ...currentProgress,
        [courseId]: normalizedProgress,
      },
    });
  });

  return normalizedProgress;
};

/* =========================================================
   CANCELAR INSCRIPCIÓN A CURSO
========================================================= */

export const cancelCourseEnrollment = async (userId, courseId) => {
  if (!userId || !courseId) {
    throw new Error("Información de cancelación incompleta.");
  }

  const userRef = doc(db, "users", userId);
  const courseRef = doc(db, "courses", courseId);

  return runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const courseSnap = await transaction.get(courseRef);

    if (!userSnap.exists()) {
      throw new Error("No se encontró tu perfil de usuario.");
    }

    const userData = userSnap.data();

    const enrolledCourses = Array.isArray(userData.enrolledCourses)
      ? userData.enrolledCourses
      : [];

    if (!enrolledCourses.includes(courseId)) {
      throw new Error("No estás inscrito en este curso.");
    }

    const updatedProgress = { ...(userData.progress || {}) };
    delete updatedProgress[courseId];

    transaction.update(userRef, {
      enrolledCourses: arrayRemove(courseId),
      progress: updatedProgress,
    });

    if (courseSnap.exists()) {
      const currentStudents = Math.max(
        0,
        Number(courseSnap.data().students) || 0,
      );

      transaction.update(courseRef, {
        students: Math.max(0, currentStudents - 1),
      });
    }

    return true;
  });
};

/* =========================================================
   INSCRIPCIÓN A TALLER
========================================================= */

export const enrollInWorkshop = async (userId, workshopId) => {
  if (!userId || !workshopId) {
    throw new Error("Información de inscripción incompleta.");
  }

  const userRef = doc(db, "users", userId);
  const workshopRef = doc(db, "workshops", workshopId);

  return runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const workshopSnap = await transaction.get(workshopRef);

    if (!userSnap.exists()) throw new Error("Usuario no encontrado.");
    if (!workshopSnap.exists()) throw new Error("Taller no encontrado.");

    const userData = userSnap.data();
    const workshopData = workshopSnap.data();

    const enrolledWorkshops = Array.isArray(userData.enrolledWorkshops)
      ? userData.enrolledWorkshops
      : [];

    const enrolled = Array.isArray(workshopData.enrolled)
      ? workshopData.enrolled
      : [];

    if (enrolledWorkshops.includes(workshopId) || enrolled.includes(userId)) {
      return { alreadyEnrolled: true, type: "workshop", id: workshopId };
    }

    const capacity = Number(workshopData.capacity) || 0;

    if (capacity > 0 && enrolled.length >= capacity) {
      throw new Error("Este taller ya no tiene cupos disponibles.");
    }

    transaction.update(userRef, {
      enrolledWorkshops: arrayUnion(workshopId),
    });

    transaction.update(workshopRef, {
      enrolled: arrayUnion(userId),
    });

    return { alreadyEnrolled: false, type: "workshop", id: workshopId };
  });
};

/* =========================================================
   CONSULTAR INSCRIPCIÓN A TALLER
========================================================= */

export const isUserEnrolledInWorkshop = async (userId, workshopId) => {
  if (!userId || !workshopId) return false;

  const userSnap = await getDoc(doc(db, "users", userId));

  if (!userSnap.exists()) return false;

  const enrolledWorkshops = userSnap.data().enrolledWorkshops || [];

  return (
    Array.isArray(enrolledWorkshops) && enrolledWorkshops.includes(workshopId)
  );
};

/* =========================================================
   OBTENER TALLERES INSCRITOS
========================================================= */

export const getEnrolledWorkshops = async (userId) => {
  if (!userId) return [];

  const userSnap = await getDoc(doc(db, "users", userId));

  if (!userSnap.exists()) return [];

  const ids = Array.isArray(userSnap.data().enrolledWorkshops)
    ? userSnap.data().enrolledWorkshops
    : [];

  if (!ids.length) return [];

  const workshops = await Promise.all(
    ids.map((id) => getDoc(doc(db, "workshops", id))),
  );

  return workshops
    .filter((workshop) => workshop.exists())
    .map((workshop) => {
      const data = workshop.data();

      return {
        id: workshop.id,
        ...data,
        enrolledCount: Array.isArray(data.enrolled) ? data.enrolled.length : 0,
      };
    });
};

/* =========================================================
   CANCELAR INSCRIPCIÓN A TALLER
========================================================= */

export const cancelWorkshopEnrollment = async (userId, workshopId) => {
  if (!userId || !workshopId) {
    throw new Error("Información de cancelación incompleta.");
  }

  const userRef = doc(db, "users", userId);
  const workshopRef = doc(db, "workshops", workshopId);

  return runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const workshopSnap = await transaction.get(workshopRef);

    if (!userSnap.exists()) {
      throw new Error("No se encontró tu perfil de usuario.");
    }

    const enrolledWorkshops = Array.isArray(userSnap.data().enrolledWorkshops)
      ? userSnap.data().enrolledWorkshops
      : [];

    if (!enrolledWorkshops.includes(workshopId)) {
      throw new Error("No estás inscrito en este taller.");
    }

    transaction.update(userRef, {
      enrolledWorkshops: arrayRemove(workshopId),
    });

    if (workshopSnap.exists()) {
      transaction.update(workshopRef, {
        enrolled: arrayRemove(userId),
        updatedAt: new Date().toISOString(),
      });
    }

    return true;
  });
};

/* =========================================================
   OBTENER TODAS LAS INSCRIPCIONES DE UN USUARIO
========================================================= */

export const getUserEnrollments = async (userId) => {
  if (!userId) {
    return { courses: [], workshops: [] };
  }

  const userSnap = await getDoc(doc(db, "users", userId));

  if (!userSnap.exists()) {
    return { courses: [], workshops: [] };
  }

  const userData = userSnap.data();

  return {
    courses: Array.isArray(userData.enrolledCourses)
      ? userData.enrolledCourses
      : [],
    workshops: Array.isArray(userData.enrolledWorkshops)
      ? userData.enrolledWorkshops
      : [],
  };
};

/* =========================================================
   OBTENER ESTUDIANTES DE LAS ACTIVIDADES DEL INSTRUCTOR
========================================================= */

export const getInstructorStudents = async (instructorId) => {
  if (!instructorId) return [];

  const studentsMap = new Map();

  const coursesQuery = query(
    collection(db, "courses"),
    where("instructorId", "==", instructorId),
  );

  const workshopsQuery = query(
    collection(db, "workshops"),
    where("instructorId", "==", instructorId),
  );

  const [coursesSnapshot, workshopsSnapshot] = await Promise.all([
    getDocs(coursesQuery),
    getDocs(workshopsQuery),
  ]);

  const courseIds = new Set(coursesSnapshot.docs.map((item) => item.id));
  const workshopIds = new Set(workshopsSnapshot.docs.map((item) => item.id));

  const usersSnapshot = await getDocs(collection(db, "users"));

  usersSnapshot.docs.forEach((userDoc) => {
    const userData = userDoc.data();

    const enrolledCourses = Array.isArray(userData.enrolledCourses)
      ? userData.enrolledCourses
      : [];

    const enrolledWorkshops = Array.isArray(userData.enrolledWorkshops)
      ? userData.enrolledWorkshops
      : [];

    const hasCourse = enrolledCourses.some((id) => courseIds.has(id));
    const hasWorkshop = enrolledWorkshops.some((id) => workshopIds.has(id));

    if (hasCourse || hasWorkshop) {
      studentsMap.set(userDoc.id, {
        id: userDoc.id,
        uid: userDoc.id,
        ...userData,
      });
    }
  });

  return Array.from(studentsMap.values());
};

/* =========================================================
   RETIRAR ESTUDIANTE DE UNA ACTIVIDAD DEL INSTRUCTOR
========================================================= */

export const removeInstructorStudentEnrollment = async (
  userId,
  activityId,
  activityType,
  instructorId,
) => {
  if (!userId || !activityId || !instructorId) {
    throw new Error("Faltan datos para retirar al estudiante.");
  }

  if (!["course", "workshop"].includes(activityType)) {
    throw new Error("El tipo de actividad no es válido.");
  }

  const userRef = doc(db, "users", userId);
  const collectionName = activityType === "course" ? "courses" : "workshops";
  const activityRef = doc(db, collectionName, activityId);

  return runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const activitySnap = await transaction.get(activityRef);

    if (!userSnap.exists()) {
      throw new Error("No se encontró el estudiante.");
    }

    if (!activitySnap.exists()) {
      throw new Error("La actividad ya no está disponible.");
    }

    const activity = activitySnap.data();

    if (activity.instructorId !== instructorId) {
      throw new Error("Solo puedes retirar estudiantes de tus actividades.");
    }

    const userData = userSnap.data();

    if (activityType === "course") {
      const enrolledCourses = Array.isArray(userData.enrolledCourses)
        ? userData.enrolledCourses
        : [];

      if (!enrolledCourses.includes(activityId)) {
        throw new Error("El estudiante ya no está inscrito en este curso.");
      }

      const updatedProgress = { ...(userData.progress || {}) };
      delete updatedProgress[activityId];

      const currentStudents = Math.max(0, Number(activity.students) || 0);

      transaction.update(userRef, {
        enrolledCourses: arrayRemove(activityId),
        progress: updatedProgress,
      });

      transaction.update(activityRef, {
        students: Math.max(0, currentStudents - 1),
      });
    } else {
      const enrolledWorkshops = Array.isArray(userData.enrolledWorkshops)
        ? userData.enrolledWorkshops
        : [];

      const enrolled = Array.isArray(activity.enrolled)
        ? activity.enrolled
        : [];

      if (
        !enrolledWorkshops.includes(activityId) ||
        !enrolled.includes(userId)
      ) {
        throw new Error("El estudiante ya no está inscrito en este taller.");
      }

      transaction.update(userRef, {
        enrolledWorkshops: arrayRemove(activityId),
      });

      transaction.update(activityRef, {
        enrolled: arrayRemove(userId),
        updatedAt: new Date().toISOString(),
      });
    }

    return true;
  });
};
