import { SafeAreaView, View } from "react-native";
import Background from "./background";
import Trending from "./trending";
import { CartProvider } from "../Cart/CartContext";

function HomePage() {
  return (
    <CartProvider>
      <SafeAreaView>
        <View>
          <View>
            <Background />
          </View>
          <View>
            <Trending />
          </View>
        </View>
      </SafeAreaView>
    </CartProvider>
  );
}

export default HomePage;
