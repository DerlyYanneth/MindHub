import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  useWindowDimensions,
} from "react-native";

import AdminHeader from "../../components/AdminHea";
import {
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse,
} from "../../services/courseService";
import { getAllUsers } from "../../services/userService";

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
  red: "#D94D67",
};

const EMPTY_MODULE = {
  title: "",
  duration: "",
  videoUrl: "",
  videoId: "",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  objective: "",
  instructor: "",
  instructorId: "",
  price: "0",
  imageUrl: "",
  videoId: "",
  videoUrl: "",
  category: "Creatividad",
  level: "Principiante",
  duration: "",
  modality: "Virtual",
  rating: "0",
  students: "0",
  modules: [],
};

const categories = [
  "Creatividad",
  "Arte",
  "Diseño",
  "Manualidades",
  "Tecnología",
  "Programación",
];

const levels = ["Principiante", "Intermedio", "Avanzado"];
const modalities = ["Virtual", "Presencial", "Híbrida"];

const categoryIcons = {
  Creatividad: "bulb-outline",
  Arte: "color-palette-outline",
  Diseño: "brush-outline",
  Manualidades: "cut-outline",
  Tecnología: "hardware-chip-outline",
  Programación: "code-slash-outline",
};

const getYouTubeId = (value = "") => {
  const text = String(value).trim();

  if (!text) return "";

  if (/^[\w-]{11}$/.test(text)) return text;

  const match = text.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );

  return match?.[1] || "";
};

const normalizeModules = (modules) => {
  if (!Array.isArray(modules)) return [];

  return modules.map((module) => {
    if (typeof module === "string") {
      return {
        title: module,
        duration: "",
        videoUrl: "",
        videoId: "",
      };
    }

    return {
      title: String(module?.title || ""),
      duration: String(module?.duration || ""),
      videoUrl: String(module?.videoUrl || ""),
      videoId: String(module?.videoId || ""),
    };
  });
};

const normalizeInstructor = (person) => {
  const uid = String(person.uid || person.id || person.userId || "").trim();

  const name = String(
    person.name ||
      person.displayName ||
      person.fullName ||
      person.nombre ||
      person.email ||
      "Instructor sin nombre",
  ).trim();

  return {
    ...person,
    uid,
    name,
    email: String(person.email || ""),
  };
};

export default function ManageContentScreen() {
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isWide = width >= 1024;
  const horizontalPadding = isSmallScreen ? 16 : isTablet ? 24 : 32;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, modules: [] });
  const [error, setError] = useState("");

  const [instructors, setInstructors] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [instructorPickerOpen, setInstructorPickerOpen] = useState(false);
  const [instructorSearch, setInstructorSearch] = useState("");

  // Cargar los cursos registrados en Firestore.
  const loadCourses = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando cursos:", err);
      setError(
        "No se pudieron cargar los cursos. Comprueba la conexión e inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Cargar y filtrar los instructores registrados en Firestore.
  const loadInstructors = useCallback(async () => {
    setLoadingInstructors(true);

    try {
      const users = await getAllUsers();

      const registeredInstructors = (Array.isArray(users) ? users : [])
        .filter((person) => {
          const normalizedRole = String(person.role || person.rol || "")
            .trim()
            .toLowerCase();

          const roleStatus = String(
            person.roleStatus || person.estado || person.status || "",
          )
            .trim()
            .toLowerCase();

          const isInstructor = [
            "instructor",
            "instructora",
            "instructor/a",
          ].includes(normalizedRole);

          const isApproved = ["approved", "aprobado", "aprobada"].includes(
            roleStatus,
          );

          return isInstructor && isApproved;
        })
        .map((person) =>
          normalizeInstructor({
            ...person,
            uid: person.uid || person.id || person.userId,
          }),
        )
        .filter((person) => person.uid);

      setInstructors(registeredInstructors);
    } catch (err) {
      console.error("Error cargando instructores:", err);
      setInstructors([]);

      setError(
        "No fue posible cargar los instructores registrados. Inténtalo nuevamente.",
      );
    } finally {
      setLoadingInstructors(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (modalVisible) {
      loadInstructors();
    }
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

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return courses.filter((course) => {
      const title = String(course.title || "").toLowerCase();
      const instructor = String(course.instructor || "").toLowerCase();
      const description = String(course.description || "").toLowerCase();

      const matchesSearch =
        !term ||
        title.includes(term) ||
        instructor.includes(term) ||
        description.includes(term);

      const matchesCategory =
        selectedCategory === "Todas" || course.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [courses, search, selectedCategory]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateModule = (index, field, value) => {
    setForm((current) => ({
      ...current,
      modules: current.modules.map((module, moduleIndex) =>
        moduleIndex === index ? { ...module, [field]: value } : module,
      ),
    }));
  };

  const addModule = () => {
    setForm((current) => ({
      ...current,
      modules: [...current.modules, { ...EMPTY_MODULE }],
    }));
  };

  const removeModule = (index) => {
    setForm((current) => ({
      ...current,
      modules: current.modules.filter(
        (_, moduleIndex) => moduleIndex !== index,
      ),
    }));
  };

  const openCreate = () => {
    setEditingCourse(null);
    setForm({ ...EMPTY_FORM, modules: [] });
    setInstructorPickerOpen(false);
    setInstructorSearch("");
    setError("");
    setModalVisible(true);
  };

  const openEdit = (course) => {
    setEditingCourse(course);

    setForm({
      ...EMPTY_FORM,
      ...course,
      title: String(course.title || ""),
      description: String(course.description || ""),
      objective: String(course.objective || ""),
      instructor: String(course.instructor || ""),
      instructorId: String(course.instructorId || ""),
      price: String(course.price ?? 0),
      imageUrl: String(course.imageUrl || ""),
      videoId: String(course.videoId || ""),
      videoUrl: String(course.videoUrl || ""),
      category: course.category || "Creatividad",
      level: course.level || "Principiante",
      duration: String(course.duration || ""),
      modality: course.modality || "Virtual",
      rating: String(course.rating ?? 0),
      students: String(course.students ?? 0),
      modules: normalizeModules(course.modules),
    });

    setInstructorPickerOpen(false);
    setInstructorSearch("");
    setError("");
    setModalVisible(true);
  };

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

  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);
    setEditingCourse(null);
    setForm({ ...EMPTY_FORM, modules: [] });
    setInstructorPickerOpen(false);
    setInstructorSearch("");
    setError("");
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const description = form.description.trim();
    const price = Number(form.price);
    const rating = Number(form.rating);
    const students = Number(form.students);

    if (!title || !description) {
      setError("El título y la descripción son obligatorios.");
      return;
    }

    if (!form.instructorId.trim() || !form.instructor.trim()) {
      setError(
        "Selecciona un instructor registrado en la lista para asignarlo al curso.",
      );
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Ingresa un precio válido, igual o mayor que cero.");
      return;
    }

    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      setError("La calificación debe estar entre 0 y 5.");
      return;
    }

    if (!Number.isFinite(students) || students < 0) {
      setError(
        "La cantidad de estudiantes debe ser un número válido igual o mayor que cero.",
      );
      return;
    }

    const typedVideoId = form.videoId.trim();
    const videoUrl = form.videoUrl.trim();
    const videoId = getYouTubeId(typedVideoId) || getYouTubeId(videoUrl);

    if (typedVideoId && !getYouTubeId(typedVideoId)) {
      setError(
        "El ID o enlace del video general no es válido. Pega un ID de YouTube o un enlace completo.",
      );
      return;
    }

    if (videoUrl && !getYouTubeId(videoUrl)) {
      setError(
        "La URL del video general no parece ser un enlace válido de YouTube.",
      );
      return;
    }

    const normalizedModules = [];

    for (let index = 0; index < form.modules.length; index += 1) {
      const module = form.modules[index];
      const moduleTitle = String(module.title || "").trim();
      const duration = String(module.duration || "").trim();
      const moduleVideoUrl = String(module.videoUrl || "").trim();
      const typedModuleVideoId = String(module.videoId || "").trim();

      if (!moduleTitle && !duration && !moduleVideoUrl && !typedModuleVideoId) {
        setError(`El módulo ${index + 1} está vacío. Complétalo o elimínalo.`);
        return;
      }

      if (!moduleTitle) {
        setError(`Escribe el título del módulo ${index + 1}.`);
        return;
      }

      if (moduleVideoUrl && !getYouTubeId(moduleVideoUrl)) {
        setError(`La URL de YouTube del módulo ${index + 1} no es válida.`);
        return;
      }

      if (typedModuleVideoId && !getYouTubeId(typedModuleVideoId)) {
        setError(
          `El ID o enlace de YouTube del módulo ${index + 1} no es válido.`,
        );
        return;
      }

      const moduleVideoId =
        getYouTubeId(typedModuleVideoId) || getYouTubeId(moduleVideoUrl);

      normalizedModules.push({
        title: moduleTitle,
        duration: duration || "Por definir",
        videoUrl: moduleVideoUrl,
        videoId: moduleVideoId,
      });
    }

    const data = {
      title,
      description,
      objective: form.objective.trim(),
      instructor: form.instructor.trim(),
      instructorId: form.instructorId.trim(),
      price,
      imageUrl: form.imageUrl.trim(),
      videoId,
      videoUrl,
      category: form.category,
      level: form.level,
      duration: form.duration.trim() || "Por definir",
      modality: form.modality,
      rating,
      students,
      modules: normalizedModules,
    };

    setSaving(true);
    setError("");

    try {
      if (editingCourse?.id) {
        await updateCourse(editingCourse.id, data);

        Alert.alert(
          "Curso actualizado",
          "Los cambios se guardaron correctamente.",
        );
      } else {
        await createCourse(data);

        Alert.alert(
          "Curso creado",
          "El curso se agregó correctamente a MindHub.",
        );
      }

      setModalVisible(false);
      setEditingCourse(null);
      setForm({ ...EMPTY_FORM, modules: [] });
      setInstructorPickerOpen(false);
      setInstructorSearch("");

      await loadCourses(true);
    } catch (err) {
      console.error("Error guardando curso:", err);
      setError(err.message || "No fue posible guardar el curso.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (course) => {
    const performDelete = async () => {
      try {
        await deleteCourse(course.id);

        setCourses((current) =>
          current.filter((item) => String(item.id) !== String(course.id)),
        );

        Alert.alert("Curso eliminado", "El curso se eliminó correctamente.");
      } catch (err) {
        console.error("Error eliminando curso:", err);
        Alert.alert("Error", err.message || "No se pudo eliminar el curso.");
      }
    };

    if (Platform.OS === "web") {
      if (
        typeof window !== "undefined" &&
        window.confirm(
          `¿Deseas eliminar "${course.title}"? Esta acción no se puede deshacer.`,
        )
      ) {
        performDelete();
      }

      return;
    }

    Alert.alert(
      "Eliminar curso",
      `¿Deseas eliminar "${course.title}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: performDelete,
        },
      ],
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
          value={String(form[field] ?? "")}
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

  const renderModuleField = (module, index, label, field, options = {}) => (
    <View style={styles.field} key={`${index}-${field}`}>
      <Text style={styles.fieldLabel}>{label}</Text>

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
          value={String(module[field] ?? "")}
          onChangeText={(value) => updateModule(index, field, value)}
          placeholder={options.placeholder || label}
          placeholderTextColor="#A0A3B4"
          style={[styles.input, options.icon && styles.inputWithIcon]}
          autoCapitalize={options.autoCapitalize || "sentences"}
          autoCorrect={options.autoCapitalize === "none" ? false : undefined}
          keyboardType={options.keyboardType || "default"}
          autoComplete="off"
        />
      </View>

      {options.helper ? (
        <Text style={styles.helper}>{options.helper}</Text>
      ) : null}
    </View>
  );

  const renderChoices = (label, field, options, icons = {}) => (
    <View style={styles.field} key={field}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.choiceRow}>
        {options.map((option) => {
          const selected = form[field] === option;

          return (
            <TouchableOpacity
              key={option}
              onPress={() => updateField(field, option)}
              style={[styles.choice, selected && styles.choiceSelected]}
              activeOpacity={0.8}
            >
              {icons[option] ? (
                <Ionicons
                  name={icons[option]}
                  size={16}
                  color={selected ? "#FFFFFF" : C.muted}
                />
              ) : null}

              <Text
                style={[
                  styles.choiceText,
                  selected && styles.choiceTextSelected,
                ]}
              >
                {option}
              </Text>

              {selected ? (
                <Ionicons name="checkmark" size={15} color="#FFFFFF" />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderInstructorPicker = () => (
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
          <Ionicons name="person-circle-outline" size={24} color={C.primary} />
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
              : "Elige entre los instructores registrados en MindHub"}
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
            <Ionicons name="search-outline" size={18} color={C.muted} />

            <TextInput
              value={instructorSearch}
              onChangeText={setInstructorSearch}
              placeholder="Buscar por nombre o correo..."
              placeholderTextColor="#A0A3B4"
              style={styles.instructorSearchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {instructorSearch ? (
              <TouchableOpacity onPress={() => setInstructorSearch("")}>
                <Ionicons name="close-circle" size={18} color={C.muted} />
              </TouchableOpacity>
            ) : null}
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

                    <Ionicons
                      name={selected ? "checkmark-circle" : "ellipse-outline"}
                      size={21}
                      color={selected ? C.primary : "#C6C8D6"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.instructorEmpty}>
              <Ionicons name="people-outline" size={25} color={C.muted} />

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
            disabled={loadingInstructors}
          >
            <Ionicons name="refresh-outline" size={16} color={C.primary} />
            <Text style={styles.refreshInstructorsText}>Actualizar lista</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.helper}>
        El nombre y el UID de Firebase se guardan automáticamente al seleccionar
        un instructor.
      </Text>
    </View>
  );

  const renderCourse = ({ item }) => (
    <View style={[styles.courseCard, isWide && styles.courseCardWide]}>
      <View style={styles.cardAccent} />

      <View style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <View style={styles.courseIcon}>
            <Ionicons name="book-outline" size={24} color={C.primary} />
          </View>

          <View style={styles.cardHeading}>
            <Text style={styles.courseTitle}>
              {item.title || "Curso sin título"}
            </Text>
            <Text style={styles.instructorText}>
              {item.instructor || "Instructor no asignado"}
            </Text>
          </View>

          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>
              {Number(item.price) === 0
                ? "Gratis"
                : `$${Number(item.price || 0).toLocaleString("es-CO")}`}
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

        <View style={styles.chipRow}>
          {[item.level || "Principiante", item.modality || "Virtual"].map(
            (label, index) => (
              <View style={styles.chip} key={`${label}-${index}`}>
                <Text style={styles.chipText}>{label}</Text>
              </View>
            ),
          )}
        </View>

        <View style={styles.detailsGrid}>
          <Detail
            icon="hourglass-outline"
            text={item.duration || "Duración por definir"}
          />
          <Detail
            icon="people-outline"
            text={`${Number(item.students || 0)} estudiante(s)`}
          />
          <Detail
            icon="star-outline"
            text={`Calificación: ${Number(item.rating || 0).toFixed(1)} / 5`}
          />
          <Detail
            icon="albums-outline"
            text={`${Array.isArray(item.modules) ? item.modules.length : 0} módulo(s)`}
          />
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceCaption}>Precio del curso</Text>
            <Text style={styles.priceText}>
              {Number(item.price) === 0
                ? "Gratis"
                : `$${Number(item.price || 0).toLocaleString("es-CO")}`}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEdit(item)}
              accessibilityLabel={`Editar ${item.title}`}
            >
              <Ionicons name="create-outline" size={18} color={C.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmDelete(item)}
              accessibilityLabel={`Eliminar ${item.title}`}
            >
              <Ionicons name="trash-outline" size={18} color={C.red} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <View style={styles.topHeader}>
        <AdminHeader active="content" />
      </View>

      <View
        style={[
          styles.pageContainer,
          { paddingHorizontal: horizontalPadding },
          isWide && styles.pageContainerWide,
        ]}
      >
        <View style={styles.pageHero}>
          <View style={styles.pageHeroText}>
            <View style={styles.eyebrow}>
              <Ionicons name="sparkles-outline" size={13} color="#FFFFFF" />
              <Text style={styles.eyebrowText}>ADMINISTRACIÓN</Text>
            </View>

            <Text style={styles.pageTitle}>Gestión de cursos</Text>

            <Text style={styles.pageSubtitle}>
              Organiza el contenido educativo y acompaña el aprendizaje de la
              comunidad MindHub.
            </Text>
          </View>

          <View style={styles.heroIcon}>
            <Ionicons name="library-outline" size={31} color="#FFFFFF" />
          </View>

          <View style={styles.heroCircle} />
        </View>

        <View style={styles.topBar}>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelTitle}>Contenido educativo</Text>
            <Text style={styles.sectionLabelSubtitle}>
              Administra los cursos disponibles
            </Text>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={openCreate}>
            <Ionicons name="add" size={21} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Nuevo curso</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={C.muted} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por curso o instructor..."
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

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          style={styles.categoryScroll}
        >
          {["Todas", ...categories].map((category) => {
            const selected = selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryFilter,
                  selected && styles.categoryFilterSelected,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryFilterText,
                    selected && styles.categoryFilterTextSelected,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Cursos registrados</Text>
          <Text style={styles.resultsCount}>
            {filteredCourses.length}{" "}
            {filteredCourses.length === 1 ? "resultado" : "resultados"}
          </Text>
        </View>

        {error && !modalVisible ? (
          <TouchableOpacity
            style={styles.errorBox}
            onPress={() => {
              setError("");
              loadCourses(true);
            }}
          >
            <Ionicons name="alert-circle-outline" size={20} color={C.red} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.centerList}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Cargando cursos...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            renderItem={renderCourse}
            keyExtractor={(item, index) =>
              String(item.id || item.courseId || index)
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadCourses(true)}
                tintColor={C.primary}
                colors={[C.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIllustration}>
                  <Ionicons name="book-outline" size={38} color={C.primary} />
                </View>

                <Text style={styles.emptyTitle}>
                  {search || selectedCategory !== "Todas"
                    ? "No encontramos coincidencias"
                    : "Aún no hay cursos"}
                </Text>

                <Text style={styles.emptyDescription}>
                  {search || selectedCategory !== "Todas"
                    ? "Prueba con otra búsqueda o categoría."
                    : "Crea tu primer curso y empieza a compartir conocimientos."}
                </Text>

                {!search && selectedCategory === "Todas" ? (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={openCreate}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      Crear primer curso
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
                {editingCourse ? "EDICIÓN DE CONTENIDO" : "NUEVO CONTENIDO"}
              </Text>

              <Text style={styles.modalTitle}>
                {editingCourse ? "Editar curso" : "Crear curso"}
              </Text>

              <Text style={styles.modalSubtitle}>
                Completa la información para publicar el curso.
              </Text>
            </View>

            <View style={styles.modalHeaderIcon}>
              <Ionicons name="book-outline" size={23} color={C.primary} />
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
                  {editingCourse
                    ? "Actualiza tu contenido"
                    : "Diseña una experiencia de aprendizaje"}
                </Text>
                <Text style={styles.formHeroSubtitle}>
                  Los campos con asterisco son obligatorios.
                </Text>
              </View>
            </View>

            <FormSection
              number="01"
              title="Información básica"
              subtitle="Presenta el curso y sus objetivos."
              icon="document-text-outline"
            >
              {renderField("Título del curso", "title", {
                required: true,
                icon: "text-outline",
                placeholder: "Ej. Introducción al diseño creativo",
              })}

              {renderField("Descripción", "description", {
                required: true,
                icon: "reader-outline",
                multiline: true,
                placeholder: "Explica qué aprenderá el estudiante...",
              })}

              {renderField("Objetivo de aprendizaje", "objective", {
                icon: "bulb-outline",
                multiline: true,
                placeholder: "¿Qué podrá hacer el estudiante al finalizar?",
              })}
            </FormSection>

            <FormSection
              number="02"
              title="Responsable"
              subtitle="Selecciona al instructor encargado del curso."
              icon="person-outline"
            >
              {renderInstructorPicker()}
            </FormSection>

            <FormSection
              number="03"
              title="Detalles del curso"
              subtitle="Define el nivel, modalidad, duración y precio."
              icon="options-outline"
            >
              <View style={styles.twoFields}>
                <View style={styles.halfField}>
                  {renderField("Precio en COP", "price", {
                    required: true,
                    icon: "cash-outline",
                    keyboardType: "decimal-pad",
                    placeholder: "0",
                  })}
                </View>

                <View style={styles.halfField}>
                  {renderField("Duración", "duration", {
                    icon: "hourglass-outline",
                    placeholder: "Ej. 4 horas",
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
                  Usa 0 para indicar que el curso es gratuito.
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Categoría</Text>

              <View style={styles.choiceRow}>
                {categories.map((category) => {
                  const selected = form.category === category;

                  return (
                    <TouchableOpacity
                      key={category}
                      onPress={() => updateField("category", category)}
                      style={[styles.choice, selected && styles.choiceSelected]}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={categoryIcons[category]}
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

              {renderChoices("Nivel", "level", levels, {
                Principiante: "leaf-outline",
                Intermedio: "trending-up-outline",
                Avanzado: "rocket-outline",
              })}

              {renderChoices("Modalidad", "modality", modalities, {
                Virtual: "laptop-outline",
                Presencial: "location-outline",
                Híbrida: "git-merge-outline",
              })}

              <View style={styles.twoFields}>
                <View style={styles.halfField}>
                  {renderField("Calificación (0 a 5)", "rating", {
                    icon: "star-outline",
                    keyboardType: "decimal-pad",
                    placeholder: "0",
                  })}
                </View>

                <View style={styles.halfField}>
                  {renderField("Estudiantes", "students", {
                    icon: "people-outline",
                    keyboardType: "numeric",
                    placeholder: "0",
                  })}
                </View>
              </View>
            </FormSection>

            <FormSection
              number="04"
              title="Recursos multimedia"
              subtitle="El video general es independiente de los videos de cada módulo."
              icon="images-outline"
            >
              {renderField("URL de imagen", "imageUrl", {
                icon: "image-outline",
                autoCapitalize: "none",
                placeholder: "https://sitio.com/imagen.jpg",
              })}

              {renderField("ID o enlace de YouTube", "videoId", {
                icon: "logo-youtube",
                autoCapitalize: "none",
                placeholder: "ID de 11 caracteres o enlace",
                helper: "Video general o de presentación del curso.",
              })}

              {renderField("URL del video general (opcional)", "videoUrl", {
                icon: "videocam-outline",
                autoCapitalize: "none",
                placeholder: "https://youtube.com/watch?v=...",
                helper:
                  "Puedes utilizar el video general como presentación. Cada módulo tendrá su propia URL más abajo.",
              })}
            </FormSection>

            <FormSection
              number="05"
              title="Módulos y sus videos"
              subtitle="Cada módulo puede tener un video diferente."
              icon="albums-outline"
            >
              <View style={styles.moduleIntro}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={C.primary}
                />
                <Text style={styles.moduleIntroText}>
                  Añade una lección por módulo. Escribe su título, duración y el
                  enlace de YouTube que verá el estudiante al abrirlo. La URL
                  del video de cada módulo es independiente de la URL general
                  del curso.
                </Text>
              </View>

              {form.modules.map((module, index) => (
                <View style={styles.moduleEditor} key={`module-${index}`}>
                  <View style={styles.moduleEditorHeader}>
                    <View style={styles.moduleNumber}>
                      <Text style={styles.moduleNumberText}>
                        {String(index + 1).padStart(2, "0")}
                      </Text>
                    </View>

                    <View style={styles.moduleEditorHeading}>
                      <Text style={styles.moduleEditorTitle}>
                        Módulo {index + 1}
                      </Text>
                      <Text style={styles.moduleEditorSubtitle}>
                        Contenido de aprendizaje
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.removeModuleButton}
                      onPress={() => removeModule(index)}
                      accessibilityLabel={`Eliminar módulo ${index + 1}`}
                    >
                      <Ionicons name="trash-outline" size={18} color={C.red} />
                    </TouchableOpacity>
                  </View>

                  {renderModuleField(
                    module,
                    index,
                    "Título del módulo",
                    "title",
                    {
                      icon: "text-outline",
                      placeholder: "Ej. Introducción al origami",
                    },
                  )}

                  {renderModuleField(module, index, "Duración", "duration", {
                    icon: "time-outline",
                    placeholder: "Ej. 15 minutos",
                  })}

                  {renderModuleField(
                    module,
                    index,
                    "URL del video de YouTube",
                    "videoUrl",
                    {
                      icon: "logo-youtube",
                      autoCapitalize: "none",
                      placeholder: "https://youtube.com/watch?v=...",
                      helper:
                        "Pega el enlace del video específico de este módulo.",
                    },
                  )}

                  <View style={styles.moduleVideoStatus}>
                    <Ionicons
                      name={
                        getYouTubeId(module.videoUrl) ||
                        getYouTubeId(module.videoId)
                          ? "checkmark-circle"
                          : "videocam-outline"
                      }
                      size={17}
                      color={
                        getYouTubeId(module.videoUrl) ||
                        getYouTubeId(module.videoId)
                          ? C.green
                          : C.muted
                      }
                    />
                    <Text style={styles.moduleVideoStatusText}>
                      {getYouTubeId(module.videoUrl) ||
                      getYouTubeId(module.videoId)
                        ? "Enlace de YouTube reconocido"
                        : "Todavía no has agregado un video"}
                    </Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addModuleButton}
                onPress={addModule}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={C.primary}
                />
                <Text style={styles.addModuleButtonText}>Agregar módulo</Text>
              </TouchableOpacity>

              {form.modules.length === 0 ? (
                <View style={styles.noModules}>
                  <Ionicons name="albums-outline" size={29} color={C.primary} />
                  <Text style={styles.noModulesTitle}>
                    Aún no has agregado módulos
                  </Text>
                  <Text style={styles.noModulesDescription}>
                    Pulsa «Agregar módulo» para crear la primera lección y
                    asignarle su propio video.
                  </Text>
                </View>
              ) : (
                <Text style={styles.moduleCount}>
                  {form.modules.length}{" "}
                  {form.modules.length === 1
                    ? "módulo agregado"
                    : "módulos agregados"}
                </Text>
              )}
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
                      editingCourse
                        ? "save-outline"
                        : "checkmark-circle-outline"
                    }
                    size={21}
                    color="#FFFFFF"
                  />
                  <Text style={styles.saveButtonText}>
                    {editingCourse ? "Guardar cambios" : "Crear curso"}
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
  screen: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    backgroundColor: C.background,
  },
  topHeader: {
    width: "100%",
    flexShrink: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 100,
    elevation: 8,
  },
  pageContainer: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    alignSelf: "stretch",
  },
  pageContainerWide: {
    maxWidth: "100%",
  },
  pageHero: {
    marginTop: 5,
    marginBottom: 10,
    padding: 20,
    minHeight: 135,
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
    maxWidth: 330,
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
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 13,
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: C.text,
    fontSize: 12,
    paddingVertical: 8,
  },
  categoryScroll: {
    flexGrow: 0,
    flexShrink: 0,
    width: "100%",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingVertical: 8,
    paddingRight: 18,
  },
  categoryFilter: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: C.surface,
  },
  categoryFilterSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  categoryFilterText: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  categoryFilterTextSelected: {
    color: "#FFFFFF",
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 0,
    paddingBottom: 8,
  },
  resultsTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: "900",
  },
  resultsCount: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 35,
    flexGrow: 1,
  },
  courseCard: {
    backgroundColor: C.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    marginBottom: 13,
  },
  courseCardWide: {
    marginBottom: 15,
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
    flexWrap: "wrap",
  },
  courseIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeading: {
    flex: 1,
    minWidth: 100,
  },
  courseTitle: {
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
  priceBadge: {
    maxWidth: "100%",
    backgroundColor: "#E5F7F0",
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  priceBadgeText: {
    color: C.green,
    fontSize: 10,
    fontWeight: "900",
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },
  chip: {
    backgroundColor: "#F0F1F7",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  chipText: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "800",
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
    marginBottom: 10,
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
    minWidth: 0,
  },
  formSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
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
    overflow: "hidden",
  },
  formSectionSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 15,
  },
  field: {
    minWidth: 0,
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
    width: "100%",
    minWidth: 0,
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
    marginBottom: 16,
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
    marginBottom: 14,
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
  instructorSelectorText: {
    flex: 1,
    minWidth: 0,
  },
  instructorSelectorName: {
    color: C.text,
    fontSize: 12,
    fontWeight: "800",
  },
  instructorPlaceholder: {
    color: C.muted,
    fontWeight: "600",
  },
  instructorSelectorHint: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
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
    minWidth: 0,
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
  instructorOptions: {
    marginTop: 6,
  },
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
  instructorOptionSelected: {
    backgroundColor: "#F1EEFF",
  },
  instructorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
  },
  instructorAvatarSelected: {
    backgroundColor: C.primary,
  },
  instructorOptionText: {
    flex: 1,
    minWidth: 0,
  },
  instructorOptionName: {
    color: C.text,
    fontSize: 12,
    fontWeight: "800",
  },
  instructorOptionEmail: {
    color: C.muted,
    fontSize: 10,
    marginTop: 3,
  },
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
  refreshInstructorsText: {
    color: C.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  moduleIntro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    backgroundColor: "#F1EEFF",
    borderRadius: 12,
    marginBottom: 16,
  },
  moduleIntroText: {
    flex: 1,
    color: "#5C528F",
    fontSize: 11,
    lineHeight: 17,
  },
  moduleEditor: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#FCFCFE",
  },
  moduleEditorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  moduleNumber: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleNumberText: {
    color: C.primary,
    fontWeight: "900",
    fontSize: 12,
  },
  moduleEditorHeading: {
    flex: 1,
    minWidth: 0,
  },
  moduleEditorTitle: {
    color: C.text,
    fontWeight: "900",
    fontSize: 13,
  },
  moduleEditorSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
  removeModuleButton: {
    width: 37,
    height: 37,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F2",
  },
  moduleVideoStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#F4F5FA",
    borderRadius: 9,
    marginBottom: 4,
  },
  moduleVideoStatusText: {
    color: C.muted,
    fontSize: 10,
    flex: 1,
  },
  addModuleButton: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: C.primary,
    borderStyle: "dashed",
    borderRadius: 13,
    backgroundColor: "#F8F6FF",
    marginTop: 3,
  },
  addModuleButtonText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  noModules: {
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    marginTop: 12,
    backgroundColor: "#F8F6FF",
    borderRadius: 13,
  },
  noModulesTitle: {
    color: C.text,
    fontWeight: "900",
    fontSize: 12,
    marginTop: 9,
  },
  noModulesDescription: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 5,
  },
  moduleCount: {
    textAlign: "center",
    color: C.muted,
    fontSize: 10,
    marginTop: 10,
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
