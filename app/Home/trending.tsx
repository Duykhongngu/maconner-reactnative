import { useRouter } from "expo-router";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { trendingProducts } from "~/app/Data/product";

function Trending() {
  const router = useRouter();

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Text style={styles.title}>Trending Now</Text>
        <View style={styles.grid}>
          {trendingProducts.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                router.push({
                  pathname: "/Products/[id]",
                  params: { id: item.id.toString() },
                })
              }
              style={styles.card}
            >
              <Image source={item.img as any} style={styles.image} />
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.price}>$ {item.price} USD</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "orange",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    width: "48%", // Để tạo lưới 2 cột
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 150, // Hoặc kích thước phù hợp với thiết kế của bạn
    borderRadius: 8,
  },
  description: {
    height: 90,
    fontWeight: "600",
    marginTop: 8,
    fontSize: 16,
    color: "black",
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "orange",
  },
});

export default Trending;
