import * as React from "react";
import { ScrollView } from "react-native";
import HomePage from "~/app/Home/index";

export default function Screen() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <HomePage />
    </ScrollView>
  );
}
