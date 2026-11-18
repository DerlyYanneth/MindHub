import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AdminHeader from "../../components/AdminHea";
import { AuthContext } from "../../context/AuthContext";
import { getAllUsers } from "../../services/userService";
import {
  createWorkshop,
  deleteWorkshop,
  getWorkshops,
  updateWorkshop,
} from "../../services/workshopService";

const C = {
  primary: "#5B4BDB",
  primaryDark: "#4435B2",
  light: "#EEEAFE",
  background: "#F5F6FC",
  surface: "#FFFFFF",
  text: "#20223A",
  muted: "#777B91",
  border: "#E8E9F2",
  green: "#159A75",
  orange: "#E88B32",
  red: "#D94D67",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  objective: "",
  instructor: "",
  instructorId: "",
  date: "",
  schedule: "",
  location: "Modalidad virtual",
  capacity: "20",
  price: "0",
  category: "Creatividad",
  duration: "2 horas",
  imageUrl: "",
};

const categories = [
  "Creatividad",
  "Arte",
  "Diseño",
  "Manualidades",
  "Tecnología",
];

export default function ManageWorkshopsScreen() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useContext(AuthContext);

  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [instructors, setInstructors] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [instructorPickerOpen, setInstructorPickerOpen] = useState(false);
  const [instructorSearch, setInstructorSearch] = useState("");

  const isAdmin = role === "admin" || role === "administrador";

  const loadWorkshops = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getWorkshops();
      setWorkshops(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando talleres:", err);
      setError(
        "No se pudieron cargar los talleres. Comprueba la conexión e inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadWorkshops();
    } else if (!authLoading && !isAdmin) {
      setLoading(false);
    }
  }, [authLoading, isAdmin, loadWorkshops]);

  const loadInstructors = useCallback(async () => {
    setLoadingInstructors(true);
    try {
      const users = await getAllUsers();
      const registeredInstructors = (Array.isArray(users) ? users : [])
        .filter((person) => {
          const normalizedRole = String(person.role || person.rol || "")
            .trim()
            .toLowerCase();
          return ["instructor", "instructora", "instructor/a"].includes(
            normalizedRole,
          );
        })
        .map((person) => {
          const uid = String(
            person.uid || person.id || person.userId || "",
          ).trim();
          const name = String(
            person.name ||
              person.displayName ||
              person.fullName ||
              person.nombre ||
              person.email ||
              "Instructor sin nombre",
          ).trim();
          return { ...person, uid, name, email: String(person.email || "") };
        })
        .filter((person) => person.uid);
      setInstructors(registeredInstructors);
    } catch (err) {
      console.error("Error cargando instructores:", err);
      setInstructors([]);
      setError(
        "No se pudo cargar la lista de instructores. Verifica la conexión con Firebase.",
      );
    } finally {
      setLoadingInstructors(false);
    }
  }, []);

  useEffect(() => {
    if (modalVisible) loadInstructors();
  }, [modalVisible, loadInstructors]);

  const filteredInstructors = useMemo(() => {
    const term = instructorSearch.trim().toLowerCase();
    return instructors.filter(
      (person) =>
        !term ||
        person.name.toLowerCase().includes(term) ||
        person.email.toLowerCase().includes(term),
    );
  }, [instructors, instructorSearch]);

  const selectInstructor = (person) => {
    setForm((current) => ({
      ...current,
      instructor: person.name,
      instructorId: person.uid,
    }));
    setInstructorPickerOpen(false);
    setInstructorSearch("");
    setError("");
  };

  const filteredWorkshops = useMemo(() => {
    const term = search.trim().toLowerCase();

    return workshops.filter((item) => {
      const title = String(item.title || "").toLowerCase();
      const instructor = String(item.instructor || "").toLowerCase();
      const category = String(item.category || "").toLowerCase();

      return (
        !term ||
        title.includes(term) ||
        instructor.includes(term) ||
        category.includes(term)
      );
    });
  }, [workshops, search]);

  const totalEnrolled = useMemo(
    () =>
      workshops.reduce(
        (sum, item) =>
          sum + (Array.isArray(item.enrolled) ? item.enrolled.length : 0),
        0,
      ),
    [workshops],
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreate = () => {
    setEditingWorkshop(null);
    setForm({ ...EMPTY_FORM });
    setInstructorPickerOpen(false);
    setInstructorSearch("");
    setError("");
    setModalVisible(true);
  };

  const openEdit = (workshop) => {
    setEditingWorkshop(workshop);

    setForm({
      title: workshop.title || "",
      description: workshop.description || "",
      objective: workshop.objective || "",
      instructor: workshop.instructor || "",
      instructorId: workshop.instructorId || "",
      date: workshop.date || "",
      schedule: workshop.schedule || "",
      location: workshop.location || "Modalidad virtual",
      capacity: String(workshop.capacity ?? 20),
      price: String(workshop.price ?? 0),
      category: workshop.category || "Creatividad",
      duration: workshop.duration || "2 horas",
      imageUrl: workshop.imageUrl || "",
    });

    setInstructorPickerOpen(false);
    setInstructorSearch("");
    setError("");
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);
    setEditingWorkshop(null);
    setForm({ ...EMPTY_FORM });
    setInstructorPickerOpen(false);
    setInstructorSearch("");
    setError("");
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const description = form.description.trim();
    const instructorId = form.instructorId.trim();
    const capacity = Number(form.capacity);
    const price = Number(form.price);

    if (!title || !description) {
      setError("El título y la descripción son obligatorios.");
      return;
    }

    if (!instructorId || !form.instructor.trim()) {
      setError(
        "Selecciona un instructor registrado en la lista para asignarlo al taller.",
      );
      return;
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      setError("La capacidad debe ser un número entero mayor que cero.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Ingresa un precio válido, igual o mayor que cero.");
      return;
    }

    const data = {
      title,
      description,
      objective: form.objective.trim(),
      instructor: form.instructor.trim() || "Instructor MindHub",
      instructorId,
      date: form.date.trim(),
      schedule: form.schedule.trim(),
      location: form.location.trim() || "Modalidad virtual",
      capacity,
      price,
      category: form.category,
      duration: form.duration.trim() || "2 horas",
      imageUrl: form.imageUrl.trim(),
    };

    setSaving(true);
    setError("");

    try {
      if (editingWorkshop?.id) {
        await updateWorkshop(editingWorkshop.id, data, {
          uid: user?.uid,
          role,
        });

        Alert.alert(
          "Taller actualizado",
          "Los cambios se guardaron correctamente.",
        );
      } else {
        await createWorkshop(data);

        Alert.alert(
          "Taller creado",
          "El taller ya está disponible en MindHub.",
        );
      }

      setModalVisible(false);
      setEditingWorkshop(null);
      setForm({ ...EMPTY_FORM });
      setInstructorPickerOpen(false);
      setInstructorSearch("");

      await loadWorkshops(true);
    } catch (err) {
      console.error("Error guardando taller:", err);
      setError(err.message || "No fue posible guardar el taller.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (workshop) => {
    const enrolledCount = Array.isArray(workshop.enrolled)
      ? workshop.enrolled.length
      : 0;

    Alert.alert(
      "Eliminar taller",
      enrolledCount > 0
        ? `Este taller tiene ${enrolledCount} inscrito(s). Debes gestionar primero las inscripciones.`
        : `¿Deseas eliminar "${workshop.title}"? Esta acción no se puede deshacer.`,
      enrolledCount > 0
        ? [{ text: "Entendido", style: "cancel" }]
        : [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Eliminar",
              style: "destructive",
              onPress: async () => {
                try {
                  await deleteWorkshop(workshop.id, {
                    uid: user?.uid,
                    role,
                  });

                  setWorkshops((current) =>
                    current.filter(
                      (item) => String(item.id) !== String(workshop.id),
                    ),
                  );

                  Alert.alert(
                    "Taller eliminado",
                    "El taller se eliminó correctamente.",
                  );
                } catch (err) {
                  Alert.alert(
                    "No se pudo eliminar",
                    err.message || "Intenta nuevamente.",
                  );
                }
              },
            },
          ],
    );
  };

  const renderWorkshop = ({ item }) => {
    const enrolled = Array.isArray(item.enrolled) ? item.enrolled.length : 0;
    const capacity = Math.max(0, Number(item.capacity) || 0);
    const full = capacity > 0 && enrolled >= capacity;
    const percentage =
      capacity > 0 ? Math.min(100, (enrolled / capacity) * 100) : 0;

    return (
      <View style={styles.workshopCard}>
        <View style={styles.cardAccent} />

        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <View style={styles.workshopIcon}>
              <Ionicons
                name="color-palette-outline"
                size={24}
                color={C.primary}
              />
            </View>

            <View style={styles.cardHeading}>
              <Text style={styles.workshopTitle}>
                {item.title || "Taller sin título"}
              </Text>
              <Text style={styles.instructorText}>
                {item.instructor || "Instructor no asignado"}
              </Text>
            </View>

            <View style={[styles.statusBadge, full && styles.fullBadge]}>
              <View style={[styles.statusDot, full && styles.fullDot]} />
              <Text style={[styles.statusText, full && styles.fullText]}>
                {full ? "Completo" : "Disponible"}
              </Text>
            </View>
          </View>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {item.category || "Creatividad"}
            </Text>
          </View>

          <Text style={styles.description} numberOfLines={3}>
            {item.description || "Sin descripción."}
          </Text>

          <View style={styles.detailsGrid}>
            <Detail
              icon="calendar-outline"
              text={item.date || "Fecha por definir"}
            />
            <Detail
              icon="time-outline"
              text={item.schedule || "Horario por definir"}
            />
            <Detail
              icon="location-outline"
              text={item.location || "Modalidad virtual"}
            />
            <Detail
              icon="hourglass-outline"
              text={item.duration || "Duración por definir"}
            />
          </View>

          <View style={styles.capacityBlock}>
            <View style={styles.capacityLabels}>
              <Text style={styles.capacityTitle}>Cupos ocupados</Text>
              <Text style={styles.capacityCount}>
                {enrolled} de {capacity}
              </Text>
            </View>
            <View style={styles.capacityTrack}>
              <View
                style={[
                  styles.capacityFill,
                  full && styles.capacityFillFull,
                  { width: `${percentage}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceCaption}>Precio por persona</Text>
              <Text style={styles.priceText}>
                {Number(item.price) === 0
                  ? "Gratis"
                  : `$${Number(item.price || 0).toLocaleString("es-CO")}`}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.enrollButton}
                onPress={() =>
                  router.push({
                    pathname: "/admin/enrollments",
                    params: {
                      workshopId: String(item.id),
                      workshopTitle: item.title || "",
                    },
                  })
                }
              >
                <Ionicons name="people-outline" size={17} color={C.green} />
                <Text style={styles.enrollButtonText}>Inscritos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEdit(item)}
                accessibilityLabel="Editar taller"
              >
                <Ionicons name="create-outline" size={18} color={C.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmDelete(item)}
                accessibilityLabel="Eliminar taller"
              >
                <Ionicons name="trash-outline" size={18} color={C.red} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderField = (label, field, options = {}) => (
    <View style={styles.field} key={field}>
      <Text style={styles.fieldLabel}>
        {label}
        {options.required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <View style={styles.inputShell}>
        {options.icon ? (
          <Ionicons
            name={options.icon}
            size={17}
            color={C.muted}
            style={styles.inputLeadingIcon}
          />
        ) : null}

        <TextInput
          value={form[field]}
          onChangeText={(value) => updateField(field, value)}
          placeholder={options.placeholder || label}
          placeholderTextColor="#A0A3B4"
          style={[
            styles.input,
            options.icon && styles.inputWithIcon,
            options.multiline && styles.multilineInput,
          ]}
          multiline={Boolean(options.multiline)}
          keyboardType={options.keyboardType || "default"}
          autoCapitalize={options.autoCapitalize || "sentences"}
          autoCorrect={options.autoCapitalize === "none" ? false : undefined}
          textAlignVertical={options.multiline ? "top" : "center"}
        />
      </View>

      {options.helper ? (
        <Text style={styles.helper}>{options.helper}</Text>
      ) : null}
    </View>
  );

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Verificando permisos...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <View style={styles.deniedIcon}>
          <Ionicons name="lock-closed-outline" size={34} color={C.red} />
        </View>

        <Text style={styles.deniedTitle}>Acceso restringido</Text>
        <Text style={styles.emptyDescription}>
          Esta sección está disponible únicamente para administradores.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/tabs/home")}
        >
          <Text style={styles.primaryButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <View style={styles.topHeader}>
        <AdminHeader active="workshops" />
      </View>

      <View style={styles.workshopsContent}>
        <View style={styles.pageHero}>
          <View style={styles.pageHeroText}>
            <View style={styles.eyebrow}>
              <Ionicons name="sparkles-outline" size={13} color="#FFFFFF" />
              <Text style={styles.eyebrowText}>ADMINISTRACIÓN</Text>
            </View>
            <Text style={styles.pageTitle}>Gestión de talleres</Text>
            <Text style={styles.pageSubtitle}>
              Organiza experiencias, fechas y participantes.
            </Text>
          </View>

          <View style={styles.heroIcon}>
            <Ionicons name="color-palette-outline" size={31} color="#FFFFFF" />
          </View>
          <View style={styles.heroCircle} />
        </View>

        <View style={styles.topBar}>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelTitle}>Tus actividades</Text>
            <Text style={styles.sectionLabelSubtitle}>
              Administra los talleres de MindHub
            </Text>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={openCreate}>
            <Ionicons name="add" size={21} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Nuevo taller</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre, instructor o categoría..."
            placeholderTextColor="#A0A3B4"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={19} color={C.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard
            icon="color-palette-outline"
            label="Talleres creados"
            value={workshops.length}
            tint="#EEEAFE"
            iconColor={C.primary}
          />
          <SummaryCard
            icon="people-outline"
            label="Inscripciones"
            value={totalEnrolled}
            tint="#E5F7F0"
            iconColor={C.green}
          />
        </View>

        {error && !modalVisible ? (
          <TouchableOpacity
            style={styles.errorBox}
            onPress={() => loadWorkshops(true)}
          >
            <Ionicons name="alert-circle-outline" size={20} color={C.red} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.centerList}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Cargando talleres...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredWorkshops}
            keyExtractor={(item, index) =>
              String(item.id || item.workshopId || index)
            }
            renderItem={renderWorkshop}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadWorkshops(true)}
                tintColor={C.primary}
                colors={[C.primary]}
              />
            }
            ListHeaderComponent={
              filteredWorkshops.length > 0 ? (
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>Talleres registrados</Text>
                  <Text style={styles.resultsCount}>
                    {filteredWorkshops.length}{" "}
                    {filteredWorkshops.length === 1
                      ? "resultado"
                      : "resultados"}
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIllustration}>
                  <Ionicons
                    name="color-palette-outline"
                    size={37}
                    color={C.primary}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {search
                    ? "No encontramos coincidencias"
                    : "Aún no hay talleres"}
                </Text>
                <Text style={styles.emptyDescription}>
                  {search
                    ? "Prueba con otro nombre, instructor o categoría."
                    : "Crea tu primer taller y empieza a organizar actividades."}
                </Text>
                {!search ? (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={openCreate}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      Crear primer taller
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            }
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalScreen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={closeModal}
              disabled={saving}
              accessibilityLabel="Cerrar formulario"
            >
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>

            <View style={styles.modalHeading}>
              <Text style={styles.modalEyebrow}>
                {editingWorkshop ? "EDICIÓN DE ACTIVIDAD" : "NUEVA ACTIVIDAD"}
              </Text>
              <Text style={styles.modalTitle}>
                {editingWorkshop ? "Editar taller" : "Crear taller"}
              </Text>
              <Text style={styles.modalSubtitle}>
                Completa la información de tu actividad.
              </Text>
            </View>

            <View style={styles.modalHeaderIcon}>
              <Ionicons
                name="color-palette-outline"
                size={23}
                color={C.primary}
              />
            </View>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
          >
            <View style={styles.formHero}>
              <View style={styles.formHeroIcon}>
                <Ionicons name="sparkles" size={23} color="#FFFFFF" />
              </View>
              <View style={styles.formHeroText}>
                <Text style={styles.formHeroTitle}>
                  {editingWorkshop
                    ? "Actualiza tu taller"
                    : "Diseña una experiencia"}
                </Text>
                <Text style={styles.formHeroSubtitle}>
                  Los campos con asterisco son obligatorios.
                </Text>
              </View>
            </View>

            <FormSection
              number="01"
              title="Información básica"
              subtitle="Presenta tu taller a la comunidad."
              icon="document-text-outline"
            >
              {renderField("Título del taller", "title", {
                required: true,
                icon: "text-outline",
                placeholder: "Ej. Crea tu primera figura en origami",
              })}

              {renderField("Descripción", "description", {
                required: true,
                icon: "reader-outline",
                multiline: true,
                placeholder: "Explica en qué consiste la actividad...",
              })}

              {renderField("Objetivo de aprendizaje", "objective", {
                icon: "bulb-outline",
                multiline: true,
                placeholder: "¿Qué lograrán los participantes?",
              })}
            </FormSection>

            <FormSection
              number="02"
              title="Responsable"
              subtitle="Asigna el instructor encargado."
              icon="person-outline"
            >
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  Instructor asignado<Text style={styles.required}> *</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.instructorSelector,
                    instructorPickerOpen && styles.instructorSelectorActive,
                  ]}
                  onPress={() => setInstructorPickerOpen((current) => !current)}
                  activeOpacity={0.8}
                >
                  <View style={styles.instructorSelectorIcon}>
                    <Ionicons
                      name="person-circle-outline"
                      size={23}
                      color={C.primary}
                    />
                  </View>
                  <View style={styles.instructorSelectorText}>
                    <Text
                      style={[
                        styles.instructorSelectorName,
                        !form.instructor && styles.instructorPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {form.instructor || "Selecciona un instructor registrado"}
                    </Text>
                    <Text style={styles.instructorSelectorHint}>
                      {form.instructorId
                        ? "Instructor seleccionado"
                        : "Elige entre los instructores de MindHub"}
                    </Text>
                  </View>
                  <Ionicons
                    name={instructorPickerOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={C.muted}
                  />
                </TouchableOpacity>

                {instructorPickerOpen ? (
                  <View style={styles.instructorDropdown}>
                    <View style={styles.instructorSearchBox}>
                      <Ionicons
                        name="search-outline"
                        size={18}
                        color={C.muted}
                      />
                      <TextInput
                        value={instructorSearch}
                        onChangeText={setInstructorSearch}
                        placeholder="Buscar instructor por nombre o correo..."
                        placeholderTextColor="#A0A3B4"
                        style={styles.instructorSearchInput}
                        autoCapitalize="none"
                      />
                    </View>
                    {loadingInstructors ? (
                      <View style={styles.instructorLoading}>
                        <ActivityIndicator color={C.primary} />
                        <Text style={styles.helper}>
                          Cargando instructores registrados...
                        </Text>
                      </View>
                    ) : filteredInstructors.length > 0 ? (
                      <View style={styles.instructorOptions}>
                        {filteredInstructors.map((person) => {
                          const selected = form.instructorId === person.uid;
                          return (
                            <TouchableOpacity
                              key={person.uid}
                              style={[
                                styles.instructorOption,
                                selected && styles.instructorOptionSelected,
                              ]}
                              onPress={() => selectInstructor(person)}
                              activeOpacity={0.75}
                            >
                              <View
                                style={[
                                  styles.instructorAvatar,
                                  selected && styles.instructorAvatarSelected,
                                ]}
                              >
                                <Ionicons
                                  name="person-outline"
                                  size={18}
                                  color={selected ? "#FFFFFF" : C.primary}
                                />
                              </View>
                              <View style={styles.instructorOptionText}>
                                <Text style={styles.instructorOptionName}>
                                  {person.name}
                                </Text>
                                <Text
                                  style={styles.instructorOptionEmail}
                                  numberOfLines={1}
                                >
                                  {person.email || "Correo no registrado"}
                                </Text>
                              </View>
                              {selected ? (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={21}
                                  color={C.primary}
                                />
                              ) : (
                                <Ionicons
                                  name="ellipse-outline"
                                  size={20}
                                  color="#C6C8D6"
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.instructorEmpty}>
                        <Ionicons
                          name="people-outline"
                          size={24}
                          color={C.muted}
                        />
                        <Text style={styles.instructorEmptyText}>
                          {instructors.length
                            ? "No hay coincidencias con la búsqueda."
                            : "No hay usuarios con rol instructor registrados en Firebase."}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.refreshInstructorsButton}
                      onPress={loadInstructors}
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={16}
                        color={C.primary}
                      />
                      <Text style={styles.refreshInstructorsText}>
                        Actualizar lista
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                <Text style={styles.helper}>
                  El nombre y el UID se guardan automáticamente al seleccionar
                  un instructor.
                </Text>
              </View>
            </FormSection>

            <FormSection
              number="03"
              title="Fecha y modalidad"
              subtitle="Indica cuándo y dónde se realizará."
              icon="calendar-outline"
            >
              <View style={styles.twoFields}>
                <View style={styles.halfField}>
                  {renderField("Fecha", "date", {
                    icon: "calendar-outline",
                    placeholder: "DD/MM/AAAA",
                  })}
                </View>
                <View style={styles.halfField}>
                  {renderField("Horario", "schedule", {
                    icon: "time-outline",
                    placeholder: "2:00 p. m.",
                  })}
                </View>
              </View>

              {renderField("Lugar o modalidad", "location", {
                icon: "location-outline",
                placeholder: "Ej. Modalidad virtual",
              })}

              {renderField("Duración", "duration", {
                icon: "hourglass-outline",
                placeholder: "Ej. 2 horas",
              })}
            </FormSection>

            <FormSection
              number="04"
              title="Cupos y precio"
              subtitle="Define la capacidad y el valor por participante."
              icon="wallet-outline"
            >
              <View style={styles.twoFields}>
                <View style={styles.halfField}>
                  {renderField("Capacidad máxima", "capacity", {
                    required: true,
                    icon: "people-outline",
                    keyboardType: "numeric",
                    placeholder: "20",
                  })}
                </View>
                <View style={styles.halfField}>
                  {renderField("Precio en COP", "price", {
                    required: true,
                    icon: "cash-outline",
                    keyboardType: "decimal-pad",
                    placeholder: "0",
                  })}
                </View>
              </View>

              <View style={styles.freeHint}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={C.primary}
                />
                <Text style={styles.freeHintText}>
                  Usa 0 para indicar que el taller es gratuito.
                </Text>
              </View>
            </FormSection>

            <FormSection
              number="05"
              title="Presentación del taller"
              subtitle="Personaliza la categoría y la imagen."
              icon="images-outline"
            >
              {renderField("URL de imagen (opcional)", "imageUrl", {
                icon: "image-outline",
                autoCapitalize: "none",
                placeholder: "https://sitio.com/imagen.jpg",
              })}

              <Text style={styles.fieldLabel}>Categoría del taller</Text>
              <View style={styles.choiceRow}>
                {categories.map((category) => {
                  const selected = form.category === category;
                  const icons = {
                    Creatividad: "bulb-outline",
                    Arte: "color-palette-outline",
                    Diseño: "brush-outline",
                    Manualidades: "cut-outline",
                    Tecnología: "hardware-chip-outline",
                  };

                  return (
                    <TouchableOpacity
                      key={category}
                      onPress={() => updateField("category", category)}
                      style={[styles.choice, selected && styles.choiceSelected]}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={icons[category]}
                        size={16}
                        color={selected ? "#FFFFFF" : C.muted}
                      />
                      <Text
                        style={[
                          styles.choiceText,
                          selected && styles.choiceTextSelected,
                        ]}
                      >
                        {category}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </FormSection>

            {error ? (
              <View style={styles.formError}>
                <Ionicons name="alert-circle-outline" size={21} color={C.red} />
                <Text style={styles.formErrorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={
                      editingWorkshop
                        ? "save-outline"
                        : "checkmark-circle-outline"
                    }
                    size={21}
                    color="#FFFFFF"
                  />
                  <Text style={styles.saveButtonText}>
                    {editingWorkshop ? "Guardar cambios" : "Crear taller"}
                  </Text>
                  <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeModal}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancelar y volver</Text>
            </TouchableOpacity>

            <Text style={styles.formFooter}>
              MINDHUB · APRENDE, CREA Y COMPARTE
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Detail({ icon, text }) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={15} color={C.primary} />
      </View>
      <Text style={styles.detailText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

function SummaryCard({ icon, label, value, tint, iconColor }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={21} color={iconColor} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function FormSection({ number, title, subtitle, icon, children }) {
  return (
    <View style={styles.formSection}>
      <View style={styles.formSectionHeader}>
        <View style={styles.formSectionIcon}>
          <Ionicons name={icon} size={21} color={C.primary} />
        </View>
        <View style={styles.formSectionHeading}>
          <View style={styles.formSectionTitleRow}>
            <Text style={styles.formSectionTitle}>{title}</Text>
            <Text style={styles.formSectionNumber}>{number}</Text>
          </View>
          <Text style={styles.formSectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  instructorSelector: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  instructorSelectorActive: {
    borderColor: C.primary,
    backgroundColor: "#FCFBFF",
  },
  instructorSelectorIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
  },
  instructorSelectorText: { flex: 1, minWidth: 0 },
  instructorSelectorName: { color: C.text, fontSize: 13, fontWeight: "800" },
  instructorPlaceholder: { color: C.muted, fontWeight: "600" },
  instructorSelectorHint: { color: C.muted, fontSize: 10, marginTop: 4 },
  instructorDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    padding: 10,
  },
  instructorSearchBox: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
    paddingHorizontal: 10,
    backgroundColor: C.background,
  },
  instructorSearchInput: {
    flex: 1,
    color: C.text,
    fontSize: 12,
    paddingVertical: 8,
  },
  instructorLoading: {
    minHeight: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  instructorOptions: { marginTop: 6 },
  instructorOption: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 7,
    borderRadius: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  instructorOptionSelected: { backgroundColor: "#F1EEFF" },
  instructorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
  },
  instructorAvatarSelected: { backgroundColor: C.primary },
  instructorOptionText: { flex: 1, minWidth: 0 },
  instructorOptionName: { color: C.text, fontSize: 12, fontWeight: "800" },
  instructorOptionEmail: { color: C.muted, fontSize: 10, marginTop: 3 },
  instructorEmpty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 7,
  },
  instructorEmptyText: {
    color: C.muted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  refreshInstructorsButton: {
    marginTop: 6,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  refreshInstructorsText: { color: C.primary, fontSize: 11, fontWeight: "800" },
  screen: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    alignSelf: "stretch",
    backgroundColor: C.background,
  },
  topHeader: {
    width: "100%",
    flexShrink: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 100,
    elevation: 8,
  },
  workshopsContent: {
    flex: 1,
    minHeight: 0,
  },
  pageHero: {
    marginHorizontal: 18,
    marginTop: 17,
    marginBottom: 18,
    padding: 20,
    minHeight: 145,
    borderRadius: 22,
    backgroundColor: C.primary,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  pageHeroText: {
    flex: 1,
    zIndex: 1,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)",
    marginBottom: 12,
  },
  eyebrowText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  pageTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  pageSubtitle: {
    color: "#E8E4FF",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
    maxWidth: 270,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    zIndex: 1,
  },
  heroCircle: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -55,
    top: -85,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  topBar: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionLabel: {
    flex: 1,
    minWidth: 0,
  },
  sectionLabelTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "900",
  },
  sectionLabelSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: C.primary,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 13,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 11,
  },
  searchBox: {
    marginHorizontal: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 13,
    height: 49,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 12,
    paddingVertical: 8,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  summaryValue: {
    color: C.text,
    fontSize: 23,
    fontWeight: "900",
  },
  summaryLabel: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 11,
  },
  resultsTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: "900",
  },
  resultsCount: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 35,
    flexGrow: 1,
  },
  workshopCard: {
    backgroundColor: C.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    marginBottom: 13,
  },
  cardAccent: {
    height: 4,
    backgroundColor: C.primary,
  },
  cardInner: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  workshopIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeading: {
    flex: 1,
    minWidth: 0,
  },
  workshopTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
  },
  instructorText: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E5F7F0",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  statusText: {
    color: C.green,
    fontWeight: "800",
    fontSize: 9,
  },
  fullBadge: {
    backgroundColor: "#FFF0F2",
  },
  fullDot: {
    backgroundColor: C.red,
  },
  fullText: {
    color: C.red,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F1EFFF",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    marginTop: 12,
  },
  categoryBadgeText: {
    color: C.primary,
    fontSize: 9,
    fontWeight: "800",
  },
  description: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 12,
  },
  detailsGrid: {
    gap: 8,
    marginTop: 14,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailIcon: {
    width: 27,
    height: 27,
    borderRadius: 8,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: {
    color: C.muted,
    fontSize: 10,
    flex: 1,
    lineHeight: 15,
  },
  capacityBlock: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#F8F8FC",
    borderRadius: 12,
  },
  capacityLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  capacityTitle: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  capacityCount: {
    color: C.text,
    fontSize: 10,
    fontWeight: "900",
  },
  capacityTrack: {
    height: 6,
    backgroundColor: "#E6E5F0",
    borderRadius: 5,
    overflow: "hidden",
  },
  capacityFill: {
    height: "100%",
    backgroundColor: C.green,
    borderRadius: 5,
  },
  capacityFillFull: {
    backgroundColor: C.red,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 14,
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  priceContainer: {
    flex: 1,
    minWidth: 0,
  },
  priceCaption: {
    color: C.muted,
    fontSize: 9,
    marginBottom: 4,
  },
  priceText: {
    color: C.text,
    fontWeight: "900",
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  enrollButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E5F7F0",
    paddingVertical: 9,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  enrollButtonText: {
    color: C.green,
    fontSize: 10,
    fontWeight: "800",
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#FFF0F2",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
    backgroundColor: C.background,
  },
  centerList: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  loadingText: {
    color: C.muted,
    marginTop: 10,
    fontSize: 12,
  },
  deniedIcon: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: "#FFF0F2",
    alignItems: "center",
    justifyContent: "center",
  },
  deniedTitle: {
    color: C.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 14,
  },
  emptyState: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    minHeight: 280,
  },
  emptyIllustration: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2,
    textAlign: "center",
  },
  emptyDescription: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 290,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: C.primary,
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 17,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 11,
  },
  errorBox: {
    marginHorizontal: 18,
    marginTop: 10,
    backgroundColor: "#FFF0F2",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: C.red,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  retryText: {
    color: C.red,
    fontWeight: "900",
    fontSize: 10,
  },
  modalScreen: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    alignSelf: "stretch",
    backgroundColor: C.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalClose: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F0F1F7",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeading: {
    flex: 1,
    minWidth: 0,
  },
  modalEyebrow: {
    color: C.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  modalTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 3,
  },
  modalSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: 3,
  },
  modalHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
  },
  formContent: {
    paddingHorizontal: 17,
    paddingTop: 17,
    paddingBottom: 40,
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    alignSelf: "stretch",
    flexGrow: 1,
  },
  formHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.primary,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  formHeroIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  formHeroText: {
    flex: 1,
  },
  formHeroTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  formHeroSubtitle: {
    color: "#E7E3FF",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  formSection: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 15,
    marginBottom: 13,
  },
  formSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 18,
  },
  formSectionIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
  },
  formSectionHeading: {
    flex: 1,
  },
  formSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  formSectionTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "900",
  },
  formSectionNumber: {
    color: C.primary,
    backgroundColor: C.light,
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formSectionSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 15,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: C.text,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 7,
  },
  required: {
    color: C.red,
  },
  inputShell: {
    position: "relative",
    justifyContent: "center",
  },
  inputLeadingIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  input: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#FCFCFE",
    color: C.text,
    fontSize: 12,
  },
  inputWithIcon: {
    paddingLeft: 39,
  },
  multilineInput: {
    minHeight: 95,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  helper: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  twoFields: {
    flexDirection: "row",
    gap: 10,
  },
  halfField: {
    flex: 1,
    minWidth: 0,
  },
  freeHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 11,
    backgroundColor: "#F0EDFF",
    borderRadius: 11,
    marginTop: -2,
  },
  freeHintText: {
    color: "#6558B8",
    fontSize: 10,
    flex: 1,
    lineHeight: 15,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 11,
    backgroundColor: "#FFFFFF",
  },
  choiceSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  choiceText: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  choiceTextSelected: {
    color: "#FFFFFF",
  },
  formError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#FFF0F2",
    padding: 13,
    borderRadius: 12,
    marginBottom: 13,
  },
  formErrorText: {
    color: C.red,
    fontSize: 11,
    flex: 1,
    lineHeight: 17,
  },
  saveButton: {
    minHeight: 53,
    backgroundColor: C.primary,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    flex: 1,
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.65,
  },
  cancelButton: {
    alignItems: "center",
    padding: 15,
  },
  cancelButtonText: {
    color: C.muted,
    fontWeight: "800",
    fontSize: 11,
  },
  formFooter: {
    textAlign: "center",
    color: "#A2A4B5",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 5,
  },
});
