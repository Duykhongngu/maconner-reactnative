import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
} from "react-native";

const CheckoutScreen: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = () => {
    // Xử lý thanh toán
    console.log("Submitting:", {
      firstName,
      lastName,
      address,
      city,
      state,
      zip,
      phone,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Thanh Toán</Text>

      <TextInput
        placeholder="Tên"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />
      <TextInput
        placeholder="Họ"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />
      <TextInput
        placeholder="Địa chỉ"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
      />
      <TextInput
        placeholder="Thành phố"
        value={city}
        onChangeText={setCity}
        style={styles.input}
      />
      <TextInput
        placeholder="Tiểu bang"
        value={state}
        onChangeText={setState}
        style={styles.input}
      />
      <TextInput
        placeholder="Mã ZIP"
        value={zip}
        onChangeText={setZip}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Số điện thoại"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
        keyboardType="phone-pad"
      />

      <Button title="Gửi" onPress={handleSubmit} />

      <View style={styles.summary}>
        <Text style={styles.summaryText}>Tổng giá: $19.95</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  summary: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 5,
  },
  summaryText: {
    fontSize: 18,
  },
});

export default CheckoutScreen;
