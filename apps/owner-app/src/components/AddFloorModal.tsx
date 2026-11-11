import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput } from "react-native";
import { COLORS } from "../styles/theme";

interface AddFloorModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFloor: () => void;
  floorNumber: string;
  setFloorNumber: (num: string) => void;
}

export const AddFloorModal: React.FC<AddFloorModalProps> = ({
  visible,
  onClose,
  onAddFloor,
  floorNumber,
  setFloorNumber,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add Floor</Text>
          <Text style={styles.modalSubtitle}>Register a new floor inside this property.</Text>

          <Text style={styles.label}>Floor Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2 for 2nd Floor"
            value={floorNumber}
            onChangeText={setFloorNumber}
            keyboardType="number-pad"
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onAddFloor}>
              <Text style={styles.confirmText}>Create Floor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 20,
    backgroundColor: COLORS.background,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    color: COLORS.textMuted,
    fontWeight: "bold",
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
