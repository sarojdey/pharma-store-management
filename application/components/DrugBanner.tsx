import { StyleSheet, Image, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function DrugBanner({
  drugName,
  drugType,
}: {
  drugName: string;
  drugType: string;
}) {
  const colorPalettes = [
    {
      dark: "#1b4039",
      primary: "#54c2ae",
      light: "#87c8bc",
      accent: "#3c8b7d",
    },
    {
      dark: "#1b1b40",
      primary: "#5654c2",
      light: "#8887c8",
      accent: "#3d3c8b",
    },
    {
      dark: "#401b37",
      primary: "#c254aa",
      light: "#c887bc",
      accent: "#8b3c7a",
    },
    {
      dark: "#402a1b",
      primary: "#c28254",
      light: "#c8a287",
      accent: "#8b5d3c",
    },
    {
      dark: "#29401b",
      primary: "#7ec254",
      light: "#a0c887",
      accent: "#5a8b3c",
    },
    {
      dark: "hsl(0, 0.00%, 25.50%)",
      primary: "hsl(0, 0.00%, 39.60%)",
      light: "hsl(95, 0%, 68%)",
      accent: "hsl(95, 0%, 39%)",
    },
  ];

  type DrugType = "Pills" | "Syrup" | "Syringe";

  const typeImageMap: Record<DrugType, any> = {
    Pills: require("../assets/images/bottle.png"),
    Syrup: require("../assets/images/syrup.png"),
    Syringe: require("../assets/images/syringe.png"),
  };

  const randomNumber = Math.floor(Math.random() * 5);
  return (
    <LinearGradient
      colors={[colorPalettes[3].dark, colorPalettes[3].primary]}
      style={styles.container}
    >
      <LinearGradient
        colors={[colorPalettes[3].light, colorPalettes[3].accent]}
        style={styles.bgUpper}
      ></LinearGradient>
      <View style={styles.imageContainer}>
        <Image
          source={
            drugType === "Syrup" || drugType === "Syringe"
              ? typeImageMap[drugType as DrugType]
              : typeImageMap["Pills"]
          }
          style={styles.image}
          resizeMode="contain"
        />
        {drugType !== "Syringe" && (
          <Text style={styles.overlayText}>{drugName}</Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    aspectRatio: 1,
    width: "100%",
    position: "relative",
    borderRadius: 10,
  },
  imageContainer: {
    height: "100%",
    width: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  bgUpper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "70%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },

  image: {
    height: "100%",
    width: "100%",
  },
  overlayText: {
    position: "absolute",
    color: "black",
    maxWidth: "45%",
    height: "100%",
    textAlignVertical: "center",
    paddingTop: 60,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    flexWrap: "wrap",
  },
});
