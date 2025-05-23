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
import { SafeAreaView, Platform } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import { OrderProvider } from "./user/Order/OrderContext";
import { auth, db } from "~/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { CartProvider } from "./user/Cart/CartContext";
import '../lib/translations/i18n';
import useMoMoDeepLink from '~/lib/useMoMoDeepLink';

const LIGHT_THEME = { ...DefaultTheme, colors: NAV_THEME.light };
const DARK_THEME = { ...DarkTheme, colors: NAV_THEME.dark };

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = React.useState(false);
  const [userRole, setUserRole] = React.useState<number | null>(null);
  const [statusBarStyle, setStatusBarStyle] = React.useState<"light" | "dark">(
    isDarkColorScheme ? "light" : "dark"
  );

  // Sử dụng hook để thiết lập deeplink
  const { isSetup } = useMoMoDeepLink();

  // Handle theme
  React.useEffect(() => {
    setAndroidNavigationBar(colorScheme);
    setStatusBarStyle(colorScheme === "dark" ? "light" : "dark");
    setIsColorSchemeLoaded(true);
  }, [colorScheme]);

  // Handle authentication and get user role
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

  React.useEffect(() => {
    if (isSetup) {
      console.log("MoMo DeepLink setup complete");
    }
  }, [isSetup]);

  if (!isColorSchemeLoaded || !isAuthLoaded) return null;

  console.log("Checking if _layout.tsx exists");

  return (
    <OrderProvider>
      <CartProvider>
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
          <StatusBar style={statusBarStyle} animated={true} />
          <SafeAreaView className="flex-1 ">
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="Admin" options={{ headerShown: false }} />
              <Stack.Screen name="user" options={{ headerShown: false }} />
            </Stack>
          </SafeAreaView>
        </ThemeProvider>
      </CartProvider>
    </OrderProvider>
  );
}
