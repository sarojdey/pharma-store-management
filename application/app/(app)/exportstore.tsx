import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useStore } from "@/contexts/StoreContext";
import {
  exportAndShareStoreData,
  getExportPreview,
  exportStoreToFile,
} from "@/utils/exportStore";

interface ExportPreview {
  drugs: number;
  sales: number;
  suppliers: number;
  orderLists: number;
  history: number;
  totalRecords: number;
  estimatedFileSize: string;
}

interface ExportStoreComponentProps {
  onClose?: () => void;
  showAsModal?: boolean;
}

export default function ExportStoreComponent({
  onClose,
  showAsModal = false,
}: ExportStoreComponentProps) {
  const { currentStore } = useStore();
  const navigation = useNavigation();
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(true);

  // Export options
  const [includeHistory, setIncludeHistory] = useState(true);
  const [exportType, setExportType] = useState<"share" | "save">("share");

  useEffect(() => {
    loadPreview();
  }, [currentStore]);

  const loadPreview = async () => {
    if (!currentStore) return;

    setLoadingPreview(true);
    try {
      const result = await getExportPreview(currentStore.id);
      if (result.success && result.preview) {
        setPreview(result.preview);
      }
    } catch (error) {
      console.error("Error loading export preview:", error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleBackPress = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  const handleExport = async () => {
    if (!currentStore) {
      Alert.alert("Error", "No store selected");
      return;
    }

    setLoading(true);

    try {
      const options = {
        includeHistory,
        customFileName: `${currentStore.name}_backup_${
          new Date().toISOString().split("T")[0]
        }.json`,
      };

      let result;

      if (exportType === "share") {
        result = await exportAndShareStoreData(currentStore, options);

        if (result.success) {
          if (result.shared) {
            Alert.alert(
              "Export Successful",
              "Your store data has been exported and shared successfully!"
            );
          } else {
            Alert.alert(
              "Export Created",
              "Your store data has been exported, but sharing is not available on this device."
            );
          }
        } else {
          throw new Error(result.error || "Export failed");
        }
      } else {
        result = await exportStoreToFile(currentStore, options);

        if (result.success) {
          Alert.alert(
            "Export Successful",
            `Your store data has been saved successfully!\n\nFile saved to: Downloads folder`,
            [{ text: "OK" }]
          );
        } else {
          throw new Error(result.error || "Export failed");
        }
      }

      if (onClose) onClose();
    } catch (error: any) {
      console.error("Export error:", error);
      Alert.alert(
        "Export Failed",
        error.message ||
          "An error occurred while exporting your store data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!currentStore) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No store selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* TopBar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back-sharp" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Export Store</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Export Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Preview</Text>

          {loadingPreview ? (
            <View style={styles.previewLoading}>
              <ActivityIndicator color="rgba(65, 103, 168, 1)" />
              <Text style={styles.loadingText}>Loading preview...</Text>
            </View>
          ) : preview ? (
            <View style={styles.previewContainer}>
              <View style={styles.previewRow}>
                <Ionicons
                  name="medical"
                  size={20}
                  color="rgba(65, 103, 168, 1)"
                />
                <Text style={styles.previewLabel}>Medicines</Text>
                <Text style={styles.previewValue}>{preview.drugs}</Text>
              </View>

              <View style={styles.previewRow}>
                <Ionicons
                  name="receipt"
                  size={20}
                  color="rgba(65, 103, 168, 1)"
                />
                <Text style={styles.previewLabel}>Sales</Text>
                <Text style={styles.previewValue}>{preview.sales}</Text>
              </View>

              <View style={styles.previewRow}>
                <Ionicons
                  name="people"
                  size={20}
                  color="rgba(65, 103, 168, 1)"
                />
                <Text style={styles.previewLabel}>Suppliers</Text>
                <Text style={styles.previewValue}>{preview.suppliers}</Text>
              </View>

              <View style={styles.previewRow}>
                <Ionicons name="list" size={20} color="rgba(65, 103, 168, 1)" />
                <Text style={styles.previewLabel}>Order Lists</Text>
                <Text style={styles.previewValue}>{preview.orderLists}</Text>
              </View>

              {includeHistory && (
                <View style={styles.previewRow}>
                  <Ionicons
                    name="time"
                    size={20}
                    color="rgba(65, 103, 168, 1)"
                  />
                  <Text style={styles.previewLabel}>History</Text>
                  <Text style={styles.previewValue}>{preview.history}</Text>
                </View>
              )}

              <View style={[styles.previewRow, styles.totalRow]}>
                <Ionicons
                  name="document"
                  size={20}
                  color="rgba(65, 103, 168, 1)"
                />
                <Text style={styles.totalLabel}>Total Records</Text>
                <Text style={styles.totalValue}>
                  {includeHistory
                    ? preview.totalRecords
                    : preview.totalRecords - preview.history}
                </Text>
              </View>

              <View style={[styles.previewRow, styles.sizeRow]}>
                <Text style={styles.sizeLabel}>
                  Estimated file size: {preview.estimatedFileSize}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.errorText}>Unable to load preview</Text>
          )}
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Options</Text>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Include History</Text>
              <Text style={styles.optionDescription}>
                Include activity logs and transaction history
              </Text>
            </View>
            <Switch
              value={includeHistory}
              onValueChange={setIncludeHistory}
              trackColor={{ false: "#e5e7eb", true: "rgba(65, 103, 168, 0.3)" }}
              thumbColor={includeHistory ? "rgba(65, 103, 168, 1)" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Export Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Method</Text>

          <TouchableOpacity
            style={[
              styles.exportTypeOption,
              exportType === "share" && styles.exportTypeSelected,
            ]}
            onPress={() => setExportType("share")}
          >
            <Ionicons
              name="share"
              size={24}
              color={
                exportType === "share" ? "rgba(65, 103, 168, 1)" : "#6b7280"
              }
            />
            <View style={styles.exportTypeInfo}>
              <Text
                style={[
                  styles.exportTypeTitle,
                  exportType === "share" && styles.exportTypeTitleSelected,
                ]}
              >
                Share File
              </Text>
              <Text style={styles.exportTypeDescription}>
                Export and share via email, messaging, or cloud storage
              </Text>
            </View>
            {exportType === "share" && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="rgba(65, 103, 168, 1)"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.exportTypeOption,
              exportType === "save" && styles.exportTypeSelected,
            ]}
            onPress={() => setExportType("save")}
          >
            <Ionicons
              name="save"
              size={24}
              color={
                exportType === "save" ? "rgba(65, 103, 168, 1)" : "#6b7280"
              }
            />
            <View style={styles.exportTypeInfo}>
              <Text
                style={[
                  styles.exportTypeTitle,
                  exportType === "save" && styles.exportTypeTitleSelected,
                ]}
              >
                Save to Device
              </Text>
              <Text style={styles.exportTypeDescription}>
                Save export file to device's Downloads folder
              </Text>
            </View>
            {exportType === "save" && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="rgba(65, 103, 168, 1)"
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Export Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.exportButton,
              loading && styles.exportButtonDisabled,
            ]}
            onPress={handleExport}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                  Exporting...
                </Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="download" size={20} color="#fff" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                  {exportType === "share" ? "Export & Share" : "Export & Save"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons
            name="information-circle"
            size={20}
            color="rgba(65, 103, 168, 1)"
          />
          <Text style={styles.infoText}>
            This export includes all your store data in JSON format. You can use
            this file to import your data into another device or as a backup.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topbar: {
    position: "absolute",
    top: 0,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderBottomColor: "#ccc",
    borderTopColor: "#ccc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    zIndex: 1000,
    gap: 16,
  },
  topbarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  scrollContent: {
    marginTop: 60, // Adjust based on topbar height
  },

  section: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  previewContainer: {
    gap: 12,
  },
  previewLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewLabel: {
    flex: 1,
    fontSize: 14,
    color: "#4b5563",
  },
  previewValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    minWidth: 40,
    textAlign: "right",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  totalLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(65, 103, 168, 1)",
    minWidth: 40,
    textAlign: "right",
  },
  sizeRow: {
    justifyContent: "center",
    marginTop: 4,
  },
  sizeLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionInfo: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: "#6b7280",
  },
  exportTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
    gap: 12,
  },
  exportTypeSelected: {
    borderColor: "rgba(65, 103, 168, 1)",
    backgroundColor: "rgba(65, 103, 168, 0.05)",
  },
  exportTypeInfo: {
    flex: 1,
  },
  exportTypeTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 2,
  },
  exportTypeTitleSelected: {
    color: "rgba(65, 103, 168, 1)",
  },
  exportTypeDescription: {
    fontSize: 13,
    color: "#6b7280",
  },
  exportButton: {
    backgroundColor: "#4167a8ff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  exportButtonDisabled: {
    backgroundColor: "#6f88b5ff",
    opacity: 0.7,
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
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    margin: 16,
    padding: 16,
    backgroundColor: "rgba(65, 103, 168, 0.1)",
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "rgba(65, 103, 168, 1)",
    lineHeight: 18,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },
});
