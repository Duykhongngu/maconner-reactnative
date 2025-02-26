import { Stack, Tabs } from "expo-router";
import AdminHeader from "~/app/Header/headerAdmin";

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
      <Stack.Screen name="home" />
      {/* <Stack.Screen name="dashboard" />
      <Stack.Screen name="users" /> */}
    </Stack>
  );
}
