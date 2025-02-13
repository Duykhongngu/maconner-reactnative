import * as React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Search, TrendingUp } from "lucide-react-native";
import { Button } from "../../components/ui/button";

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
    <View className="w-full mx-auto">
      <View className="relative">
        <TextInput
          ref={inputRef}
          placeholder="Search"
          className="w-full px-4 pr-12 h-12 rounded-full border border-black"
          value={value}
          onChangeText={setValue}
          onFocus={() => value.length > 0 && handleSearch(value)}
        />
        <TouchableOpacity
          className="absolute right-1 top-[13px] transform -translate-y-3 p-2 rounded-full bg-orange-500"
          onPress={() => value && handleSearch(value)}
        >
          <Search size={24} color="white" />
        </TouchableOpacity>
      </View>
      {value.length > 0 && (
        <View className="absolute top-12 left-0 right-0 bg-white h-full">
          {loading ? (
            <Text className="text-center w-full h-full text-sm text-gray-500 p-4">
              Searching...
            </Text>
          ) : results.length > 0 ? (
            <FlatList
              className="w-full bg-white"
              data={results}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Button
                  className="py-3 px-4"
                  onPress={() => {
                    setValue(item.title);
                    inputRef.current?.focus();
                  }}
                >
                  <Text className="text-base font-medium">{item.title}</Text>
                  <Text className="text-xs text-gray-500">{item.category}</Text>
                </Button>
              )}
            />
          ) : (
            <Text className=" w-full h-full text-center text-sm text-gray-500 p-4">
              No results found
            </Text>
          )}
          <View className="p-4 ">
            <Text className="text-sm font-bold text-orange-500 mb-2">
              TRENDING SEARCHES
            </Text>
            {trendingSearches.map((search, index) => (
              <Button
                key={index}
                className="flex-row w-full justify-start overflow-auto bg-white  py-2"
                onPress={() => {
                  setValue(search);
                  handleSearch(search);
                  inputRef.current?.focus();
                }}
              >
                <TrendingUp color={"orange"} size={24} />
                <Text>{search}</Text>
              </Button>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
