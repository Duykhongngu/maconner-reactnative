import { useRouter } from "expo-router";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList,
} from "react-native";
import { products } from "../../Data/product";
import { useWindowDimensions } from "react-native";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";

function Recipient() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDarkColorScheme } = useColorScheme();

  const bgColor = isDarkColorScheme ? "#121212" : "#FFFFFF";
  const textColor = isDarkColorScheme ? "#E5E7EB" : "#1E1E1E";
  const cardBgColor = isDarkColorScheme ? "#1E1E1E" : "#FFFFFF";
  const borderColor = isDarkColorScheme ? "#374151" : "#E5E7EB";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: "#F97316" }]}>
          Shop By Recipients
        </Text>
        <View style={styles.productContainer}>
          {products.trendingProducts.map((item) => {
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/user/Products/${item.id}`)}
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
                <Text style={[styles.productDescription, { color: textColor }]}>
                  {item.name}
                </Text>
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
    flex: 1,
    marginVertical: 10,
  },
  productContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  productCard: {
    borderRadius: 9999,
    padding: 16,
    width: "48%",
  },
  productImage: {
    width: "100%",
    height: 130,
    borderRadius: 9999,
  },
  productDescription: {
    marginTop: 8,
    fontWeight: "bold",
    lineHeight: 20,
    fontSize: 14,
    textAlign: "center",
  },
  showMoreContainer: {
    alignItems: "center",
  },
  showMoreButton: {
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 9999,
    width: "40%",
    height: 50,
  },
  showMoreText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default Recipient;
