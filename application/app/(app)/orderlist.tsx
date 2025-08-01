import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useNavigation, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Alert,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

import { OrderList } from "@/types";

import Loader from "@/components/Loader";
import OrderListCard from "@/components/OrderListCard";
import { getAllOrderLists } from "@/utils/orderListDb";
import { useStore } from "@/contexts/StoreContext";

export default function OrderLists() {
  const navigation = useNavigation();
  const [orderLists, setOrderLists] = useState<OrderList[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentStore } = useStore();
  const loadOrderLists = useCallback(async () => {
    if (!currentStore?.id) {
      Alert.alert("Error", "No store selected.");
      return;
    }
    try {
      setLoading(true);
      const orderListsData = await getAllOrderLists(currentStore?.id);
      setOrderLists(orderListsData);
    } catch (error) {
      console.error("Error loading order lists:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrderLists();
    }, [loadOrderLists])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const exportAllToPDF = async () => {
    if (orderLists.length === 0) {
      Alert.alert("No Data", "No order lists to export.");
      return;
    }

    try {
      const currentDate = new Date().toLocaleDateString("en-IN");
      const fileName = `orderlist-${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order List</title>
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
          }
          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
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
          .medicine-col,
          .supplier-col {
            text-align: left;
            padding-left: 10px;
          }
          .serial-col {
            width: 10%;
          }
          .medicine-col {
            width: 35%;
          }
          .quantity-col {
            width: 15%;
          }
          .date-col {
            width: 20%;
          }
          .supplier-col {
            width: 20%;
          }
          .na-text {
            color: #aaa;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Order List</h1>
          <div class="header-info">Date: ${currentDate}</div>
          <div class="header-info">Total Items: ${orderLists.length}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th class="serial-col">Serial No.</th>
              <th class="medicine-col">Medicine Name</th>
              <th class="quantity-col">Quantity</th>
              <th class="date-col">Date Added</th>
              <th class="supplier-col">Supplier</th>
            </tr>
          </thead>
          <tbody>
            ${orderLists
              .map(
                (order, index) => `
              <tr>
                <td class="serial-col">${index + 1}</td>
                <td class="medicine-col">
                  <span class="medicine-name">${order.medicineName}</span>
                </td>
                <td class="quantity-col">${order.quantity}</td>
                <td class="date-col">${formatDate(order.createdAt)}</td>
                <td class="supplier-col">
                  ${
                    order.supplierName
                      ? order.supplierName
                      : '<span class="na-text">N/A</span>'
                  }
                </td>
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
    <View style={{ flex: 1, position: "relative" }}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back-sharp"
            size={24}
            color="#555
          "
          />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Order Lists</Text>
        <TouchableOpacity onPress={exportAllToPDF} style={styles.exportButton}>
          <MaterialIcons
            name="file-download"
            size={24}
            color="#555
          "
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.add}
        onPress={() => router.push("/createorder")}
      >
        <MaterialIcons name="add" size={35} color="rgb(70, 125, 168)" />
      </TouchableOpacity>

      {loading ? (
        <Loader />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {orderLists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="list-alt" size={70} color="#ccc" />
              <Text style={styles.emptyText}>No order lists created yet</Text>
              <Text style={styles.emptySubText}>
                Create your first order list
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {orderLists.map((orderList, index) => (
                <OrderListCard
                  key={orderList.id}
                  orderList={orderList}
                  serialNumber={index + 1}
                  onUpdate={loadOrderLists}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  add: {
    display: "flex",
    position: "absolute",
    right: 30,
    bottom: 30,
    backgroundColor: "rgb(230, 244, 255)",
    borderRadius: 500,
    padding: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(70, 126, 168, 0.39)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
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
    paddingVertical: 16,
    zIndex: 1000,
    gap: 10,
  },
  topbarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  exportButton: {
    padding: 5,
  },
  scrollContainer: {
    minHeight: "100%",
    alignItems: "center",
    padding: 18,
  },
  listContainer: {
    flex: 1,
    width: "100%",
    gap: 14,
    marginTop: 60,
    marginBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
