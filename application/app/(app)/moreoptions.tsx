import { useStore } from "@/contexts/StoreContext";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { getStockForExport } from "@/utils/stocksDb";
import TopBar from "@/components/TopBar";

const MORE_OPTIONS = [
  {
    key: "storeSettings",
    title: "Store Settings",
    description: "Edit store information and preferences",
    icon: "settings",
    iconFamily: "MaterialIcons",
    color: "#4a90e2",
  },
  {
    key: "addStore",
    title: "Add New Store",
    description: "Create a new store location",
    icon: "storefront",
    iconFamily: "Ionicons",
    color: "#ff9800",
  },
  {
    key: "exportStore",
    title: "Export Store Data",
    description: "Export store data and reports",
    icon: "download",
    iconFamily: "Feather",
    color: "#9c27b0",
  },
  {
    key: "exportStock",
    title: "Export Stock Data",
    description: "Export stock data as PDF",
    icon: "download",
    iconFamily: "Feather",
    color: "#4caf50",
  },
];

export default function MoreOptionsScreen() {
  const router = useRouter();
  const { currentStore } = useStore();

  const exportStockToPDF = useCallback(async () => {
    if (!currentStore?.id) {
      Alert.alert("Error", "No store selected.");
      return;
    }

    try {
      const stockData = await getStockForExport(currentStore.id);

      if (stockData.length === 0) {
        Alert.alert("No Data", "No stock data to export.");
        return;
      }

      const currentDate = new Date().toLocaleDateString("en-IN");
      const fileName = `stock-data-${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Stock Data</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 12px;
            color: #222;
            margin: 0;
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #aaa;
            padding-bottom: 10px;
          }
          .header h1 {
            font-size: 24px;
            margin: 0;
            color: #333;
          }
          .header-info {
            font-size: 13px;
            color: #666;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            page-break-inside: auto;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
            page-break-inside: avoid;
          }
          th {
            background-color: #f0f0f0;
            font-weight: 600;
            font-size: 13px;
          }
          td {
            font-size: 12px;
            vertical-align: middle;
          }
          tbody tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          .medicine-col {
            text-align: left;
            padding-left: 10px;
          }
          .serial-col {
            width: 15%;
          }
          .medicine-col {
            width: 65%;
          }
          .rack-col {
            width: 20%;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Stock Data</h1>
          <div class="header-info">Date: ${currentDate}</div>
          <div class="header-info">Total Items: ${stockData.length}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th class="serial-col">Serial No.</th>
              <th class="rack-col">Rack No.</th> 
              <th class="medicine-col">Medicine Name</th>
            </tr>
          </thead>
          <tbody>
            ${stockData
              .map(
                (stock, index) => `
              <tr>
                <td class="serial-col">${index + 1}</td>
                <td class="rack-col">${stock.rackNo || "N/A"}</td>
                <td class="medicine-col">${stock.medicineName}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

      const { uri: tempUri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      const newPath = FileSystem.documentDirectory + fileName;

      await FileSystem.moveAsync({
        from: tempUri,
        to: newPath,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newPath, {
          mimeType: "application/pdf",
          dialogTitle: "Share Stock Data PDF",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", "PDF generated successfully!");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF. Please try again.");
    }
  }, [currentStore?.id]);

  const handleOptionPress = useCallback(
    async (option: any) => {
      switch (option.key) {
        case "storeSettings":
          router.push(`/(app)/editstore?storeId=${currentStore?.id}`);
          break;
        case "addStore":
          router.push("/(app)/createnewstore");
          break;
        case "exportStore":
          router.push("/(app)/exportstore");
          break;
        case "exportStock":
          await exportStockToPDF();
          break;
        default:
          break;
      }
    },
    [router, currentStore?.id, exportStockToPDF]
  );

  const renderIcon = useCallback((option: any) => {
    const IconComponent =
      option.iconFamily === "MaterialIcons"
        ? MaterialIcons
        : option.iconFamily === "Ionicons"
        ? Ionicons
        : Feather;

    return <IconComponent name={option.icon} size={24} color={option.color} />;
  }, []);

  return (
    <View style={styles.wrapper}>
      <TopBar title="More Options" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.optionsList}>
            {MORE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.optionItem}
                activeOpacity={0.7}
                onPress={() => handleOptionPress(option)}
              >
                <View
                  style={[
                    styles.optionIconContainer,
                    { backgroundColor: `${option.color}15` },
                  ]}
                >
                  {renderIcon(option)}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#8b8b8bff" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 18,
  },

  optionsList: {
    flex: 1,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c3c3c3a6",
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#535353ff",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: "#8b8b8bff",
  },
});
