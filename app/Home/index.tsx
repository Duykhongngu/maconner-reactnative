import { SafeAreaView, View } from "react-native";
import Background from "./background";
import Trending from "./trending";

function HomePage() {
  return (
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
  );
}

export default HomePage;
