import { SafeAreaView, StyleSheet, View } from "react-native";
import Background from "./background";
import Trending from "./trending";

// import ByProducts from "./byProducts";
// import HappyCustomers from "./HappyCustomer";

function HomePage() {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <View>
          <Background />
        </View>

        <View>
          <Trending />
        </View>
        {/* <View>
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
        <HappyCustomers /> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
  },
});
export default HomePage;
