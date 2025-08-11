import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ErrorLog } from "@/contexts/ErrorLogContext";

interface ErrorLogCardProps {
  errorLog: ErrorLog;
}

const ErrorLogCard: React.FC<ErrorLogCardProps> = ({ errorLog }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="error-outline" size={20} color="#d32f2f" />
        <Text style={styles.timestamp}>{formatTime(errorLog.timestamp)}</Text>
      </View>
      <Text style={styles.errorMessage}>{errorLog.message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#d32f2f",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  errorMessage: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});

export default ErrorLogCard;
