import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import EmptyState from "../../components/EmptyState";
import WorkshopCard from "../../components/WorkshopCard";
import { COLORS } from "../../constants/colors";
import { getWorkshops } from "../../services/workshopService";

export default function WorkshopsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [workshops, setWorkshops] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const numColumns = width >= 1440 ? 3 : width >= 1000 ? 2 : 1;
  const pageWidth = width >= 1440 ? 1980 : width >= 1000 ? 1120 : width;

  const loadWorkshops = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result = await getWorkshops();
      setWorkshops(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Error al cargar los talleres:", err);
      setWorkshops([]);
      setError("No fue posible cargar los talleres. Intenta nuevamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWorkshops();
  }, [loadWorkshops]);

  const filteredWorkshops = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return workshops;

    return workshops.filter((workshop) => {
      const title = String(workshop.title || "").toLowerCase();
      const description = String(workshop.description || "").toLowerCase();
      const category = String(workshop.category || "").toLowerCase();

      return (
        title.includes(query) ||
        description.includes(query) ||
        category.includes(query)
      );
    });
  }, [workshops, search]);

  const openWorkshop = useCallback(
    (workshop) => {
      if (!workshop?.id) return;

      router.push({
        pathname: "/tabs/workshop-detail",
        params: { id: String(workshop.id) },
      });
    },
    [router],
  );

  const renderWorkshop = useCallback(
    ({ item }) => (
      <View style={styles.workshopCell}>
        <WorkshopCard workshop={item} onPress={() => openWorkshop(item)} />
      </View>
    ),
    [openWorkshop],
  );

  const listHeader = (
    <View style={styles.headerContent}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}>
          <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
        </View>

        <View style={styles.headingText}>
          <Text style={styles.heading}>Talleres creativos</Text>
          <Text style={styles.subtitle}>
            Encuentra una experiencia práctica para aprender y crear.
          </Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={20}
          color={COLORS.textSecondary}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar talleres..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          accessibilityLabel="Buscar talleres"
        />

        {search.length > 0 && (
          <Ionicons
            name="close-circle"
            size={20}
            color={COLORS.textSecondary}
            onPress={() => setSearch("")}
          />
        )}
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>Próximos talleres</Text>
        {!loading && (
          <Text style={styles.resultsCount}>
            {filteredWorkshops.length}{" "}
            {filteredWorkshops.length === 1 ? "taller" : "talleres"}
          </Text>
        )}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={() => loadWorkshops()}>
            Reintentar
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando talleres...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        key={`workshops-${numColumns}`}
        data={filteredWorkshops}
        keyExtractor={(item, index) => String(item.id || index)}
        renderItem={renderWorkshop}
        numColumns={numColumns}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            title="No encontramos talleres"
            message={
              search
                ? "Prueba con otra palabra de búsqueda."
                : "Los talleres aparecerán aquí cuando estén disponibles."
            }
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadWorkshops(true)}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { maxWidth: pageWidth, alignSelf: "center", width: "100%" },
          filteredWorkshops.length === 0 && styles.emptyList,
        ]}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background || "#F6F8FC",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.textSecondary,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  errorText: {
    color: "#B42318",
    fontSize: 14,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 14,
    marginTop: 8,
  },
  headerContent: {
    width: "100%",
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  headingIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft || "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headingText: {
    flex: 1,
  },
  heading: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white || "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  resultsCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  columnWrapper: {
    gap: 16,
    alignItems: "stretch",
  },
  workshopCell: {
    flex: 1,
    minWidth: 0,
  },
  emptyList: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background || "#F6F8FC",
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
  },
  errorBox: {
    backgroundColor: "#FFF1F0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: "#B42318",
    fontSize: 13,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: "700",
    marginTop: 8,
  },
});
