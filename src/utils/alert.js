import { Alert, Platform } from "react-native";

export const showAlert = (title, message, buttons) => {
  if (Platform.OS === "web") {
    if (buttons && buttons.length > 0) {
      const confirmBtn = buttons.find((b) => b.style !== "cancel");
      const cancelBtn = buttons.find((b) => b.style === "cancel");
      if (cancelBtn) {
        if (window.confirm(`${title}\n\n${message}`)) {
          confirmBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
        confirmBtn?.onPress?.();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
