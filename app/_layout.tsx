"use client";

import "~/global.css";
import {
  DarkTheme,
  DefaultTheme,
  type Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname, useRouter } from "expo-router";
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

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

const MemoizedSiteHeader = React.memo(SiteHeader);

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const pathname = usePathname();
  const hasMounted = React.useRef(false);
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = React.useState(false); // Thêm trạng thái xác thực
  const [user, setUser] = React.useState<any>(null);
  const router = useRouter();

  const useIsomorphicLayoutEffect =
    Platform.OS === "web" && typeof window === "undefined"
      ? React.useEffect
      : React.useLayoutEffect;

  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) return;

    if (Platform.OS === "web") {
      document.documentElement.classList.add("bg-background");
    }
    setAndroidNavigationBar(colorScheme);
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, []);

  return (
    <OrderProvider>
      <CartProvider>
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
          <StatusBar
            animated={true}
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
                headerTitleAlign: "center",
              }}
            >
              <Stack.Screen
                name="Auth/Profile"
                options={{
                  headerTitle: () => <MemoizedSiteHeader />,
                  headerLeft: () => null,
                  headerRight: () => null,
                }}
              />
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="home"
                options={{
                  headerTitle: () => <MemoizedSiteHeader />,
                  headerLeft: () => null,
                  headerRight: () => null,
                }}
              />
              <Stack.Screen
                name="Home/sliderShow"
                options={{
                  headerTitle: () => <MemoizedSiteHeader />,
                  headerLeft: () => null,
                  headerRight: () => null,
                }}
              />
              <Stack.Screen
                name="Products/[id]"
                options={{
                  headerTitle: () => <MemoizedSiteHeader />,
                  headerLeft: () => null,
                  headerRight: () => null,
                }}
              />
              <Stack.Screen
                name="Cart/CartPages"
                options={{
                  headerTitle: () => <MemoizedSiteHeader />,
                  headerLeft: () => null,
                  headerRight: () => null,
                }}
              />
              <Stack.Screen
                name="Checkout/Checkout"
                options={{
                  headerTitle: () => <MemoizedSiteHeader />,
                  headerLeft: () => null,
                  headerRight: () => null,
                }}
              />
              <Stack.Screen
                name="Checkout/OrderStatus"
                options={{
                  headerTitle: () => <MemoizedSiteHeader />,
                  headerLeft: () => null,
                  headerRight: () => null,
                }}
              />
              <Stack.Screen
                name="Checkout/OrderDetails"
                options={{
                  headerTitle: () => <MemoizedSiteHeader />,
                  headerLeft: () => null,
                  headerRight: () => null,
                }}
              />
              <Stack.Screen
                name="Collections/NightLight"
                options={{
                  headerTitle: () => <MemoizedSiteHeader />,
                  headerLeft: () => null,
                  headerRight: () => null,
                }}
              />
            </Stack>
          </SafeAreaView>
        </ThemeProvider>
      </CartProvider>
    </OrderProvider>
  );
}
