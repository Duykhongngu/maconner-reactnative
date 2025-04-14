import React, { useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Appearance,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreditCard, DollarSign } from "lucide-react-native";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useCart } from "../Cart/CartContext";
import { CartItem, useOrder } from "./OrderContext";
import { useRouter } from "expo-router";
import { auth, db } from "~/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  increment,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";

// Định nghĩa schema cho form
const formSchema = z.object({
  name: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự" }),
  email: z.string().email({ message: "Email không hợp lệ" }),
  phone: z.string().min(10, { message: "Số điện thoại không hợp lệ" }),
  address: z.string().min(5, { message: "Địa chỉ phải có ít nhất 5 ký tự" }),
  country: z.string().min(1, { message: "Vui lòng chọn quốc gia" }),
  paymentMethod: z.enum(["credit", "cod"], {
    required_error: "Vui lòng chọn phương thức thanh toán",
  }),
});

type FormData = z.infer<typeof formSchema>;

const CheckoutScreen: React.FC = () => {
  const { cartItems, clearCart } = useCart();
  const { setCurrentOrder } = useOrder();
  const router = useRouter();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shippingFee = 30;
  const total = subtotal + shippingFee;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      country: "",
      paymentMethod: "credit",
    },
    mode: "onChange", // Validate on change for immediate feedback
  });

  // Lấy thông tin người dùng từ Firestore dựa trên userId khi đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "accounts", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            reset({
              name: userData.displayName || "",
              email: userData.email || "",
              phone: userData.phone || "",
              address: userData.address || "",
              country: userData.country || "",
              paymentMethod: "credit",
            });

            // Trigger validation after setting values from database
            await trigger();
          } else {
            console.log("Không tìm thấy thông tin người dùng trong Firestore");
            Alert.alert(
              "Thông báo",
              "Không tìm thấy thông tin người dùng. Vui lòng điền thông tin thủ công."
            );
          }
        } catch (error) {
          console.error("Lỗi khi lấy dữ liệu người dùng:", error);
          Alert.alert("Lỗi", "Không thể tải thông tin người dùng.");
        }
      } else {
        Alert.alert("Lỗi", "Bạn cần đăng nhập để tiếp tục đặt hàng.");
        router.replace("/" as any);
      }
    });

    return () => unsubscribe();
  }, [reset, router, trigger]);

  // Xử lý submit form và lưu đơn hàng lên Firestore với userId
  const onSubmit = async (values: FormData) => {
    // Đầu tiên kiểm tra lại xem form có hợp lệ không
    const isValid = await trigger();
    if (!isValid) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin trước khi đặt hàng");
      return;
    }

    if (!auth.currentUser) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để đặt hàng.");
      router.replace("/" as any);
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert("Lỗi", "Giỏ hàng của bạn đang trống!");
      return;
    }

    try {
      // Format cart items to ensure they have all required fields
      const formattedCartItems = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.color || "Default",
        size: item.size || "Standard", // Add default size if missing
        image: item.image,
        images: item.images || [item.image],
        description: item.description || "",
      }));

      const orderData = {
        userId: auth.currentUser.uid, // Gắn userId của tài khoản đăng nhập
        ...values,
        cartItems: formattedCartItems,
        subtotal: subtotal.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        total,
        date: new Date().toISOString(),
        status: "pending" as const,
      };

      // Lưu đơn hàng vào collection 'orderManager'
      const docRef = await addDoc(collection(db, "orderManager"), orderData);
      const newOrder = { id: docRef.id, ...orderData };

      // Cập nhật current order trong OrderContext
      setCurrentOrder(newOrder);

      // Cập nhật số lượng mua (purchaseCount) cho mỗi sản phẩm
      for (const item of formattedCartItems) {
        try {
          const productRef = doc(db, "products", item.id);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            const productData = productSnap.data();
            const currentStock = productData.stockQuantity || 0;

            // Kiểm tra xem có đủ hàng không
            if (currentStock < item.quantity) {
              Alert.alert(
                "Out of Stock",
                `Sorry, there are only ${currentStock} units of "${item.name}" available.`
              );
              return;
            }

            // Cập nhật số lượng mua và số lượng tồn kho
            await updateDoc(productRef, {
              purchaseCount: increment(item.quantity),
              stockQuantity: currentStock - item.quantity,
              // Cập nhật trạng thái inStock dựa trên số lượng còn lại
              inStock: currentStock - item.quantity > 0,
            });

            console.log(
              `Updated product ${item.id}: purchased ${
                item.quantity
              }, remaining stock ${currentStock - item.quantity}`
            );
          }
        } catch (error) {
          console.error(`Error updating product ${item.id}:`, error);
          // Continue with the next item even if one fails
        }
      }

      // Kiểm tra xem có danh mục Trending được bật auto-update không
      try {
        const categoriesRef = collection(db, "categories");
        const q = query(
          categoriesRef,
          where("name", "==", "Trending"),
          where("autoUpdate", "==", true)
        );
        const categorySnap = await getDocs(q);

        if (!categorySnap.empty) {
          // Có danh mục Trending với auto-update bật
          const trendingCategory = categorySnap.docs[0];

          // Lấy top 20 sản phẩm bán chạy nhất
          const productsRef = collection(db, "products");
          const topProductsQuery = query(
            productsRef,
            orderBy("purchaseCount", "desc"),
            limit(20)
          );
          const topProductsSnap = await getDocs(topProductsQuery);

          const topProductIds = topProductsSnap.docs.map((doc) => doc.id);

          // Cập nhật danh sách sản phẩm trending
          await updateDoc(doc(db, "categories", trendingCategory.id), {
            productIds: topProductIds,
            lastUpdated: new Date().toISOString(),
          });

          // Cập nhật trường Trending cho từng sản phẩm
          const batch = writeBatch(db);

          // Đầu tiên, đặt tất cả sản phẩm là không trending
          const allProductsQuery = query(collection(db, "products"));
          const allProductsSnap = await getDocs(allProductsQuery);

          allProductsSnap.forEach((docSnap) => {
            const productRef = doc(db, "products", docSnap.id);
            batch.update(productRef, { Trending: false });
          });

          // Sau đó đánh dấu các sản phẩm top là trending
          for (const productId of topProductIds) {
            const productRef = doc(db, "products", productId);
            batch.update(productRef, { Trending: true });
          }

          // Thực hiện tất cả các cập nhật trong một batch
          await batch.commit();

          console.log("Trending products updated automatically");
        }
      } catch (error) {
        console.error("Error updating trending products:", error);
        // Không hiển thị lỗi cho người dùng, đơn hàng vẫn thành công
      }

      // Xóa giỏ hàng sau khi đặt hàng thành công
      clearCart();

      // Điều hướng sang trang trạng thái đơn hàng
      router.replace("/user/Checkout/OrderStatus");

      console.log("Đơn hàng đã được lưu với ID:", docRef.id);
    } catch (error) {
      console.error("Lỗi khi lưu đơn hàng:", error);
      Alert.alert("Lỗi", "Không thể lưu đơn hàng. Vui lòng thử lại.");
    }
  };

  const colorScheme = Appearance.getColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      style={isDarkMode ? styles.darkBackground : styles.lightBackground}
    >
      <Card>
        <CardHeader>
          <CardTitle style={isDarkMode ? styles.darkText : styles.lightText}>
            Thông tin giao hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text
                  style={isDarkMode ? styles.darkText : styles.lightText}
                  className="mb-2 font-medium"
                >
                  Họ và tên
                </Text>
                <TextInput
                  style={[
                    isDarkMode ? styles.darkInput : styles.lightInput,
                    errors.name ? { borderColor: "#ef4444" } : {},
                  ]}
                  placeholder="Nguyễn Văn A"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                {errors.name && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </Text>
                )}
              </View>
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text
                  style={isDarkMode ? styles.darkText : styles.lightText}
                  className="mb-2 font-medium"
                >
                  Email
                </Text>
                <TextInput
                  style={[
                    isDarkMode ? styles.darkInput : styles.lightInput,
                    errors.email ? { borderColor: "#ef4444" } : {},
                  ]}
                  placeholder="example@email.com"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </Text>
                )}
              </View>
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text
                  style={isDarkMode ? styles.darkText : styles.lightText}
                  className="mb-2 font-medium"
                >
                  Số điện thoại
                </Text>
                <TextInput
                  style={[
                    isDarkMode ? styles.darkInput : styles.lightInput,
                    errors.phone ? { borderColor: "#ef4444" } : {},
                  ]}
                  placeholder="0123456789"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
                />
                {errors.phone && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.phone.message}
                  </Text>
                )}
              </View>
            )}
          />
          <Controller
            control={control}
            name="country"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text
                  className="mb-2 font-medium"
                  style={isDarkMode ? styles.darkText : styles.lightText}
                >
                  Quốc gia
                </Text>
                <TextInput
                  style={[
                    isDarkMode ? styles.darkInput : styles.lightInput,
                    errors.country ? { borderColor: "#ef4444" } : {},
                  ]}
                  placeholder="Nhập quốc gia"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                {errors.country && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.country.message}
                  </Text>
                )}
              </View>
            )}
          />
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text
                  style={isDarkMode ? styles.darkText : styles.lightText}
                  className="mb-2 font-medium"
                >
                  Địa chỉ
                </Text>
                <TextInput
                  style={[
                    isDarkMode ? styles.darkInput : styles.lightInput,
                    errors.address ? { borderColor: "#ef4444" } : {},
                  ]}
                  placeholder="123 Đường ABC, Quận XYZ"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                {errors.address && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.address.message}
                  </Text>
                )}
              </View>
            )}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle style={isDarkMode ? styles.darkText : styles.lightText}>
            Phương thức thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field: { onChange, value } }) => (
              <View>
                <TouchableOpacity
                  className={`flex-row items-center p-4 border rounded-md mb-2 ${
                    value === "credit"
                      ? "border-orange-500"
                      : errors.paymentMethod
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  onPress={() => onChange("credit")}
                >
                  <CreditCard
                    color={value === "credit" ? "#F97316" : "#6B7280"}
                    className="mr-2"
                  />
                  <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                    Thẻ tín dụng / Ghi nợ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-row items-center p-4 border rounded-md ${
                    value === "cod"
                      ? "border-orange-500"
                      : errors.paymentMethod
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  onPress={() => onChange("cod")}
                >
                  <DollarSign
                    color={value === "cod" ? "#F97316" : "#6B7280"}
                    className="mr-2"
                  />
                  <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                    Thanh toán khi nhận hàng
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.paymentMethod && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.paymentMethod.message}
            </Text>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle style={isDarkMode ? styles.darkText : styles.lightText}>
            Tóm tắt đơn hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cartItems.map((item) => (
            <View
              key={`${item.id}-${item.color}`}
              className="flex-row items-center mb-4"
            >
              <Image
                source={
                  typeof item.image === "string"
                    ? { uri: item.image }
                    : item.image
                }
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  marginRight: 16,
                }}
              />
              <View className="flex-1">
                <Text
                  style={isDarkMode ? styles.darkText : styles.lightText}
                  className="font-semibold"
                >
                  {item.name}
                </Text>

                <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                  Số lượng: {item.quantity}
                </Text>
              </View>
              <Text
                style={isDarkMode ? styles.darkText : styles.lightText}
                className="font-semibold"
              >
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <Separator className="my-4" />
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                Tổng tiền hàng
              </Text>
              <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                ${subtotal.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                Phí vận chuyển
              </Text>
              <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                ${shippingFee.toFixed(2)}
              </Text>
            </View>
            <Separator />
            <View className="flex-row justify-between">
              <Text
                style={[
                  styles.fontBold,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                Tổng cộng
              </Text>
              <Text
                style={[
                  styles.fontBold,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <Button
        style={[
          styles.checkoutButton,
          Object.keys(errors).length > 0 ? { backgroundColor: "#999" } : {},
        ]}
        className="w-full mt-4 mb-6"
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.checkoutButtonText}>
          {Object.keys(errors).length > 0
            ? "Vui lòng điền đầy đủ thông tin"
            : "Đặt hàng"}
        </Text>
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  darkBackground: {
    backgroundColor: "#121212",
  },
  lightBackground: {
    backgroundColor: "#FFFFFF",
  },
  darkText: {
    color: "#FFFFFF",
  },
  lightText: {
    color: "#000000",
  },
  darkInput: {
    borderColor: "#FFFFFF",
    backgroundColor: "#1E1E1E",
    color: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  lightInput: {
    borderColor: "#000000",
    backgroundColor: "#FFFFFF",
    color: "#000000",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  checkoutButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#F97316",
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  fontBold: {
    fontWeight: "bold",
  },
});

export default CheckoutScreen;
