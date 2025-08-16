import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TopBarProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;

  leftComponent?: React.ReactNode;
  centerComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  bottomComponent?: React.ReactNode; // For additional rows like action buttons

  position?: "relative" | "absolute";
  customStyle?: object;
}

export default function TopBar({
  title,
  showBackButton = true,
  onBackPress,
  leftComponent,
  centerComponent,
  rightComponent,
  bottomComponent,
  position = "relative",
  customStyle,
}: TopBarProps) {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.topbar, { position }, customStyle]}>
      {/* Main header row */}
      <View style={styles.headerRow}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {leftComponent ||
            (showBackButton && (
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back-sharp" size={24} color="#535353ff" />
              </TouchableOpacity>
            ))}
        </View>

        {/* Center Section */}
        <View style={styles.centerSection}>
          {centerComponent ||
            (title && <Text style={styles.title}>{title}</Text>)}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>{rightComponent}</View>
      </View>

      {/* Optional bottom row for action buttons */}
      {bottomComponent && (
        <View style={styles.bottomRow}>{bottomComponent}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    top: 0,
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderBottomColor: "#c3c3c3a6",
    borderTopColor: "#c3c3c3a6",
    zIndex: 1000,
  },
  headerRow: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  bottomRow: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  leftSection: {
    minWidth: 40,
    alignItems: "flex-start",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 15,
  },
  rightSection: {
    minWidth: 40,
    alignItems: "flex-end",
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#535353ff",
    textAlign: "center",
  },
});
