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
} from "react-native";

import { OrderList } from "@/types";

import Loader from "@/components/Loader";
import OrderListCard from "@/components/OrderListCard";
import { getAllOrderLists } from "@/utils/orderListDb";

export default function OrderLists() {
  const navigation = useNavigation();
  const [orderLists, setOrderLists] = useState<OrderList[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrderLists = useCallback(async () => {
    try {
      setLoading(true);
      const orderListsData = await getAllOrderLists();
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

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-sharp" size={24} color="#333" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#333",
            flex: 1,
            textAlign: "center",
            paddingRight: 40,
          }}
        >
          Order Lists
        </Text>
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
            <View
              style={{
                flex: 1,
                width: "100%",
                gap: 14,
                marginTop: 60,
                marginBottom: 100,
              }}
            >
              {orderLists.map((orderList) => (
                <OrderListCard key={orderList.id} orderList={orderList} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, position: "relative" },
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
    paddingHorizontal: 10,
    paddingVertical: 16,
    zIndex: 1000,
    gap: 10,
  },
  scrollContainer: {
    minHeight: "100%",
    alignItems: "center",
    padding: 18,
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
