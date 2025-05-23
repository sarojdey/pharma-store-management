import AntDesign from "@expo/vector-icons/AntDesign";
import { SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Partial<
  Record<SymbolViewProps["name"], ComponentProps<typeof AntDesign>["name"]>
>;

export type IconSymbolName = keyof typeof MAPPING;

const MAPPING: IconMapping = {
  house: "home",
  storefront: "profile",
  cart: "shoppingcart",
  bell: "notification",
  "chart.bar": "barschart",
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  const iconName = MAPPING[name]!;
  return <AntDesign color={color} size={size} name={iconName} style={style} />;
}
