import { Stack } from "expo-router";
import AdminHeader from "~/app/Header/headerAdmin";
import { View } from "react-native";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerBackVisible: false,
        headerTitle: () => <AdminHeader />,
        headerLeft: () => null,
        headerRight: () => null,
      }}
    >
      <Stack.Screen
        name="home"
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="AccountsManage/Accounts"
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="OrderManage/OrderManager"
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ProductsManagement/products"
        options={{
          headerShown: true,
        }}
      />
    </Stack>
  );
}
