import React, { useState } from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LoginView = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch("http://10.0.2.2:5001/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem("userToken", data.token);
        navigate("/chat");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Error logging in");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Button
        icon="arrow-left"
        mode="contained"
        onPress={() => navigate("/")}
        style={styles.backButton}
      >
        Ana Sayfa
      </Button>
      <View style={styles.container}>
        <TextInput
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <Button onPress={handleLogin} mode="contained" style={styles.button}>
          Giriş Yap
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: 50,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    marginLeft: 10,
    backgroundColor: "rgba(116, 140, 244, 0.5)",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "rgba(116, 140, 244, 0.3)",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#748cf4",
  },
});

export default LoginView;