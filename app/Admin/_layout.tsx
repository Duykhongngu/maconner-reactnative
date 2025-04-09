import { Stack } from "expo-router";
import { SafeAreaView } from "react-native";
import AdminHeader from "~/app/Header/headerAdmin";

export default function AdminLayout() {
  return (
    <SafeAreaView className="flex-1 ">
      <Stack
        screenOptions={{
          headerBackVisible: false,
          headerTitle: () => <AdminHeader />,
          headerLeft: () => null,
          headerRight: () => null,
        }}
      >
        <Stack.Screen name="home" />
        <Stack.Screen name="AccountsManage/Accounts" />
        <Stack.Screen name="OrderManage/OrderManager" />
        <Stack.Screen name="ProductsManagement/products" />
        <Stack.Screen name="CategoryProductManagement/CategoryProduct" />
        <Stack.Screen name="ReviewManagements/ReviewManagement" />
      </Stack>
    </SafeAreaView>
  );
}
