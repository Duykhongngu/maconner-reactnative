import * as React from "react";
import { ScrollView, SafeAreaView, StyleSheet } from "react-native";
import HomePage from "~/app/Home/index";

export default function Screen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <HomePage />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Đặt màu nền để tránh xung đột
  },
  scrollView: {
    flex: 1,
  },
});
