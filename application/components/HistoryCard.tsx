import { History } from "@/types";
import AntDesign from "@expo/vector-icons/AntDesign";
import { StyleSheet, Text, View } from "react-native";

export default function HistoryCard({ history }: { history: History }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "Z");
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.operationText}>{history.operation}</Text>
      </View>

      <View style={styles.infoRow}>
        <AntDesign
          style={{ marginTop: 3.5 }}
          name="calendar"
          size={16}
          color="rgb(31, 98, 149)"
        />
        <Text style={styles.infoText}>{formatDate(history.createdAt)}</Text>
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
    gap: 4,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  operationText: {
    fontSize: 17,
    fontWeight: "600",
    color: "rgb(25, 76, 116)",
  },
  infoRow: {
    flexDirection: "row",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    flexShrink: 1,
  },
});
