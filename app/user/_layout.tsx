import { Stack, Tabs } from "expo-router";
import SiteHeader from "~/app/Header/header";

export default function UserLayout() {
  return (
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
      <Stack.Screen name="Home/sliderShow" />
      <Stack.Screen name="Products/[id]" />
      <Stack.Screen name="Cart/CartPages" />
      <Stack.Screen name="Checkout/Checkout" />
      <Stack.Screen name="Checkout/OrderStatus" />
      <Stack.Screen name="Checkout/OrderDetails" />
      <Stack.Screen name="Collections/NightLight" />
      <Stack.Screen name="Collections/DrinkWare" />
    </Stack>
  );
}
