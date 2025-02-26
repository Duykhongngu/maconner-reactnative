"use client";

import "~/global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { SafeAreaView } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import { OrderProvider } from "./user/Checkout/OrderContext";
import { auth, db } from "~/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import CustomHeader from "./components/CustomHeader";
import { CartProvider } from "./user/Cart/CartContext";

const LIGHT_THEME = { ...DefaultTheme, colors: NAV_THEME.light };
const DARK_THEME = { ...DarkTheme, colors: NAV_THEME.dark };

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = React.useState(false);
  const [userRole, setUserRole] = React.useState<number | null>(null);

  // Xử lý theme
  React.useEffect(() => {
    setAndroidNavigationBar(colorScheme);
    setIsColorSchemeLoaded(true);
  }, [colorScheme]);

  // Xử lý xác thực và lấy vai trò người dùng
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "accounts", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role from Firestore:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setIsAuthLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  if (!isColorSchemeLoaded || !isAuthLoaded) return null;

  return (
    <OrderProvider>
      <CartProvider>
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
          <StatusBar
            backgroundColor="transparent"
            networkActivityIndicatorVisible
            style={isDarkColorScheme ? "light" : "dark"}
            translucent
          />
          <SafeAreaView
            style={{
              flex: 1,
              backgroundColor: isDarkColorScheme ? "#000" : "#fff",
            }}
          >
            <Stack
              screenOptions={{
                headerBackVisible: false,
                headerShown: false,
              }}
            >
              {/* Hiển thị màn hình dựa trên userRole */}
              {userRole === null && (
                <Stack.Screen
                  name="index"
                  options={{
                    headerShown: false,
                    headerTitleAlign: "center",
                    headerTitle: undefined,
                  }}
                />
              )}
              {userRole === 1 && (
                <Stack.Screen name="user" options={{ headerShown: false }} />
              )}
              {userRole === 0 && (
                <Stack.Screen name="admin" options={{ headerShown: false }} />
              )}
            </Stack>
          </SafeAreaView>
        </ThemeProvider>
      </CartProvider>
    </OrderProvider>
  );
}
