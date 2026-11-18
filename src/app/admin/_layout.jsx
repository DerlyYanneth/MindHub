import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";

export default function AdminLayout() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={COLORS.admin || COLORS.primary}
        />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (role !== "admin") {
    return <Redirect href="/tabs/home" />;
  }

  return <Slot />;
}

const styles = {
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F7FB",
  },
};
