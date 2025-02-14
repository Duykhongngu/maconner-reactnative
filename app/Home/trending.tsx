import { useRouter } from "expo-router";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { trendingProducts } from "~/app/Data/product";
import { useWindowDimensions } from "react-native";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";

function Trending() {
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
        <Text style={[styles.title, { color: "#F97316" }]}>Trending Now</Text>
        <View style={styles.productContainer}>
          {trendingProducts.map((item) => {
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/Products/${item.id}`)}
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
                  {item.description}
                </Text>
                <Text style={styles.productPrice}>$ {item.price} USD</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View>
          <Button variant="secondary" style={styles.showMoreButton}>
            <Text style={[styles.showMoreText, { color: textColor }]}>
              Show More
            </Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  productContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    width: "48%",
  },
  productImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
  },
  productDescription: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    height: 60,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F97316",
  },
  showMoreButton: {
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  showMoreText: {
    fontSize: 18,
    fontWeight: "600",
  },
});

export default Trending;
