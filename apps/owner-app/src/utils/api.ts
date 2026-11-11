import Constants from "expo-constants";

export const FALLBACK_URL = "https://cricket-sprinkler-atonable.ngrok-free.dev";
export const LOCAL_IP = "192.168.88.5";

const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host.includes("exp.direct")) {
      return FALLBACK_URL;
    }
    return `http://${host}:5005`;
  }
  return `http://${LOCAL_IP}:5005`;
};

export const API_BASE = getApiUrl();
