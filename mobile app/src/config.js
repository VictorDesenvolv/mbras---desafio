import { Platform } from "react-native";

export const API_BASE_URL = Platform.select({
  android: "http://10.0.2.2:8000",
  default: "http://localhost:8000",
});
