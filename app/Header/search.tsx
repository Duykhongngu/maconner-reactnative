import * as React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Search, TrendingUp } from "lucide-react-native";
import { Button } from "../../components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme"; // Import useColorScheme

// Mock search results data
interface SearchResult {
  id: number;
  title: string;
  category: string;
}

const mockResults: SearchResult[] = [
  { id: 1, title: "Valentine's Day Special Gift Box", category: "Gifts" },
  { id: 2, title: "Heart Shaped Pendant Necklace", category: "Jewelry" },
  { id: 3, title: "Romantic Dinner Set for Two", category: "Kitchen" },
  { id: 4, title: "Love Letter Writing Kit", category: "Stationery" },
  { id: 5, title: "Couple's Matching Watches", category: "Accessories" },
];

const trendingSearches = [
  "valentines gift for him",
  "a boy and his dog",
  "a girl and her dog",
  "valentines gift",
  "bottle lamp",
];

export default function SearchBar() {
  const [value, setValue] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);
  const { isDarkColorScheme } = useColorScheme(); // Get the current color scheme

  // Simulated search function
  const handleSearch = React.useCallback((query: string) => {
    setLoading(true);
    setTimeout(() => {
      const filtered = mockResults.filter((result) =>
        result.title.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
    }, 300);
  }, []);

  React.useEffect(() => {
    if (value.length > 0) {
      handleSearch(value);
    } else {
      setResults([]);
    }
  }, [value, handleSearch]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="w-full mx-auto">
        <View className="relative">
          <TextInput
            ref={inputRef}
            placeholder="Search"
            className={`w-full px-4 pr-12 h-12 rounded-full border ${
              isDarkColorScheme ? "border-white" : "border-black"
            }`}
            placeholderTextColor={isDarkColorScheme ? "lightgray" : "gray"} // Change placeholder color
            value={value}
            onChangeText={setValue}
            onFocus={() => value.length > 0 && handleSearch(value)}
            style={{
              backgroundColor: isDarkColorScheme ? "#333" : "#fff", // Change background color
              color: isDarkColorScheme ? "#fff" : "#000", // Change text color
            }}
          />

          <TouchableOpacity
            className="absolute right-1 top-[13px] transform -translate-y-3 p-2 rounded-full bg-orange-500"
            onPress={() => value && handleSearch(value)}
          >
            <Search size={24} color="white" />
          </TouchableOpacity>
        </View>
        {value.length > 0 && (
          <View
            className="absolute top-12 left-0 right-0"
            style={{
              backgroundColor: isDarkColorScheme ? "#444" : "#fff", // Change background color for results
            }}
          >
            {loading ? (
              <Text className="text-center w-full h-full text-sm text-gray-500 p-4">
                Searching...
              </Text>
            ) : results.length > 0 ? (
              <FlatList
                className="w-full"
                data={results}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <Button
                    className="py-3 px-4"
                    onPress={() => {
                      setValue(item.title);
                      inputRef.current?.focus();
                    }}
                    style={{
                      backgroundColor: isDarkColorScheme ? "#555" : "#fff", // Change background color for each item
                    }}
                  >
                    <Text
                      className="text-base font-medium"
                      style={{ color: isDarkColorScheme ? "#fff" : "#000" }} // Change text color
                    >
                      {item.title}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{
                        color: isDarkColorScheme ? "lightgray" : "gray",
                      }} // Change category text color
                    >
                      {item.category}
                    </Text>
                  </Button>
                )}
              />
            ) : (
              <Text className="w-full h-full text-center text-sm text-gray-500 p-4">
                No results found
              </Text>
            )}
            <View className="p-4">
              <Text
                className="text-sm font-bold mb-2"
                style={{ color: isDarkColorScheme ? "orange" : "orange" }} // Change trending searches title color
              >
                TRENDING SEARCHES
              </Text>
              {trendingSearches.map((search, index) => (
                <Button
                  key={index}
                  className="flex-row w-full justify-start overflow-auto py-2"
                  onPress={() => {
                    setValue(search);
                    handleSearch(search);
                    inputRef.current?.focus();
                  }}
                  style={{
                    backgroundColor: isDarkColorScheme ? "#555" : "#fff", // Change background color for trending searches
                  }}
                >
                  <TrendingUp color={"orange"} size={24} />
                  <Text style={{ color: isDarkColorScheme ? "#fff" : "#000" }}>
                    {search}
                  </Text>
                </Button>
              ))}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
