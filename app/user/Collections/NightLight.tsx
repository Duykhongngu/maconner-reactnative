import { useRouter } from "expo-router";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
} from "react-native";
import { products } from "~/app/Data/product";
import { useWindowDimensions } from "react-native";

import { useColorScheme } from "~/lib/useColorScheme";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import Footer from "../../Footer/Footer";

function NightLights() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDarkColorScheme } = useColorScheme();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const bgColor = isDarkColorScheme ? "#121212" : "#FFFFFF";
  const textColor = isDarkColorScheme ? "#E5E7EB" : "#1E1E1E";
  const cardBgColor = isDarkColorScheme ? "#1E1E1E" : "#FFFFFF";
  const borderColor = isDarkColorScheme ? "#374151" : "#E5E7EB";

  // Kiểm tra xem products.nightLights có tồn tại và là một mảng không
  const nightLights = Array.isArray(products.nightLights)
    ? products.nightLights
    : [];
  const totalPages = Math.ceil(nightLights.length / itemsPerPage);

  const paginatedProducts = nightLights.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView>
        <View style={styles.content}>
          <Text style={[styles.title, { color: "#F97316" }]}>Night Lights</Text>
          {nightLights.length > 0 ? (
            <>
              <View style={styles.productContainer}>
                {paginatedProducts.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(`/user/Products/${item.id}`)}
                    style={[
                      styles.productCard,
                      { backgroundColor: cardBgColor, borderColor },
                    ]}
                  >
                    <Image
                      source={
                        typeof item.img === "string"
                          ? { uri: item.img }
                          : item.img
                      }
                      style={styles.productImage}
                    />
                    <Text
                      style={[styles.productDescription, { color: textColor }]}
                    >
                      {item.description}
                    </Text>
                    <Text style={styles.productPrice}>$ {item.price} USD</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  onPress={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  style={[
                    styles.pageButton,
                    currentPage === 1 && styles.disabledButton,
                  ]}
                >
                  <Text style={[styles.pageButtonText, { color: textColor }]}>
                    <ChevronLeft size={24} color={"white"} />
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.pageInfo, { color: textColor }]}>
                  Page {currentPage} of {totalPages}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  style={[
                    styles.pageButton,
                    currentPage === totalPages && styles.disabledButton,
                  ]}
                >
                  <Text style={[styles.pageButtonText, { color: textColor }]}>
                    <ChevronRight size={24} color={"white"} />
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={[styles.noProductsText, { color: textColor }]}>
              No products available
            </Text>
          )}
        </View>
        <View style={{ marginTop: 20 }}>
          <Footer />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  productContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    width: "48%",
  },
  productImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
  },
  productDescription: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    height: 60,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F97316",
  },

  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  pageButton: {
    padding: 10,
    backgroundColor: "#F97316",
    borderRadius: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  pageInfo: {
    fontSize: 16,
  },
  showMoreText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  noProductsText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
});

export default NightLights;
