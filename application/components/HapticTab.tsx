import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import React from "react";

export function HapticTab({
  onPress,
  onLongPress,
  onPressIn,
  accessibilityLabel,
  accessibilityRole,
  children,
  style,
  hitSlop,
}: BottomTabBarButtonProps) {
  return (
    <Pressable
      android_ripple={{
        color: "transparent",
        borderless: false,
        radius: 0,
      }}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={style}
      hitSlop={hitSlop}
    >
      {children}
    </Pressable>
  );
}
