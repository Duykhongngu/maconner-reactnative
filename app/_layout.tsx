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
import { Platform, StyleSheet, TouchableOpacity, Text } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { PortalHost } from "@rn-primitives/portal";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import SiteHeader from "~/app/Header/header";
import { CartProvider } from "./Cart/CartContext";
import { OrderProvider } from "./Checkout/OrderContext";
import { useNavigation } from "@react-navigation/native";

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
  const hasMounted = React.useRef(false);
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
  const navigation = useNavigation();

  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }

    if (Platform.OS === "web") {
      document.documentElement.classList.add("bg-background");
    }
    setAndroidNavigationBar(colorScheme);
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }

  return (
    <OrderProvider>
      <CartProvider>
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
          <StatusBar
            animated={true}
            backgroundColor={isDarkColorScheme ? "transparent" : "white"}
            networkActivityIndicatorVisible
            style={isDarkColorScheme ? "light" : "dark"}
            translucent
          />
          <Stack
            screenOptions={{
              headerBackVisible: false,
              headerTitleAlign: "center",
            }}
          >
            {[
              "index",
              "Home/sliderShow",
              "Products/[id]",
              "Cart/CartPages",
              "Checkout/Checkout",
              "Checkout/OrderStatus",
              "Checkout/OrderDetails",
            ].map((screen) => (
              <Stack.Screen
                key={screen}
                name={screen}
                options={{
                  headerTitle: () => <MemoizedSiteHeader />,
                  headerLeft: () => null,
                  headerRight: () => null,
                }}
              />
            ))}
          </Stack>

          <PortalHost />
        </ThemeProvider>
      </CartProvider>
    </OrderProvider>
  );
}

const useIsomorphicLayoutEffect =
  Platform.OS === "web" && typeof window === "undefined"
    ? React.useEffect
    : React.useLayoutEffect;
