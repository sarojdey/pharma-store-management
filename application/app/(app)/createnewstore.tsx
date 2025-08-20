import { useStore } from "@/contexts/StoreContext";
import { importStoreFromJson, previewImportFile } from "@/utils/importStore";
import { addStore } from "@/utils/storesDb";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useNavigation, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const STORAGE_KEY = "activeStoreId";

type ImportProgress = {
  phase:
    | "validation"
    | "store"
    | "drugs"
    | "sales"
    | "suppliers"
    | "orderLists"
    | "history"
    | "complete";
  current: number;
  total: number;
  message: string;
};

export default function AddNewStoreScreen() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [importMode, setImportMode] = useState(false);
  const [importFile, setImportFile] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState<string>("");
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null
  );
  const [showProgressModal, setShowProgressModal] = useState(false);

  const router = useRouter();
  const navigation = useNavigation();
  const { setCurrentStore, addStoreToContext } = useStore();

  const onCreate = async () => {
    if (!name.trim()) {
      return Alert.alert("Validation", "Store name cannot be empty");
    }
    setBusy(true);
    try {
      const { success, id } = await addStore({ name: name.trim() });
      if (!success || id == null) throw new Error("Failed to insert store");

      const newStore = {
        id,
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEY, id.toString());

      setCurrentStore(newStore);
      addStoreToContext(newStore);
      // seedDatabase(newStore.id);
      Alert.alert(
        "Store Created!",
        `"${name.trim()}" has been created successfully.`,
        [
          {
            text: "Go to Store",
            onPress: () => router.replace("/"),
          },
        ]
      );
    } catch (err: any) {
      console.error("Create store error:", err);
      Alert.alert("Error", err.message || "Could not create store");
    } finally {
      setBusy(false);
    }
  };

  const pickImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setImportFileName(file.name);

        const fileContent = await FileSystem.readAsStringAsync(file.uri);
        setImportFile(fileContent);

        const previewResult = await previewImportFile(fileContent);

        if (previewResult.success) {
          setImportPreview(previewResult.preview);

          if (!name.trim() && previewResult.preview) {
            setName(previewResult.preview.storeName);
          }
        } else {
          Alert.alert(
            "Invalid Import File",
            `The selected file is not a valid store export:\n\n${
              previewResult.errors?.join("\n") || "Unknown error"
            }`
          );
          resetImportState();
        }
      }
    } catch (error: any) {
      console.error("File picker error:", error);
      Alert.alert("Error", "Failed to read the import file. Please try again.");
      resetImportState();
    }
  };

  const resetImportState = () => {
    setImportFile(null);
    setImportFileName("");
    setImportPreview(null);
  };

  const onImport = async () => {
    if (!name.trim()) {
      return Alert.alert("Validation", "Store name cannot be empty");
    }

    if (!importFile) {
      return Alert.alert("Validation", "Please select an import file");
    }

    Alert.alert(
      "Confirm Import",
      `Import "${
        importPreview?.storeName
      }" as "${name.trim()}"?\n\nThis will create a new store with:\n• ${
        importPreview?.drugsCount || 0
      } medicines\n• ${importPreview?.salesCount || 0} sales\n• ${
        importPreview?.suppliersCount || 0
      } suppliers\n• ${importPreview?.orderListsCount || 0} orders\n• ${
        importPreview?.historyCount || 0
      } history entries`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          style: "default",
          onPress: performImport,
        },
      ]
    );
  };

  const performImport = async () => {
    setImporting(true);
    setShowProgressModal(true);

    try {
      const result = await importStoreFromJson(
        name.trim(),
        importFile!,
        (progress) => {
          setImportProgress(progress);
        }
      );

      setShowProgressModal(false);

      if (result.success && result.storeId) {
        const newStore = {
          id: result.storeId,
          name: name.trim(),
          createdAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(STORAGE_KEY, result.storeId.toString());

        setCurrentStore(newStore);
        addStoreToContext(newStore);

        const summary = result.importSummary;
        Alert.alert(
          "Import Successful!",
          `Your store has been imported successfully!\n\nImported:\n• ${
            summary?.drugsImported || 0
          } medicines\n• ${summary?.salesImported || 0} sales\n• ${
            summary?.suppliersImported || 0
          } suppliers\n• ${summary?.orderListsImported || 0} orders\n• ${
            summary?.historyImported || 0
          } history entries`,
          [
            {
              text: "Go to Store",
              onPress: () => router.replace("/"),
            },
          ]
        );
      } else {
        throw new Error(result.error || "Import failed");
      }
    } catch (err: any) {
      setShowProgressModal(false);
      console.error("Import error:", err);
      Alert.alert(
        "Import Failed",
        err.message || "Could not import store data"
      );
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  const getProgressPercentage = () => {
    if (!importProgress) return 0;
    return Math.round((importProgress.current / importProgress.total) * 100);
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topbar}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back-sharp" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.topbarTitle}>Add New Store</Text>
            </View>
          </View>
          <View style={styles.container}>
            <View style={styles.modeToggleSection}>
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    !importMode && styles.modeButtonActive,
                  ]}
                  onPress={() => {
                    setImportMode(false);
                    resetImportState();
                    setName("");
                  }}
                >
                  <Ionicons
                    name="add-circle"
                    size={20}
                    color={!importMode ? "#fff" : "rgba(65, 103, 168, 1)"}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      !importMode && styles.modeButtonTextActive,
                    ]}
                  >
                    Create New
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    importMode && styles.modeButtonActive,
                  ]}
                  onPress={() => {
                    setImportMode(true);
                    setName("");
                  }}
                >
                  <Ionicons
                    name="cloud-upload"
                    size={20}
                    color={importMode ? "#fff" : "rgba(65, 103, 168, 1)"}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      importMode && styles.modeButtonTextActive,
                    ]}
                  >
                    Import Store
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              {importMode && (
                <View style={styles.inputContainer}>
                  <TouchableOpacity
                    style={[
                      styles.fileInputRow,
                      importFile && styles.fileInputSelected,
                    ]}
                    onPress={pickImportFile}
                    disabled={importing}
                  >
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name={importFile ? "document-text" : "cloud-upload"}
                        size={22}
                        color="rgba(78, 122, 198, 1)"
                      />
                    </View>
                    <View style={styles.fileInputContent}>
                      <Text style={styles.fileInputText}>
                        {importFileName || "Select import file (.json)"}
                      </Text>
                      {importFile && (
                        <Text style={styles.fileInputSubtext}>
                          Tap to change file
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
              )}

              {importMode && importPreview && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewTitle}>Import Preview</Text>
                  <View style={styles.previewGrid}>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>Original Store</Text>
                      <Text style={styles.previewValue}>
                        {importPreview.storeName}
                      </Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>Export Date</Text>
                      <Text style={styles.previewValue}>
                        {new Date(
                          importPreview.exportDate
                        ).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>Medicines</Text>
                      <Text style={styles.previewValue}>
                        {importPreview.drugsCount}
                      </Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>Sales</Text>
                      <Text style={styles.previewValue}>
                        {importPreview.salesCount}
                      </Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>Suppliers</Text>
                      <Text style={styles.previewValue}>
                        {importPreview.suppliersCount}
                      </Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>Est. Time</Text>
                      <Text style={styles.previewValue}>
                        {importPreview.estimatedImportTime}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="storefront"
                      size={22}
                      color="rgba(78, 122, 198, 1)"
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      importMode
                        ? "Enter store name for import"
                        : "Enter new store name"
                    }
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={setName}
                    editable={!busy && !importing}
                    returnKeyType="done"
                    onSubmitEditing={importMode ? onImport : onCreate}
                    autoCorrect={false}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  (busy ||
                    importing ||
                    !name.trim() ||
                    (importMode && !importFile)) &&
                    styles.buttonDisabled,
                ]}
                onPress={importMode ? onImport : onCreate}
                disabled={
                  busy ||
                  importing ||
                  !name.trim() ||
                  (importMode && !importFile)
                }
                activeOpacity={0.8}
              >
                {busy || importing ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                      {importing ? "Importing..." : "Creating..."}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons
                      name={importMode ? "cloud-upload" : "add-circle"}
                      size={20}
                      color="#fff"
                    />
                    <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                      {importMode ? "Import Store" : "Create Store"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showProgressModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.progressModal}>
            <Text style={styles.progressTitle}>Importing Store Data</Text>

            {importProgress && (
              <>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${getProgressPercentage()}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPercentage}>
                    {getProgressPercentage()}%
                  </Text>
                </View>

                <Text style={styles.progressMessage}>
                  {importProgress.message}
                </Text>

                <Text style={styles.progressStep}>
                  Step {importProgress.current} of {importProgress.total}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  topbar: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 70,
    zIndex: 1000,
  },
  header: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderBottomColor: "#ccc",
    borderTopColor: "#ccc",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  topbarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    minHeight: "100%",
  },
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
  },

  modeToggleSection: {
    marginBottom: 24,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: "rgba(65, 103, 168, 1)",
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(65, 103, 168, 1)",
  },
  modeButtonTextActive: {
    color: "#fff",
  },
  formSection: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#e5e7eb4b",
    elevation: 1,
  },
  fileInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb4b",
    elevation: 1,
    minHeight: 56,
  },
  fileInputSelected: {
    borderColor: "rgba(65, 103, 168, 0.3)",
    backgroundColor: "rgba(65, 103, 168, 0.05)",
  },
  fileInputContent: {
    flex: 1,
    marginLeft: 12,
  },
  fileInputText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  fileInputSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  previewContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(65, 103, 168, 0.1)",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  previewItem: {
    flex: 1,
    minWidth: "45%",
  },
  previewLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(65, 103, 168, 1)",
  },
  button: {
    backgroundColor: "rgba(65, 103, 168, 1)",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#6f88b5ff",
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: "80%",
    maxWidth: 320,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 20,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "rgba(65, 103, 168, 1)",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(65, 103, 168, 1)",
    minWidth: 40,
  },
  progressMessage: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 8,
  },
  progressStep: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
});
