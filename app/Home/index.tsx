import { SafeAreaView, StyleSheet, View } from "react-native";
import Background from "./background";
import Trending from "./trending";
import { CartProvider } from "../Cart/CartContext";
import MothersSlider from "./sliderShow";

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
