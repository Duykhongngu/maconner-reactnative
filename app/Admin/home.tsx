import { useRouter } from "expo-router";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Define valid icon names to satisfy TypeScript
type IconName = React.ComponentProps<typeof Ionicons>["name"];

function HomeAdmin() {
  const router = useRouter();
  const { colorScheme } = useColorScheme(); // Using system color scheme

  const isDarkMode = colorScheme === "dark";

  // Menu items configuration with proper typing
  const menuItems = [
    {
      title: "Account Management",
      icon: isDarkMode
        ? ("people-outline" as IconName)
        : ("people" as IconName),
      route: "/Admin/AccountsManage/Accounts",
    },
    {
      title: "Category Products Management",
      icon: isDarkMode ? ("cube-outline" as IconName) : ("cube" as IconName),
      route: "/Admin/CategoryProductManagement/CategoryProduct",
    },
    {
      title: "Products Management",
      icon: isDarkMode ? ("cube-outline" as IconName) : ("cube" as IconName),
      route: "/Admin/ProductsManagement/products",
    },
    {
      title: "Order Management",
      icon: isDarkMode ? ("cart-outline" as IconName) : ("cart" as IconName),
      route: "/Admin/OrderManage/OrderManager",
    },
    {
      title: "Review Management",
      icon: isDarkMode ? ("star-outline" as IconName) : ("star" as IconName),
      route: "/Admin/ReviewManagements/ReviewManagement",
    },
    {
      title: "Voucher Management",
      icon: isDarkMode
        ? ("pricetag-outline" as IconName)
        : ("pricetag" as IconName),
      route: "/Admin/VoucherManagement/VoucherManager",
    },
    {
      title: "Quản lý thông báo",
      icon: "notifications" as IconName,
      route: "/Admin/NotificationManagement/NotificationManagement",
    },
    {
      title: "Yêu cầu hỗ trợ",
      icon: "chatbubbles-outline" as IconName,
      route: "/Admin/ChatManagement/AdminChatManagement",
    },
    {
      title: "Analytics",
      icon: isDarkMode
        ? ("stats-chart-outline" as IconName)
        : ("stats-chart" as IconName),
      route: "/Admin/SalesAnalysis/SalesAnalytics",
    },
    {
      title: "Reports",
      icon: isDarkMode
        ? ("document-text-outline" as IconName)
        : ("document-text" as IconName),
      route: "/Admin/SalesAnalysis/SalesReport",
    },
  ];

  // Function to handle navigation with type safety
  const handleNavigation = (path: string) => {
    try {
      router.push(path as any);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 mt-2 ">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleNavigation(item.route)}
              style={[
                styles.card,
                isDarkMode ? styles.cardDark : styles.cardLight,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={item.icon}
                  size={32}
                  color={isDarkMode ? "#FF9E80" : "#fff"}
                  style={styles.icon}
                />
              </View>
              <Text
                style={[
                  styles.cardContent,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Base containers

  container: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Theme backgrounds
  lightBackground: {
    backgroundColor: "#fff9f4",
  },
  darkBackground: {
    backgroundColor: "#000000",
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    marginBottom: 10,
    alignItems: "center",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
  },
  lightHeaderText: {
    color: "#FF5722",
  },
  darkHeaderText: {
    color: "#FF9E80",
  },

  // Card styles
  card: {
    width: "48%",
    aspectRatio: 0.9,
    borderRadius: 16,
    padding: 15,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  cardLight: {
    backgroundColor: "#FF7043",
    borderWidth: 0,
  },
  cardDark: {
    backgroundColor: "#2d2d2d",
    borderWidth: 1,
    borderColor: "#444",
  },

  // Icon styles
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    // No additional styling needed
  },

  // Text styles
  cardContent: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  lightText: {
    color: "#fff",
  },
  darkText: {
    color: "#FF9E80",
  },
});

export default HomeAdmin;
