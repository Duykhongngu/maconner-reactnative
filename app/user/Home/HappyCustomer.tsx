import { useRouter } from "expo-router";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  useColorScheme,
} from "react-native";
import { Button } from "~/components/ui/button";
import { StyleSheet } from "react-native";

const trendingProducts = [
  {
    id: 1,
    name: "Product 1",
    description:
      "Drive Safe I F*cking Love You - Funny Gifts For Husband, Wife",
    price: "$19.95 USD",
    img: require("~/assets/images/Happy1.png"),
    link: "/valentines",
  },
  {
    id: 2,
    name: "Product 2",
    description:
      "I Licked It So It's Mine Naughty Couple - Personalized Men's Boxer Briefs",
    price: "$26.95 USD",
    img: require("~/assets/images/Happy2.png"),
    link: "/valentines",
  },
  {
    id: 3,
    name: "Product 3",
    description: "Friendship Puzzle Hearts - Personalized Heart Puzzle Name",
    price: "$26.95 USD",
    img: require("~/assets/images/Happy3.png"),
    link: "/valentines",
  },
  {
    id: 4,
    name: "Product 4",
    description: "F#ck Valentine's Day, I Love You Everyday - Personalized Mug",
    price: "$19.95 USD",
    img: require("~/assets/images/Happy4.png"),
    link: "/valentines",
  },
  {
    id: 5,
    name: "Product 5",
    description:
      "I Have An Angel Watching Over Me - Personalized Photo Car Ornament",
    price: "$26.95 USD",
    img: require("~/assets/images/Happy5.png"),
    link: "/valentines",
  },
  {
    id: 6,
    name: "Product 6",
    description: "A Girl & Her Dogs Has Unbreakable Bond - Personalized Mug",
    price: "$26.95 USD",
    img: require("~/assets/images/Happy6.png"),
    link: "/valentines",
  },
];

export default function HappyCustomers() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDarkColorScheme = colorScheme === "dark";

  const bgColor = isDarkColorScheme ? "#121212" : "#FFFFFF";
  const textColor = isDarkColorScheme ? "#E5E7EB" : "#1E1E1E";
  const cardBgColor = isDarkColorScheme ? "#1E1E1E" : "#FFFFFF";
  const borderColor = isDarkColorScheme ? "#374151" : "#E5E7EB";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title]}>Happy Customers</Text>
          <Text style={[styles.description, { color: textColor }]}>
            Unwrap Happiness with Every Gift. Join the Macorner Family of
            Delighted Shoppers!
          </Text>
          <Button
            onPress={() => router.push(`/Collections/NightLight` as any)}
            variant="secondary"
            style={styles.button}
          >
            <Text style={[styles.buttonText, { color: textColor }]}>
              {" "}
              Show More
            </Text>
          </Button>
        </View>

        <View style={styles.productContainer}>
          {trendingProducts.map((item) => {
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.productCard,
                  { backgroundColor: cardBgColor, borderColor },
                ]}
              >
                <Image
                  source={
                    typeof item.img === "string" ? { uri: item.img } : item.img
                  }
                  style={styles.productImage}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    flexDirection: "column",
    fontFamily: "Poppins",
  },
  headerContainer: {
    maxWidth: 960,
    alignSelf: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    fontFamily: "Poppins",
    marginBottom: 8,
    color: "#f7921f",
  },
  description: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
    fontFamily: "Poppins",
  },
  button: {
    width: "50%",
    borderRadius: 24,
    backgroundColor: "#f7921f",
  },
  buttonText: {
    color: "black",
  },
  productContainer: {
    margin: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  productCard: {
    borderRadius: 10,
    marginBottom: 16,
    width: "48%",
    borderWidth: 1,
  },
  productImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    resizeMode: "cover",
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  productDescription: {
    fontSize: 14,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
