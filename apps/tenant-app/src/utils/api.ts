import Constants from "expo-constants";

const TUNNEL_URL = "https://cricket-sprinkler-atonable.ngrok-free.dev";

const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host.includes("exp.direct")) {
      return TUNNEL_URL;
    }
    return `http://${host}:5005`;
  }
  return "http://192.168.88.5:5005";
};

export const API_BASE = getApiUrl();
export const MOCK_KYC_DOCS = [
  { document_type: "Aadhaar", document_number: "XXXX-XXXX-1234", verified: true, file_url: "https://example.com/mock-aadhaar.jpg" }
];
