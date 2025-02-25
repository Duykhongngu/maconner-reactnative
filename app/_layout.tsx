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
import { auth, db } from "~/firebase.config"; // Nhập db từ firebase.config
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Nhập Firestore utilities

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
  const [userRole, setUserRole] = React.useState<number | null>(null); // Lưu role của user

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

  // Lấy thông tin user và role từ Firestore
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "accounts", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role); // Cập nhật role
          } else {
            setUserRole(null); // Không tìm thấy role
          }
        } catch (error) {
          console.error("Error fetching user role from Firestore:", error);
          setUserRole(null); // Đặt role là null nếu có lỗi
        }
      } else {
        setUser(null);
        setUserRole(null); // Reset role khi không có user
      }
      setIsAuthLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  // Chờ đến khi cả màu sắc và auth được tải
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
                headerTitle: renderHeader, // Không sử dụng renderHeader mặc định
                headerLeft: () => null,
                headerRight: () => null,
              }}
            >
              {/* Màn hình chung cho tất cả (không cần đăng nhập hoặc role) */}
              <Stack.Screen name="index" options={{ headerShown: false }} />

              {/* Stack cho user (role = 1) với renderHeader */}
              {user && userRole === 1 && (
                <Stack
                  screenOptions={{
                    headerBackVisible: false,
                    headerTitleAlign: "center",
                    headerTitle: renderHeader, // Chỉ sử dụng renderHeader cho user
                    headerLeft: () => null,
                    headerRight: () => null,
                  }}
                >
                  <Stack.Screen name="home" options={{ headerShown: true }} />
                  <Stack.Screen
                    name="Auth/Profile"
                    options={{ headerShown: true }}
                  />
                  <Stack.Screen
                    name="Home/sliderShow"
                    options={{ headerShown: true }}
                  />
                  <Stack.Screen
                    name="Products/[id]"
                    options={{ headerShown: true }}
                  />
                  <Stack.Screen
                    name="Cart/CartPages"
                    options={{ headerShown: true }}
                  />
                  <Stack.Screen
                    name="Checkout/Checkout"
                    options={{ headerShown: true }}
                  />
                  <Stack.Screen
                    name="Checkout/OrderStatus"
                    options={{ headerShown: true }}
                  />
                  <Stack.Screen
                    name="Checkout/OrderDetails"
                    options={{ headerShown: true }}
                  />
                  <Stack.Screen
                    name="Collections/NightLight"
                    options={{ headerShown: true }}
                  />
                  <Stack.Screen
                    name="Collections/DrinkWare"
                    options={{ headerShown: true }}
                  />
                </Stack>
              )}

              {/* Stack cho admin (role = 0) không sử dụng renderHeader */}
              {user && userRole === 0 && (
                <Stack
                  screenOptions={{
                    headerBackVisible: false,
                    headerTitleAlign: "center",
                    headerTitle: () => null, // Không sử dụng renderHeader cho admin
                    headerLeft: () => null,
                    headerRight: () => null,
                  }}
                >
                  <Stack.Screen
                    name="Admin/home"
                    options={{ headerShown: true }}
                  />
                  {/* Thêm các màn hình admin khác nếu cần, ví dụ: */}
                  <Stack.Screen
                    name="Admin/dashboard"
                    options={{ headerShown: true }}
                  />
                  <Stack.Screen
                    name="Admin/users"
                    options={{ headerShown: true }}
                  />
                </Stack>
              )}
            </Stack>
          </SafeAreaView>
        </ThemeProvider>
      </CartProvider>
    </OrderProvider>
  );
}
