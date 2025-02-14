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

function Trending() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView className="flex-1 px-4">
      <View className="flex-1">
        <Text className="text-2xl font-bold text-center text-orange-500 mb-4">
          Trending Now
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {trendingProducts.map((item) => {
            // ✅ Kiểm tra giá trị img

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/Products/${item.id}`)}
                className={`bg-white rounded-lg p-2 mb-4 ${
                  width < 768 ? "w-[48%]" : "w-[30%]"
                }`}
              >
                <Image
                  source={
                    typeof item.img === "string" ? { uri: item.img } : item.img
                  }
                  className="w-full h-40 rounded-lg"
                />
                <Text className="mt-2 font-semibold text-base h-20 text-black">
                  {item.description}
                </Text>
                <Text className="text-lg font-bold text-orange-500">
                  $ {item.price} USD
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View>
          <Button variant={"secondary"} style={styles.showMoreButton}>
            <Text className="text-black text-xl font-normal">Show More</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  showMoreButton: {
    backgroundColor: "rgb(228, 89, 39)0",

    justifyContent: "center",
    alignItems: "center",
  },
});
export default Trending;
