import { Link, Stack } from "expo-router";
import { SafeAreaView, View } from "react-native";
import { Text } from "~/components/ui/text";

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 justify-center items-center">
        <Text className="text-xl font-bold mb-4">Trang này không tồn tại!</Text>

        <Link href="/user/home" className="mt-4">
          <Text className="text-blue-500 text-lg">Quay về trang chủ</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
