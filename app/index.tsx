import { ScrollView, SafeAreaView, StyleSheet, View } from "react-native";
import HomePage from "~/app/Home/index";
import Footer from "./Footer/Footer";

export default function Screen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          <HomePage />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});
