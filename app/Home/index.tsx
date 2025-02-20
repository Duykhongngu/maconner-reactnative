import { SafeAreaView, StyleSheet, View } from "react-native";
import Background from "./background";
import Trending from "./trending";
import { CartProvider } from "../Cart/CartContext";
import MothersSlider from "./sliderShow";
import ShopAll from "./shopAll";
import CarVisor from "./carViso";
import BottleLamp from "./bottleLamp";
import Recipient from "./recipient";
import ByProducts from "./byProducts";

function HomePage() {
  return (
    <SafeAreaView style={styles.container}>
      <CartProvider>
        <View>
          <View>
            <Background />
          </View>
          <View>
            <MothersSlider />
          </View>
          <View>
            <Trending />
          </View>
          <View>
            <ShopAll />
          </View>
          <View>
            <CarVisor />
          </View>
          <View>
            <BottleLamp />
          </View>
          <View>
            <Recipient />
          </View>
          <View>
            <ByProducts />
          </View>
        </View>
      </CartProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
export default HomePage;
