import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

/**
 * Utility service to handle image picking and uploading to the backend Supabase bucket.
 */
export const UploadService = {
  /**
   * Prompts the user to pick an image from the library, then uploads it as base64 to the server.
   * @param bucket The Supabase storage bucket name (e.g., 'aadhaar', 'pan', 'receipts')
   * @param apiBase The active backend API base URL
   * @param token JWT user authorization token
   * @returns The public/signed URL of the uploaded image, or null if cancelled/failed
   */
  pickAndUploadImage: async (
    bucket: string,
    apiBase: string,
    token: string
  ): Promise<string | null> => {
    try {
      // 1. Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Sorry, we need camera roll permissions to upload documents."
        );
        return null;
      }

      // 2. Launch image library picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const base64Data = asset.base64;

      if (!base64Data) {
        Alert.alert("Error", "Could not read image data.");
        return null;
      }

      // 3. Upload to backend
      const response = await fetch(`${apiBase}/api/auth/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "bypass-tunnel-reminder": "true",
        },
        body: JSON.stringify({
          bucket,
          image_base64: `data:image/png;base64,${base64Data}`,
        }),
      });

      const responseData = await response.json();
      if (responseData.error) {
        Alert.alert("Upload Failed", responseData.error);
        return null;
      }

      return responseData.publicUrl || null;
    } catch (error: any) {
      console.error("Error during image upload:", error);
      Alert.alert("Upload Error", error.message || "An unexpected error occurred during upload.");
      return null;
    }
  },
};
