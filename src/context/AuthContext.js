import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { auth, db } from "../services/firebaseConfig";

// Contexto de autenticación.
export const AuthContext = createContext(null);

// Normalizar los roles.
export const normalizeRole = (role) => {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();

  if (normalizedRole === "admin" || normalizedRole === "administrador") {
    return "admin";
  }

  if (normalizedRole === "instructor") {
    return "instructor";
  }

  return "user";
};

// Obtener el nombre visible del rol.
export const getRoleLabel = (role) => {
  switch (normalizeRole(role)) {
    case "admin":
      return "Administrador";

    case "instructor":
      return "Instructor";

    default:
      return "Usuario";
  }
};

// Hook para acceder al contexto.
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider.");
  }

  return context;
};

// Proveedor de autenticación.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cerrar sesión.
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      throw error;
    }
  }, []);

  // Detectar cambios en la autenticación.
  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Si no hay sesión activa.
      if (!firebaseUser) {
        if (active) {
          setUser(null);
          setRole(null);
          setUserData(null);
          setLoading(false);
        }

        return;
      }

      if (active) {
        setLoading(true);
      }

      try {
        // Consultar documento del usuario en Firestore.
        const userRef = doc(db, "users", firebaseUser.uid);

        const userDoc = await getDoc(userRef);

        // Obtener información almacenada.
        const data = userDoc.exists() ? userDoc.data() : {};

        const storedRole = data.role || "user";

        // Validar aprobación del instructor.
        const isApprovedInstructor =
          storedRole === "instructor" && data.roleStatus === "approved";

        // Determinar el rol efectivo.
        let effectiveRole = storedRole;

        if (storedRole === "instructor" && !isApprovedInstructor) {
          effectiveRole = "user";
        }

        const normalizedRole = normalizeRole(effectiveRole);

        if (active) {
          setUser(firebaseUser);

          setRole(normalizedRole);

          setUserData({
            ...data,

            uid: firebaseUser.uid,

            email: firebaseUser.email,

            name: data.name || firebaseUser.displayName || "",

            firstName: data.firstName || "",

            lastName1: data.lastName1 || "",

            lastName2: data.lastName2 || "",

            role: storedRole,

            roleStatus:
              data.roleStatus ||
              (storedRole === "instructor" ? "pending" : "approved"),

            photoURL: data.photoURL || firebaseUser.photoURL || "",

            enrolledCourses: data.enrolledCourses || [],

            enrolledWorkshops: data.enrolledWorkshops || [],

            progress: data.progress || {},
          });
        }
      } catch (error) {
        console.error("Error obteniendo información del usuario:", error);

        if (active) {
          setUser(firebaseUser);

          // En caso de error, no conceder permisos elevados.
          setRole("user");

          setUserData({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: "user",
            roleStatus: "pending",
            name: firebaseUser.displayName || "",
            enrolledCourses: [],
            enrolledWorkshops: [],
            progress: {},
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,

        role,

        userData,

        loading,

        logout,

        roleLabel: getRoleLabel(role),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
