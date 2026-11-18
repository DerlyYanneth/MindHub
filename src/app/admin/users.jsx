import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AdminHeader from "../../components/AdminHea";
import { useAuth } from "../../hooks/useAuth";
import {
  approveInstructor,
  deleteUser,
  getAllUsers,
  updateUser,
  updateUserRole,
} from "../../services/userService";

const C = {
  primary: "#5B4BDB",
  light: "#EEEAFE",
  background: "#F6F7FB",
  surface: "#FFFFFF",
  text: "#20223A",
  muted: "#777B91",
  border: "#E8E9F2",
  green: "#159A75",
  orange: "#E88B32",
  red: "#D94D67",
};

const ROLES = [
  { value: "user", label: "Usuario", color: C.primary },
  { value: "instructor", label: "Instructor", color: C.green },
  { value: "admin", label: "Administrador", color: C.orange },
];

const getRole = (role) => {
  const value = String(role || "user")
    .trim()
    .toLowerCase();

  if (value === "administrador") return "admin";

  return ROLES.some((item) => item.value === value) ? value : "user";
};

const getRoleStatus = (item) =>
  String(item?.roleStatus || "")
    .trim()
    .toLowerCase();

const isPendingInstructor = (item) =>
  getRole(item.role) === "instructor" && getRoleStatus(item) !== "approved";

const roleInfo = (role) =>
  ROLES.find((item) => item.value === getRole(role)) || ROLES[0];

export default function UsersAdmin() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [error, setError] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName1: "",
    lastName2: "",
    email: "",
  });

  const showMessage = (title, message) => {
    if (Platform.OS === "web") {
      globalThis.alert?.(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const loadUsers = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      setError("No fue posible cargar los usuarios. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const counts = useMemo(
    () => ({
      all: users.length,
      user: users.filter((item) => getRole(item.role) === "user").length,
      instructor: users.filter(
        (item) =>
          getRole(item.role) === "instructor" &&
          getRoleStatus(item) === "approved",
      ).length,
      pending: users.filter(isPendingInstructor).length,
      admin: users.filter((item) => getRole(item.role) === "admin").length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((item) => {
      const name = [
        item.firstName,
        item.lastName1,
        item.lastName2,
        item.name,
        item.displayName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const email = String(item.email || "").toLowerCase();
      const id = String(item.id || item.uid || "").toLowerCase();

      const matchesSearch =
        !term ||
        name.includes(term) ||
        email.includes(term) ||
        id.includes(term);

      let matchesRole = true;

      if (selectedRole === "pending") {
        matchesRole = isPendingInstructor(item);
      } else if (selectedRole !== "all") {
        matchesRole = getRole(item.role) === selectedRole;
      }

      return matchesSearch && matchesRole;
    });
  }, [users, search, selectedRole]);

  const openEdit = (item) => {
    setEditingUser(item);

    setForm({
      firstName: item.firstName || "",
      lastName1: item.lastName1 || "",
      lastName2: item.lastName2 || "",
      email: item.email || "",
    });
  };

  const saveEdit = async () => {
    const uid = editingUser?.id || editingUser?.uid;

    if (!uid) {
      showMessage("Error", "No se encontró el identificador del usuario.");
      return;
    }

    const firstName = form.firstName.trim();
    const lastName1 = form.lastName1.trim();
    const lastName2 = form.lastName2.trim();
    const email = form.email.trim().toLowerCase();

    if (!firstName || !lastName1 || !lastName2 || !email) {
      showMessage(
        "Campos obligatorios",
        "Completa el nombre, los dos apellidos y el correo electrónico.",
      );
      return;
    }

    const name = `${firstName} ${lastName1} ${lastName2}`;

    setProcessingId(uid);

    try {
      await updateUser(uid, {
        firstName,
        lastName1,
        lastName2,
        name,
        email,
      });

      setUsers((current) =>
        current.map((item) =>
          (item.id || item.uid) === uid
            ? { ...item, firstName, lastName1, lastName2, name, email }
            : item,
        ),
      );

      setEditingUser(null);
      showMessage(
        "Usuario actualizado",
        "Los cambios se guardaron en Firestore.",
      );
    } catch (err) {
      console.error("Error editando usuario:", err);
      showMessage(
        "No se pudo actualizar",
        err.message || "Verifica los permisos de Firebase.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const changeRole = (item) => {
    const uid = item.id || item.uid;

    if (uid === currentUser?.uid) {
      showMessage(
        "Acción no permitida",
        "No puedes cambiar tu propio rol desde esta pantalla.",
      );
      return;
    }

    const options = ROLES.filter(
      (option) => option.value !== getRole(item.role),
    );

    if (Platform.OS === "web") {
      const selected = globalThis.prompt?.(
        `Escribe uno de estos roles: ${options.map((option) => option.value).join(", ")}`,
      );

      const option = options.find((item) => item.value === selected);

      if (option) confirmRoleChange(item, option);
      return;
    }

    Alert.alert(
      "Cambiar rol",
      `Selecciona el nuevo rol para ${item.name || item.email || "este usuario"}.`,
      [
        { text: "Cancelar", style: "cancel" },
        ...options.map((option) => ({
          text: option.label,
          onPress: () => confirmRoleChange(item, option),
        })),
      ],
    );
  };

  const confirmRoleChange = (item, option) => {
    const uid = item.id || item.uid;

    const performChange = async () => {
      setProcessingId(uid);

      try {
        await updateUserRole(uid, option.value);

        setUsers((current) =>
          current.map((userItem) =>
            (userItem.id || userItem.uid) === uid
              ? {
                  ...userItem,
                  role: option.value,
                  roleStatus:
                    option.value === "instructor" ? "pending" : "approved",
                }
              : userItem,
          ),
        );

        showMessage(
          "Rol actualizado",
          option.value === "instructor"
            ? "El usuario ahora tiene una solicitud de instructor pendiente de aprobación."
            : "El cambio se guardó correctamente.",
        );
      } catch (err) {
        showMessage(
          "Error",
          err.message || "No fue posible actualizar el rol.",
        );
      } finally {
        setProcessingId(null);
      }
    };

    if (Platform.OS === "web") {
      if (
        globalThis.confirm?.(
          `¿Asignar el rol ${option.label} a ${item.name || item.email}?`,
        )
      ) {
        performChange();
      }
      return;
    }

    Alert.alert(
      "Confirmar cambio",
      `¿Asignar el rol ${option.label} a ${item.name || item.email}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: performChange },
      ],
    );
  };

  const handleApproveInstructor = (item) => {
    const uid = item.id || item.uid;

    if (!uid) {
      showMessage("Error", "No se encontró el identificador del instructor.");
      return;
    }

    const performApproval = async () => {
      setProcessingId(uid);

      try {
        await approveInstructor(uid);

        setUsers((current) =>
          current.map((userItem) =>
            (userItem.id || userItem.uid) === uid
              ? {
                  ...userItem,
                  role: "instructor",
                  roleStatus: "approved",
                }
              : userItem,
          ),
        );

        showMessage(
          "Instructor aprobado",
          `${item.name || item.email || "El usuario"} ya tiene habilitado el rol de instructor.`,
        );
      } catch (err) {
        console.error("Error aprobando instructor:", err);
        showMessage(
          "No se pudo aprobar",
          err.message ||
            "No fue posible aprobar al instructor. Verifica la función approveInstructor en userService.js y los permisos de Firestore.",
        );
      } finally {
        setProcessingId(null);
      }
    };

    if (Platform.OS === "web") {
      if (
        globalThis.confirm?.(
          `¿Deseas aprobar a ${item.name || item.email || "este instructor"}?`,
        )
      ) {
        performApproval();
      }
      return;
    }

    Alert.alert(
      "Aprobar instructor",
      `¿Deseas aprobar a ${item.name || item.email || "este instructor"}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprobar",
          onPress: performApproval,
        },
      ],
    );
  };

  const performDelete = async (item) => {
    const uid = item.id || item.uid;

    if (!uid || uid === currentUser?.uid) {
      showMessage(
        "Acción no permitida",
        "No puedes eliminar tu propia cuenta desde este panel.",
      );
      return;
    }

    setProcessingId(uid);

    try {
      await deleteUser(uid);

      setUsers((current) =>
        current.filter((userItem) => (userItem.id || userItem.uid) !== uid),
      );

      showMessage(
        "Documento eliminado",
        "Se eliminó el registro del usuario en Firestore. La cuenta de Firebase Authentication requiere eliminación mediante una función segura del servidor.",
      );
    } catch (err) {
      console.error("Error eliminando usuario:", err);
      showMessage(
        "No se pudo eliminar",
        err.message || "Verifica los permisos de Firebase.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const confirmDelete = (item) => {
    const name = item.name || item.email || "este usuario";

    const message = `¿Deseas eliminar el registro de ${name} de Firestore? Esta acción no elimina su cuenta de Firebase Authentication.`;

    if (Platform.OS === "web") {
      if (globalThis.confirm?.(message)) {
        performDelete(item);
      }
      return;
    }

    Alert.alert("Eliminar usuario", message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar registro",
        style: "destructive",
        onPress: () => performDelete(item),
      },
    ]);
  };

  const renderUser = ({ item }) => {
    const uid = item.id || item.uid;
    const role = roleInfo(item.role);
    const name =
      item.name ||
      [item.firstName, item.lastName1, item.lastName2]
        .filter(Boolean)
        .join(" ") ||
      item.displayName ||
      "Usuario sin nombre";

    const isSelf = uid === currentUser?.uid;
    const isProcessing = processingId === uid;
    const pending = isPendingInstructor(item);
    const approved =
      getRole(item.role) === "instructor" && getRoleStatus(item) === "approved";

    return (
      <View style={styles.userCard}>
        <View style={[styles.avatar, { backgroundColor: `${role.color}18` }]}>
          <Text style={[styles.avatarText, { color: role.color }]}>
            {name.trim().charAt(0).toUpperCase() || "U"}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userEmail}>
            {item.email || "Correo no disponible"}
          </Text>
          <Text style={styles.userId} numberOfLines={1}>
            ID: {uid}
          </Text>

          <View style={styles.badgeRow}>
            <View
              style={[styles.roleBadge, { backgroundColor: `${role.color}18` }]}
            >
              <Text style={[styles.roleText, { color: role.color }]}>
                {role.label}
              </Text>
            </View>

            {pending ? (
              <View style={styles.pendingBadge}>
                <Ionicons name="time-outline" size={14} color="#A96513" />
                <Text style={styles.pendingText}>Pendiente</Text>
              </View>
            ) : null}

            {approved ? (
              <View style={styles.approvedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={C.green} />
                <Text style={styles.approvedText}>Aprobado</Text>
              </View>
            ) : null}
          </View>

          {pending ? (
            <TouchableOpacity
              style={styles.approveButton}
              disabled={isProcessing || isSelf}
              onPress={() => handleApproveInstructor(item)}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.approveButtonText}>
                    Aprobar instructor
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editButton}
              disabled={isProcessing || isSelf}
              onPress={() => openEdit(item)}
            >
              <Ionicons name="create-outline" size={18} color={C.primary} />
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleButton}
              disabled={isProcessing || isSelf}
              onPress={() => changeRole(item)}
            >
              <Ionicons name="shield-outline" size={18} color={C.green} />
              <Text style={styles.roleButtonText}>Rol</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              disabled={isProcessing || isSelf}
              onPress={() => confirmDelete(item)}
            >
              <Ionicons name="trash-outline" size={18} color={C.red} />
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>

          {isSelf ? (
            <Text style={styles.selfNote}>Tu cuenta actual</Text>
          ) : null}

          {isProcessing && !pending ? (
            <ActivityIndicator color={C.primary} style={{ marginTop: 8 }} />
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <AdminHeader active="users" />

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="people-outline" size={29} color={C.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Usuarios</Text>
          <Text style={styles.pageSubtitle}>
            Administra perfiles, datos y permisos.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => loadUsers(true)}
        >
          <Ionicons name="refresh-outline" size={23} color={C.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryGrid}>
        {[
          ["all", "Todos", counts.all, C.text],
          ["user", "Usuarios", counts.user, C.primary],
          ["instructor", "Instructores aprobados", counts.instructor, C.green],
          ["pending", "Pendientes", counts.pending, C.orange],
          ["admin", "Administradores", counts.admin, C.orange],
        ].map(([value, label, count, color]) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.summaryCard,
              selectedRole === value && styles.summarySelected,
            ]}
            onPress={() => setSelectedRole(value)}
          >
            <Text style={[styles.summaryValue, { color }]}>{count}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={21} color={C.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, correo o ID..."
          placeholderTextColor="#A0A3B4"
          style={styles.searchInput}
          autoCapitalize="none"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={21} color={C.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.resultRow}>
        <Text style={styles.resultTitle}>Directorio de usuarios</Text>
        <Text style={styles.resultCount}>{filteredUsers.length}</Text>
      </View>

      {error ? (
        <TouchableOpacity
          style={styles.errorBox}
          onPress={() => loadUsers(true)}
        >
          <Text style={styles.errorText}>{error} Toca para reintentar.</Text>
        </TouchableOpacity>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item, index) => String(item.id || item.uid || index)}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadUsers(true)}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={42} color={C.primary} />
              <Text style={styles.emptyTitle}>
                No hay usuarios para mostrar
              </Text>
              <Text style={styles.emptyDescription}>
                Cambia los filtros o intenta otra búsqueda.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={Boolean(editingUser)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingUser(null)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Editar usuario</Text>
              <Text style={styles.modalSubtitle}>
                Actualiza la información del perfil.
              </Text>

              {[
                ["firstName", "Nombre"],
                ["lastName1", "Primer apellido"],
                ["lastName2", "Segundo apellido"],
                ["email", "Correo electrónico"],
              ].map(([key, label]) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={form[key]}
                    onChangeText={(value) =>
                      setForm((current) => ({ ...current, [key]: value }))
                    }
                    autoCapitalize={key === "email" ? "none" : "words"}
                    keyboardType={key === "email" ? "email-address" : "default"}
                  />
                </View>
              ))}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditingUser(null)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveEdit}
                  disabled={Boolean(processingId)}
                >
                  {processingId === (editingUser?.id || editingUser?.uid) ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar cambios</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 13,
  },
  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: { color: C.text, fontSize: 25, fontWeight: "900" },
  pageSubtitle: { color: C.muted, fontSize: 14, marginTop: 4 },
  refreshButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: "20%",
    minWidth: 85,
    paddingVertical: 15,
    paddingHorizontal: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
  },
  summarySelected: { borderColor: C.primary, backgroundColor: C.light },
  summaryValue: { fontSize: 24, fontWeight: "900" },
  summaryLabel: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  searchBox: {
    marginHorizontal: 20,
    minHeight: 52,
    paddingHorizontal: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 15, paddingVertical: 10 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 20,
    paddingTop: 21,
    paddingBottom: 13,
  },
  resultTitle: { color: C.text, fontSize: 18, fontWeight: "900" },
  resultCount: {
    color: C.primary,
    backgroundColor: C.light,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: "900",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
    flexGrow: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    padding: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 21, fontWeight: "900" },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { color: C.text, fontSize: 17, fontWeight: "900" },
  userEmail: { color: C.muted, fontSize: 14, marginTop: 5 },
  userId: { color: "#9295A6", fontSize: 11, marginTop: 5 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  roleBadge: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 9 },
  roleText: { fontSize: 12, fontWeight: "900" },
  pendingBadge: {
    backgroundColor: "#FFF2D9",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pendingText: { color: "#A96513", fontSize: 12, fontWeight: "800" },
  approvedBadge: {
    backgroundColor: "#E6F6F0",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  approvedText: { color: C.green, fontSize: 12, fontWeight: "800" },
  approveButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: C.green,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 12,
  },
  approveButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 13 },
  editButton: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    backgroundColor: C.light,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  editButtonText: { color: C.primary, fontSize: 13, fontWeight: "800" },
  roleButton: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    backgroundColor: "#E6F6F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  roleButtonText: { color: C.green, fontSize: 13, fontWeight: "800" },
  deleteButton: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    backgroundColor: "#FFF0F2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  deleteButtonText: { color: C.red, fontSize: 13, fontWeight: "800" },
  selfNote: { color: C.muted, fontSize: 12, marginTop: 9 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  loadingText: { color: C.muted, marginTop: 10, fontSize: 14 },
  errorBox: {
    marginHorizontal: 20,
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#FFF0F2",
  },
  errorText: { color: C.red, fontSize: 14 },
  emptyState: { alignItems: "center", padding: 35, gap: 10 },
  emptyTitle: { color: C.text, fontSize: 18, fontWeight: "900" },
  emptyDescription: { color: C.muted, fontSize: 14, textAlign: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#17152B99",
    justifyContent: "center",
    padding: 20,
  },
  modalScroll: { flexGrow: 1, justifyContent: "center" },
  modalCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 22,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  modalTitle: { color: C.text, fontSize: 22, fontWeight: "900" },
  modalSubtitle: {
    color: C.muted,
    fontSize: 14,
    marginTop: 5,
    marginBottom: 17,
  },
  field: { marginBottom: 13 },
  fieldLabel: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 7,
  },
  fieldInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
    paddingHorizontal: 13,
    color: C.text,
    fontSize: 15,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  cancelButton: {
    flex: 1,
    padding: 13,
    borderRadius: 11,
    backgroundColor: "#F0F0F5",
    alignItems: "center",
  },
  cancelButtonText: { color: C.text, fontSize: 14, fontWeight: "800" },
  saveButton: {
    flex: 1,
    padding: 13,
    borderRadius: 11,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
