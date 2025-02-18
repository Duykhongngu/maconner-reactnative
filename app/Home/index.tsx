import { SafeAreaView, View } from "react-native";
import Background from "./background";
import Trending from "./trending";
import { CartProvider } from "../Cart/CartContext";

function HomePage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CartProvider>
        <View>
          <View>
            <Background />
          </View>
          <View>
            <Trending />
          </View>
        </View>
      </CartProvider>
    </SafeAreaView>
  );
}

export default HomePage;
