import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "~/firebase.config";
import { BarChart, LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

interface SalesData {
  date: string;
  revenue: number;
  orderCount: number;
  productsSold: number;
}

interface ProductPerformance {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
}

const TimeRanges = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
} as const;

type TimeRange = (typeof TimeRanges)[keyof typeof TimeRanges];

export default function SalesReport() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRanges.WEEK);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const { isDarkColorScheme } = useColorScheme();
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    fetchSalesData(timeRange);
  }, [timeRange]);

  const fetchSalesData = async (selectedRange: TimeRange) => {
    setLoading(true);
    try {
      const startDate = getStartDate(selectedRange);
      const endDate = new Date();

      // Fetch orders within date range
      const ordersRef = collection(db, "orderManager");
      const q = query(
        ordersRef,
        where("date", ">=", startDate.toISOString()),
        where("date", "<=", endDate.toISOString()),
        orderBy("date", "asc")
      );

      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Process orders into daily data
      const dailyData = processDailyData(orders, selectedRange);
      setSalesData(dailyData);

      // Process top products
      const productsData = processProductsData(orders);
      setTopProducts(productsData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (range: TimeRange): Date => {
    const now = new Date();
    switch (range) {
      case TimeRanges.DAY:
        return new Date(now.setHours(0, 0, 0, 0));
      case TimeRanges.WEEK:
        now.setDate(now.getDate() - 7);
        return now;
      case TimeRanges.MONTH:
        now.setMonth(now.getMonth() - 1);
        return now;
      case TimeRanges.YEAR:
        now.setFullYear(now.getFullYear() - 1);
        return now;
      default:
        return now;
    }
  };

  const processDailyData = (orders: any[], range: TimeRange): SalesData[] => {
    const dailyData: { [key: string]: SalesData } = {};
    
    // If no orders, return array with single entry containing default values
    if (orders.length === 0) {
      return [{
        date: new Date().toLocaleDateString("vi-VN"),
        revenue: 0,
        orderCount: 0,
        productsSold: 0
      }];
    }

    orders.forEach((order) => {
      const date = new Date(order.date);
      const dateKey = date.toLocaleDateString("vi-VN");

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          revenue: 0,
          orderCount: 0,
          productsSold: 0,
        };
      }

      dailyData[dateKey].revenue += parseFloat(order.total) || 0;
      dailyData[dateKey].orderCount += 1;
      dailyData[dateKey].productsSold +=
        order.cartItems?.reduce(
          (sum: number, item: any) => sum + (item.quantity || 0),
          0
        ) || 0;
    });

    return Object.values(dailyData);
  };

  const processProductsData = (orders: any[]): ProductPerformance[] => {
    const productsMap = new Map<string, ProductPerformance>();

    orders.forEach((order) => {
      order.cartItems?.forEach((item: any) => {
        if (!productsMap.has(item.id)) {
          productsMap.set(item.id, {
            id: item.id,
            name: item.name,
            totalSold: 0,
            revenue: 0,
          });
        }

        const product = productsMap.get(item.id)!;
        product.totalSold += item.quantity || 0;
        product.revenue += item.price * item.quantity || 0;
      });
    });

    return Array.from(productsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  const chartData = {
    labels: salesData.map((data) => data.date),
    datasets: [
      {
        data: salesData.map((data) => data.revenue),
      },
    ],
  };

  const TimeRangeButton = ({
    range,
    label,
  }: {
    range: TimeRange;
    label: string;
  }) => (
    <TouchableOpacity
      onPress={() => setTimeRange(range)}
      className={`px-4 py-2 rounded-lg mr-2 ${
        timeRange === range
          ? "bg-orange-500"
          : isDarkColorScheme
          ? "bg-gray-700"
          : "bg-gray-200"
      }`}
    >
      <Text
        className={`${
          timeRange === range
            ? "text-white"
            : isDarkColorScheme
            ? "text-gray-300"
            : "text-gray-600"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="mt-4">Đang tải dữ liệu báo cáo...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkColorScheme ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <ScrollView className="p-4">
        <Text
          className={`text-2xl font-bold mb-6 ${
            isDarkColorScheme ? "text-white" : "text-gray-800"
          }`}
        >
          Báo cáo doanh thu
        </Text>

        {/* Time range selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
        >
          <TimeRangeButton range={TimeRanges.DAY} label="Hôm nay" />
          <TimeRangeButton range={TimeRanges.WEEK} label="7 ngày qua" />
          <TimeRangeButton range={TimeRanges.MONTH} label="30 ngày qua" />
          <TimeRangeButton range={TimeRanges.YEAR} label="365 ngày qua" />
        </ScrollView>

        {/* Summary Cards */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <View
            className={`w-[48%] p-4 rounded-xl mb-4 ${
              isDarkColorScheme ? "bg-gray-800" : "bg-white"
            } shadow`}
          >
            <Text
              className={`text-sm ${
                isDarkColorScheme ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Tổng doanh thu
            </Text>
            <Text
              className={`text-xl font-bold ${
                isDarkColorScheme ? "text-white" : "text-gray-800"
              }`}
            >
              {salesData
                .reduce((sum, data) => sum + data.revenue, 0)
                .toLocaleString()}{" "}
              VNĐ
            </Text>
          </View>

          <View
            className={`w-[48%] p-4 rounded-xl mb-4 ${
              isDarkColorScheme ? "bg-gray-800" : "bg-white"
            } shadow`}
          >
            <Text
              className={`text-sm ${
                isDarkColorScheme ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Tổng đơn hàng
            </Text>
            <Text
              className={`text-xl font-bold ${
                isDarkColorScheme ? "text-white" : "text-gray-800"
              }`}
            >
              {salesData.reduce((sum, data) => sum + data.orderCount, 0)}
            </Text>
          </View>

          <View
            className={`w-[48%] p-4 rounded-xl mb-4 ${
              isDarkColorScheme ? "bg-gray-800" : "bg-white"
            } shadow`}
          >
            <Text
              className={`text-sm ${
                isDarkColorScheme ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Sản phẩm đã bán
            </Text>
            <Text
              className={`text-xl font-bold ${
                isDarkColorScheme ? "text-white" : "text-gray-800"
              }`}
            >
              {salesData.reduce((sum, data) => sum + data.productsSold, 0)}
            </Text>
          </View>

          <View
            className={`w-[48%] p-4 rounded-xl mb-4 ${
              isDarkColorScheme ? "bg-gray-800" : "bg-white"
            } shadow`}
          >
            <Text
              className={`text-sm ${
                isDarkColorScheme ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Trung bình/đơn
            </Text>
            <Text
              className={`text-xl font-bold ${
                isDarkColorScheme ? "text-white" : "text-gray-800"
              }`}
            >
              {(
                salesData.reduce((sum, data) => sum + data.revenue, 0) /
                Math.max(
                  salesData.reduce((sum, data) => sum + data.orderCount, 0),
                  1
                )
              ).toLocaleString()}{" "}
              VNĐ
            </Text>
          </View>
        </View>

        {/* Revenue Chart */}
        <View
          className={`p-4 rounded-xl mb-6 ${
            isDarkColorScheme ? "bg-gray-800" : "bg-white"
          } shadow`}
        >
          <Text
            className={`text-lg font-bold mb-4 ${
              isDarkColorScheme ? "text-white" : "text-gray-800"
            }`}
          >
            Biểu đồ doanh thu
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={chartData}
              width={Math.max(screenWidth - 40, salesData.length * 60)}
              height={220}
              chartConfig={{
                backgroundColor: isDarkColorScheme ? "#1F2937" : "#ffffff",
                backgroundGradientFrom: isDarkColorScheme
                  ? "#1F2937"
                  : "#ffffff",
                backgroundGradientTo: isDarkColorScheme ? "#1F2937" : "#ffffff",
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
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#FF6B00",
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </ScrollView>
        </View>

        {/* Top Products Table */}
        <View
          className={`p-4 rounded-xl mb-6 ${
            isDarkColorScheme ? "bg-gray-800" : "bg-white"
          } shadow`}
        >
          <Text
            className={`text-lg font-bold mb-4 ${
              isDarkColorScheme ? "text-white" : "text-gray-800"
            }`}
          >
            Top 10 sản phẩm bán chạy
          </Text>
          {topProducts.map((product, index) => (
            <View
              key={product.id}
              className={`py-3 ${
                index !== topProducts.length - 1
                  ? "border-b border-gray-200"
                  : ""
              }`}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text
                    className={`font-medium ${
                      isDarkColorScheme ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {index + 1}. {product.name}
                  </Text>
                  <Text
                    className={`text-sm ${
                      isDarkColorScheme ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Đã bán: {product.totalSold} | Doanh thu:{" "}
                    {product.revenue.toLocaleString()} VNĐ
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
