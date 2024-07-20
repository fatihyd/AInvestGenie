import React, { useState } from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useNavigate } from "react-router-native";

const SignUpView = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async () => {
    try {
      const response = await fetch("http://10.0.2.2:5001/users/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        navigate("/");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Signup Error:", error);
      alert("Error signing up");
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
          label="İsim Soyisim"
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
        />
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
        <Button onPress={handleSignUp} mode="contained" style={styles.button}>
          Üye Ol
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

export default SignUpView;
