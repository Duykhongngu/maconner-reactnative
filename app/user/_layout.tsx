import { Stack } from "expo-router";
import { SafeAreaView } from "react-native";
import SiteHeader from "~/app/Header/header";

export default function UserLayout() {
  return (
    <SafeAreaView className="flex-1">
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
          headerBackVisible: false,
          headerTitle: () => <SiteHeader />,
          headerLeft: () => null,
          headerRight: () => null,
        }}
      >
        <Stack.Screen name="home" />
        <Stack.Screen name="Auth/Profile" />
        <Stack.Screen name="Products/[id]" />
        <Stack.Screen name="Cart/CartPages" />
        <Stack.Screen name="Order/OrderStatus" />
        <Stack.Screen name="Order/OrderDetails" />
      </Stack>
    </SafeAreaView>
  );
}
