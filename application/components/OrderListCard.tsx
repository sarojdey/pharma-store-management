import { OrderList } from "@/types";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export default function OrderListCard({ orderList }: { orderList: OrderList }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const generatePDF = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order List - ${orderList.supplierName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #1f6295;
              padding-bottom: 10px;
            }
            .header h1 {
              color: #1f6295;
              margin: 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
              font-size: 14px;
            }
            .info-section {
              margin-bottom: 25px;
            }
            .info-row {
              display: flex;
              margin-bottom: 2px;
              padding: 5px 0;
              gap: 4px;
            }
            .info-label {
              font-weight: bold;
              color: #1f6295;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            th {
              background-color: #1f6295;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 10px 8px;
              border-bottom: 1px solid #e0e0e0;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr:hover {
              background-color: #f5f5f5;
            }
            .serial-col {
              width: 60px;
              text-align: center;
              font-weight: bold;
              color: #1f6295;
            }
            .medicine-col {
              width: 60%;
            }
            .quantity-col {
              width: 25%;
              text-align: center;
            }
            
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${orderList.supplierName}</h1>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">List ID:</span>
              <span>${orderList.id}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Created Date:</span>
              <span>${formatDate(orderList.createdAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Items:</span>
              <span>${orderList.items.length}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="serial-col">S.No.</th>
                <th class="medicine-col">Medicine Name</th>
                <th class="quantity-col">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${orderList.items
                .map(
                  (item, index) => `
                <tr>
                  <td class="serial-col">${index + 1}</td>
                  <td class="medicine-col">${item.medicineName}</td>
                  <td class="quantity-col">${item.quantity}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Order List PDF",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", "PDF generated successfully!");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF. Please try again.");
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.listId}>ID: {orderList.id}</Text>
        <AntDesign name="form" size={20} color="#999" />
      </View>

      <View style={styles.supplierRow}>
        <AntDesign name="user" size={18} color="rgb(31, 98, 149)" />
        <Text style={styles.supplierName}>{orderList.supplierName}</Text>
      </View>
      <View style={styles.dateInfo}>
        <AntDesign name="calendar" size={18} color="rgb(31, 98, 149)" />
        <Text style={styles.dateText}>{formatDate(orderList.createdAt)}</Text>
      </View>
      <View style={styles.medicinesSection}>
        <Text style={styles.medicinesHeader}>
          Medicines ({orderList.items.length}):
        </Text>
        {orderList.items.map((item, index) => (
          <View key={item.id} style={styles.medicineRow}>
            <Text style={styles.serialNumber}>{index + 1}.</Text>
            <View style={styles.medicineInfo}>
              <Text style={styles.medicineName}>{item.medicineName}</Text>
              <Text style={styles.medicineQuantity}>Qty: {item.quantity}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.exportButton} onPress={generatePDF}>
          <MaterialIcons
            name="file-download"
            size={20}
            color="rgb(57, 104, 139)"
            style={{ marginTop: 3 }}
          />
          <Text style={styles.exportButtonText}>Export PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 8,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  listId: {
    maxWidth: "90%",
    color: "#666",
  },
  supplierRow: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },
  supplierName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flexShrink: 1,
  },
  medicinesSection: {
    borderRadius: 6,
    padding: 15,
    marginVertical: 4,
    backgroundColor: "#f4f4f4",
    borderWidth: 1,
    borderColor: "rgba(126, 126, 126, 0.1)",
  },
  medicinesHeader: {
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  medicineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 4,
  },
  serialNumber: {
    fontWeight: "600",
    color: "rgb(31, 98, 149)",
    minWidth: 20,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontWeight: "500",
    color: "#333",
    marginBottom: 1,
  },
  medicineQuantity: {
    fontSize: 12,
    color: "#666",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
  },
  dateInfo: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 4,
  },
  dateText: {
    color: "#666",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgb(233, 243, 251)",
    borderColor: "rgb(152, 175, 192)",
    gap: 6,
  },
  exportButtonText: {
    color: "rgb(57, 104, 139)",
    fontWeight: "500",
  },
});
