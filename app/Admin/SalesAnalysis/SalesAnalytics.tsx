import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import { analyzeSales, SalesAnalytics } from "~/service/analytics";
import { BarChart, PieChart } from "react-native-chart-kit";

export default function SalesAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<SalesAnalytics | null>(
    null
  );
  const { isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyzeSales();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${
          isDarkColorScheme ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <ActivityIndicator size="large" color="#F97316" />
        <Text
          className={`mt-2.5 text-base ${
            isDarkColorScheme ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Đang tải dữ liệu phân tích...
        </Text>
      </View>
    );
  }

  if (!analyticsData) {
    return (
      <View
        className={`flex-1 justify-center items-center ${
          isDarkColorScheme ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <Text className="text-base text-red-500">
          Không thể tải dữ liệu phân tích
        </Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width;

  // Format chart data for top products
  const topProductsData = {
    labels: analyticsData.topProducts
      .slice(0, 5)
      .map((p) => p.name.substring(0, 10) + "..."),
    datasets: [
      {
        data: analyticsData.topProducts.slice(0, 5).map((p) => p.purchaseCount),
      },
    ],
  };

  // Format chart data for categories
  const categoryData = analyticsData.mostPopularCategories.map((cat) => ({
    name: cat.categoryName,
    sales: cat.totalSales,
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    legendFontColor: isDarkColorScheme ? "#fff" : "#000",
    legendFontSize: 12,
  }));

  return (
    <ScrollView
      className={`flex-1 ${isDarkColorScheme ? "bg-gray-900" : "bg-gray-50"}`}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
    >
      <Text
        className={`text-2xl font-bold mb-5 ${
          isDarkColorScheme ? "text-white" : "text-gray-800"
        }`}
      >
        Phân tích nhu cầu mua hàng
      </Text>

      {/* Tổng quan */}
      <View
        className={`rounded-xl p-4 mb-5 shadow ${
          isDarkColorScheme ? "bg-gray-800" : "bg-white"
        }`}
      >
        <Text
          className={`text-lg font-bold mb-4 ${
            isDarkColorScheme ? "text-white" : "text-gray-800"
          }`}
        >
          Tổng quan
        </Text>
        <View className="flex-row justify-between">
          <View className="flex-1 p-3">
            <Text
              className={`text-sm mb-2 ${
                isDarkColorScheme ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Tổng doanh thu
            </Text>
            <Text className="text-lg font-bold text-emerald-600">
              {analyticsData.totalRevenue.toLocaleString()} VNĐ
            </Text>
          </View>
          <View className="flex-1 p-3">
            <Text
              className={`text-sm mb-2 ${
                isDarkColorScheme ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Giá trị đơn hàng trung bình
            </Text>
            <Text className="text-lg font-bold text-purple-600">
              {analyticsData.averageOrderValue.toLocaleString()} VNĐ
            </Text>
          </View>
        </View>
      </View>

      {/* Top sản phẩm bán chạy */}
      <View
        className={`rounded-xl p-4 mb-5 shadow ${
          isDarkColorScheme ? "bg-gray-800" : "bg-white"
        }`}
      >
        <Text
          className={`text-lg font-bold mb-4 ${
            isDarkColorScheme ? "text-white" : "text-gray-800"
          }`}
        >
          Top 5 sản phẩm bán chạy
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={topProductsData}
            width={screenWidth * 1.2}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" sp"
            chartConfig={{
              backgroundColor: isDarkColorScheme ? "#1f2937" : "#fff",
              backgroundGradientFrom: isDarkColorScheme ? "#1f2937" : "#fff",
              backgroundGradientTo: isDarkColorScheme ? "#1f2937" : "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) =>
                isDarkColorScheme
                  ? `rgba(255, 255, 255, ${opacity})`
                  : `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) =>
                isDarkColorScheme
                  ? `rgba(255, 255, 255, ${opacity})`
                  : `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              barPercentage: 0.7,
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            showBarTops={false}
            fromZero={true}
          />
        </ScrollView>
      </View>

      {/* Phân bố theo danh mục */}
      <View
        className={`rounded-xl p-4 mb-5 shadow ${
          isDarkColorScheme ? "bg-gray-800" : "bg-white"
        }`}
      >
        <Text
          className={`text-lg font-bold mb-4 ${
            isDarkColorScheme ? "text-white" : "text-gray-800"
          }`}
        >
          Phân bố theo danh mục
        </Text>
        <PieChart
          data={categoryData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) =>
              isDarkColorScheme
                ? `rgba(255, 255, 255, ${opacity})`
                : `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="sales"
          backgroundColor="transparent"
          paddingLeft="15"
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>

      {/* Chi tiết top sản phẩm */}
      <View
        className={`rounded-xl p-4 mb-5 shadow ${
          isDarkColorScheme ? "bg-gray-800" : "bg-white"
        }`}
      >
        <Text
          className={`text-lg font-bold mb-4 ${
            isDarkColorScheme ? "text-white" : "text-gray-800"
          }`}
        >
          Chi tiết top 10 sản phẩm
        </Text>
        {analyticsData.topProducts.map((product, index) => (
          <View
            key={product.id}
            className={`flex-row items-center py-3 ${
              index !== analyticsData.topProducts.length - 1
                ? "border-b border-gray-200 dark:border-gray-700"
                : ""
            }`}
          >
            <Text
              className={`text-base font-bold w-10 ${
                isDarkColorScheme ? "text-white" : "text-gray-800"
              }`}
            >
              #{index + 1}
            </Text>
            <View className="flex-1">
              <Text
                className={`text-base font-medium mb-1 ${
                  isDarkColorScheme ? "text-white" : "text-gray-800"
                }`}
              >
                {product.name}
              </Text>
              <Text
                className={`text-sm ${
                  isDarkColorScheme ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Đã bán: {product.purchaseCount} | Doanh thu:{" "}
                {product.revenue.toLocaleString()} VNĐ
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
