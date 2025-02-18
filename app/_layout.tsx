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
import { Platform, StyleSheet } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { PortalHost } from "@rn-primitives/portal";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import SiteHeader from "~/app/Header/header";
import { CartProvider } from "./Cart/CartContext";
import { OrderProvider } from "./Checkout/OrderContext";

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export default function RootLayout() {
  const hasMounted = React.useRef(false);
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }

    if (Platform.OS === "web") {
      // Adds the background color to the html element to prevent white background on overscroll.
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
            <Stack.Screen
              name="index"
              options={{
                headerTitle: () => <SiteHeader />,
                headerLeft: () => null,
                headerRight: () => null,
              }}
            />

            <Stack.Screen
              name="Home/sliderShow"
              options={{
                headerTitle: () => <SiteHeader />,
                headerLeft: () => null,
                headerRight: () => null,
              }}
            />
            <Stack.Screen
              name="Products/[id]"
              options={{
                headerTitle: () => <SiteHeader />,
                headerLeft: () => null,
                headerRight: () => null,
              }}
            />
            <Stack.Screen
              name="Cart/CartPages"
              options={{
                headerTitle: () => <SiteHeader />,
                headerLeft: () => null,
                headerRight: () => null,
              }}
            />
            <Stack.Screen
              name="Checkout/Checkout"
              options={{
                headerTitle: () => <SiteHeader />,
                headerLeft: () => null,
                headerRight: () => null,
              }}
            />
            <Stack.Screen
              name="Checkout/OrderStatus"
              options={{
                headerTitle: () => <SiteHeader />,
                headerLeft: () => null,
                headerRight: () => null,
              }}
            />
            <Stack.Screen
              name="Checkout/OrderDetails"
              options={{
                headerTitle: () => <SiteHeader />,
                headerLeft: () => null,
                headerRight: () => null,
              }}
            />
          </Stack>

          <PortalHost />
        </ThemeProvider>
      </CartProvider>
    </OrderProvider>
  );
}

// const styles = StyleSheet.create({
//   header: {
//     height: 100,
//     backgroundColor: isDarkColorScheme ? "#121212" : "#FFFFFF", // add this line
//   },
// });

const useIsomorphicLayoutEffect =
  Platform.OS === "web" && typeof window === "undefined"
    ? React.useEffect
    : React.useLayoutEffect;
