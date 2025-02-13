import React from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Carrot,
  ChevronLeft,
  Heart,
  MenuIcon,
  Search,
  SearchIcon,
  ShoppingCart,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Text } from "~/components/ui/text";
import SearchBar from "./search";

const logo = require("~/assets/images/logo.png");
const inlineMenu = [
  { title: "Valentine's Day", link: "/valentines" },
  { title: "Occasions", link: "/" },
  { title: "Recipients", link: "/" },
  { title: "Interests", link: "/" },
  { title: "Home & Kitchen", link: "/" },
  { title: "Clothing & Jewelry", link: "/" },
  { title: "Drinkware & Barware", link: "/" },
  { title: "Accessories", link: "/" },
  { title: "Happy Customers", link: "/" },
];

function SiteHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  return (
    <SafeAreaView>
      <View className="flex-4 gap-2  max-xs:gap-0  flex-row items-center   justify-between ">
        <View>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost">
                <View>
                  <MenuIcon size={28} color="black" />
                </View>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              insets={contentInsets}
              className="w-full"
            >
              {inlineMenu.map((item, index) => (
                <View key={index}>
                  <Text className="h-12 w-full shadow-current  font-medium native:text-2xl">
                    {item.title}
                  </Text>
                </View>
              ))}
            </PopoverContent>
          </Popover>
        </View>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Image source={logo} />
        </TouchableOpacity>
        <View className="flex-row gap-3 items-center">
          <View>
            <Button
              variant="ghost"
              size="icon"
              onPress={() => setIsSearchOpen(true)}
            >
              <SearchIcon size={28} color="black" />
            </Button>
          </View>
          <View>
            <Heart size={28} color="black" />
          </View>
          <TouchableOpacity
            onPress={() => router.push("/Cart/CartPages" as any)}
          >
            <View>
              <ShoppingCart size={28} color="black" />
            </View>
            <View className="absolute bg-red-500  flex rounded-full w-6 h-6 -right-2 -top-1 justify-center items-center text-sm">
              <Text className="text-white">0</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Modal cho giao diện tìm kiếm */}
        <Modal visible={isSearchOpen} transparent={true} animationType="slide">
          <View className="flex-1 bg-white">
            <View className="p-4 flex items-center justify-between ">
              <Button
                variant={"ghost"}
                onPress={() => setIsSearchOpen(false)}
                className="flex w-full flex-row justify-start items-center gap-2 text-black"
              >
                <ChevronLeft size={24} color={"black"} />
                <Text>Cancel</Text>
              </Button>
            </View>

            {/* Nội dung tìm kiếm */}
            <View className="p-4 flex-1">
              <SearchBar />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

export default SiteHeader;
