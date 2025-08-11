import ErrorLogCard from "@/components/ErrorLogCard";
import { useErrorLog } from "@/contexts/ErrorLogContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "expo-router";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ErrorLogsPage() {
  const navigation = useNavigation();
  const { errorLogs, clearLogs } = useErrorLog();

  const handleClearLogs = () => {
    Alert.alert(
      "Clear Error Logs",
      "Are you sure you want to clear all error logs? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: clearLogs,
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topbar}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-sharp" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Error Logs</Text>
          {errorLogs.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearLogs}
            >
              <MaterialIcons name="delete-outline" size={20} color="#d32f2f" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {errorLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="check-circle-outline"
              size={70}
              color="#4caf50"
            />
            <Text style={styles.emptyText}>No Error Logs</Text>
            <Text style={styles.emptySubText}>
              Your app is running smoothly!{"\n"}Error logs will appear here
              when issues occur.
            </Text>
          </View>
        ) : (
          <View style={styles.logsContainer}>
            {errorLogs.map((errorLog) => (
              <ErrorLogCard key={errorLog.id} errorLog={errorLog} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderBottomColor: "#ccc",
    borderTopColor: "#ccc",
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  clearButton: {
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.3)",
  },
  scrollContainer: {
    minHeight: "100%",
    paddingTop: 20,
    paddingBottom: 20,
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
    marginTop: 12,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },
  logsContainer: {
    gap: 14,
  },
});
