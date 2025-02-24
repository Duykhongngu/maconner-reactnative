"use client";

import "~/global.css";
import {
  DarkTheme,
  DefaultTheme,
  type Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Platform, SafeAreaView } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import SiteHeader from "~/app/Header/header";
import { CartProvider } from "./Cart/CartContext";
import { OrderProvider } from "./Checkout/OrderContext";
import { auth } from "~/firebase.config";
import { onAuthStateChanged } from "firebase/auth";

const LIGHT_THEME: Theme = { ...DefaultTheme, colors: NAV_THEME.light };
const DARK_THEME: Theme = { ...DarkTheme, colors: NAV_THEME.dark };

const MemoizedSiteHeader = React.memo(SiteHeader);

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const hasMounted = React.useRef(false);
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);

  const useIsomorphicLayoutEffect =
    Platform.OS === "web" && typeof window === "undefined"
      ? React.useEffect
      : React.useLayoutEffect;

  const renderHeader = React.useCallback(() => <MemoizedSiteHeader />, []);

  const safeAreaStyle = React.useMemo(
    () => ({ flex: 1, backgroundColor: isDarkColorScheme ? "#000" : "#fff" }),
    [isDarkColorScheme]
  );

  useIsomorphicLayoutEffect(() => {
    if (Platform.OS === "web" && !hasMounted.current) {
      document.documentElement.classList.add("bg-background");
    }
    setAndroidNavigationBar(colorScheme);
    if (!hasMounted.current) {
      setIsColorSchemeLoaded(true);
      hasMounted.current = true;
    }
  }, [colorScheme]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
          <SafeAreaView style={safeAreaStyle}>
            <Stack
              screenOptions={{
                headerBackVisible: false,
                headerTitleAlign: "center",
                headerTitle: renderHeader,
                headerLeft: () => null,
                headerRight: () => null,
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
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
          </SafeAreaView>
        </ThemeProvider>
      </CartProvider>
    </OrderProvider>
  );
}
