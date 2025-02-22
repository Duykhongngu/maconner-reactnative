import { SafeAreaView, StyleSheet, View } from "react-native";
import Background from "./background";
import Trending from "./trending";
import MothersSlider from "./sliderShow";
import ShopAll from "./shopAll";
import CarVisor from "./carViso";
import BottleLamp from "./bottleLamp";
import Recipient from "./recipient";
import ByProducts from "./byProducts";
import HappyCustomers from "./HappyCustomer";
import Footer from "../Footer/Footer";

function HomePage() {
  return (
    <SafeAreaView style={styles.container}>
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
      <View>
        <HappyCustomers />
      </View>
      <View>
        <Footer />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
export default HomePage;
