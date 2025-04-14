import { ScrollView, SafeAreaView, View } from "react-native";
import HomePage from "~/app/user/Home/index";

export default function Screen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1">
          <HomePage />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
