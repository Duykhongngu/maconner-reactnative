import { useRouter } from "expo-router";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { trendingProducts } from "~/app/Data/product";

function Trending() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={{ flex: 1, paddingHorizontal: 16 }}>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            color: "#f97316",
            marginBottom: 16,
          }}
        >
          Trending Now
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {trendingProducts.map((item) => {
            console.log("Image source:", item.img); // ✅ Kiểm tra giá trị img

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/Products/${item.id}`)}
                style={{
                  backgroundColor: "white",
                  borderRadius: 8,
                  padding: 8,
                  marginBottom: 16,
                  width: width < 768 ? "48%" : "30%",
                }}
              >
                <Image
                  source={item.img}
                  style={{ width: "100%", height: 160, borderRadius: 8 }}
                />
                <Text
                  style={{
                    marginTop: 8,
                    fontWeight: "600",
                    fontSize: 16,
                    height: 60,
                    color: "black",
                  }}
                >
                  {item.description}
                </Text>
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", color: "#f97316" }}
                >
                  $ {item.price} USD
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default Trending;
