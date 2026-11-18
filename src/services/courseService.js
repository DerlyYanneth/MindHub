import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebaseConfig";

/* =========================================================
   CURSOS PREDETERMINADOS DE MINDHUB
========================================================= */

export const DEMO_COURSES = [
  {
    title: "Introducción al dibujo creativo",
    description:
      "Aprende técnicas básicas de dibujo y desarrolla tu creatividad mediante ejercicios prácticos. Este curso está diseñado para principiantes y permite explorar formas, líneas, composición y creación de ilustraciones sencillas.",
    instructor: "Equipo MindHub",
    price: 45000,
    category: "Arte",
    level: "Principiante",
    duration: "4 horas",
    modality: "Virtual",
    objective:
      "Desarrollar habilidades básicas de dibujo mediante ejercicios progresivos que estimulen la creatividad y la expresión visual.",
    imageUrl:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80",
    videoId: "39K_R_F2T6c",
    videoUrl: "https://youtube.com/shorts/39K_R_F2T6c",
    modules: [
      { title: "Introducción al dibujo creativo", duration: "1 hora" },
      { title: "Líneas, formas y proporciones", duration: "1 hora" },
      { title: "Técnicas básicas de sombreado", duration: "1 hora" },
      { title: "Creación de una ilustración", duration: "1 hora" },
    ],
  },
  {
    title: "Manualidades creativas con materiales reciclados",
    description:
      "Descubre cómo transformar materiales cotidianos en proyectos creativos. Aprenderás diferentes técnicas de elaboración y decoración utilizando materiales fáciles de conseguir.",
    instructor: "Equipo MindHub",
    price: 50000,
    category: "Manualidades",
    level: "Principiante",
    duration: "5 horas",
    modality: "Virtual",
    objective:
      "Aprender técnicas básicas de manualidades aprovechando materiales reciclables y desarrollando la creatividad mediante proyectos prácticos.",
    imageUrl:
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80",
    videoId: "",
    videoUrl: "",
    modules: [
      { title: "Introducción a las manualidades", duration: "1 hora" },
      { title: "Selección y preparación de materiales", duration: "1 hora" },
      { title: "Técnicas de corte, unión y decoración", duration: "1 hora" },
      { title: "Elaboración de un proyecto creativo", duration: "1 hora" },
      {
        title: "Presentación y personalización del proyecto",
        duration: "1 hora",
      },
    ],
  },
  {
    title: "Diseño creativo de figuras en papel",
    description:
      "Aprende a crear diferentes figuras utilizando papel mediante técnicas de plegado, composición y diseño. El curso combina creatividad, precisión y seguimiento de instrucciones.",
    instructor: "Equipo MindHub",
    price: 48000,
    category: "Diseño",
    level: "Intermedio",
    duration: "4 horas",
    modality: "Virtual",
    objective:
      "Desarrollar habilidades de precisión y creatividad mediante la elaboración de figuras en papel siguiendo procesos paso a paso.",
    imageUrl:
      "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=900&q=80",
    videoId: "",
    videoUrl: "",
    modules: [
      { title: "Materiales y preparación del papel", duration: "45 minutos" },
      { title: "Técnicas básicas de plegado", duration: "45 minutos" },
      { title: "Construcción de figuras", duration: "1 hora" },
      { title: "Composición y detalles", duration: "45 minutos" },
      { title: "Proyecto final", duration: "45 minutos" },
    ],
  },
];

/* =========================================================
   OBTENER CURSOS EXISTENTES
========================================================= */

const fetchCourses = async () => {
  const snapshot = await getDocs(collection(db, "courses"));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

/* =========================================================
   CREAR CURSO
========================================================= */

export const createCourse = async (data) => {
  if (!data || typeof data !== "object") {
    throw new Error("Los datos del curso no son válidos.");
  }

  const courseData = {
    title: data.title?.trim() || "Curso sin título",
    description: data.description?.trim() || "",
    instructor: data.instructor?.trim() || "Instructor MindHub",
    instructorId: data.instructorId || null,
    price: Math.max(0, Number(data.price) || 0),
    imageUrl: data.imageUrl?.trim() || "",
    videoId: data.videoId?.trim() || "",
    videoUrl: data.videoUrl?.trim() || "",
    category: data.category?.trim() || "Creatividad",
    level: data.level?.trim() || "Principiante",
    duration: data.duration?.trim() || "Por definir",
    modality: data.modality?.trim() || "Virtual",
    objective: data.objective?.trim() || "",
    modules: Array.isArray(data.modules) ? data.modules : [],
    rating: Math.max(0, Number(data.rating) || 0),
    students: Math.max(0, Number(data.students) || 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const ref = await addDoc(collection(db, "courses"), courseData);

  return ref.id;
};

/* =========================================================
   CREAR CURSOS PREDETERMINADOS QUE NO EXISTAN
========================================================= */

export const ensureDefaultCourses = async () => {
  const existingCourses = await fetchCourses();
  const created = [];

  for (const course of DEMO_COURSES) {
    const exists = existingCourses.some(
      (existing) =>
        existing.title?.trim().toLowerCase() ===
        course.title.trim().toLowerCase(),
    );

    if (!exists) {
      const id = await createCourse(course);

      created.push({
        id,
        title: course.title,
      });

      // Evita duplicados dentro de la misma ejecución.
      existingCourses.push({ id, title: course.title });
    }
  }

  return created;
};

/* =========================================================
   OBTENER TODOS LOS CURSOS
========================================================= */

export const getCourses = async () => {
  const existingCourses = await fetchCourses();

  try {
    await ensureDefaultCourses();
    return await fetchCourses();
  } catch (error) {
    console.warn(
      "No se pudieron completar los cursos predeterminados:",
      error?.message,
    );

    return existingCourses;
  }
};

/* =========================================================
   OBTENER CURSO POR ID
========================================================= */

export const getCourseById = async (id) => {
  if (!id) return null;

  const snapshot = await getDoc(doc(db, "courses", id));

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

/* =========================================================
   OBTENER CURSOS DE UN INSTRUCTOR
========================================================= */

export const getCoursesByInstructor = async (instructorId) => {
  if (!instructorId) return [];

  const coursesQuery = query(
    collection(db, "courses"),
    where("instructorId", "==", instructorId),
  );

  const snapshot = await getDocs(coursesQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

/* =========================================================
   ACTUALIZAR CURSO
========================================================= */

export const updateCourse = async (id, data) => {
  if (!id) {
    throw new Error("ID del curso no válido.");
  }

  if (!data || typeof data !== "object") {
    throw new Error("Los datos del curso no son válidos.");
  }

  const courseRef = doc(db, "courses", id);
  const courseSnap = await getDoc(courseRef);

  if (!courseSnap.exists()) {
    throw new Error("El curso que intentas actualizar no existe.");
  }

  const updatedData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(data, "price")) {
    updatedData.price = Math.max(0, Number(data.price) || 0);
  }

  if (Object.prototype.hasOwnProperty.call(data, "students")) {
    updatedData.students = Math.max(0, Number(data.students) || 0);
  }

  if (Object.prototype.hasOwnProperty.call(data, "modules")) {
    if (!Array.isArray(data.modules)) {
      throw new Error("Los módulos deben enviarse en formato de lista.");
    }
  }

  await updateDoc(courseRef, updatedData);

  return true;
};

/* =========================================================
   ELIMINAR CURSO
========================================================= */

export const deleteCourse = async (id) => {
  if (!id) {
    throw new Error("ID del curso no válido.");
  }

  const courseRef = doc(db, "courses", id);
  const courseSnap = await getDoc(courseRef);

  if (!courseSnap.exists()) {
    throw new Error("El curso que intentas eliminar no existe.");
  }

  const students = Math.max(0, Number(courseSnap.data().students) || 0);

  if (students > 0) {
    throw new Error(
      "No puedes eliminar un curso que tiene estudiantes inscritos. Gestiona primero sus inscripciones.",
    );
  }

  await deleteDoc(courseRef);

  return true;
};
