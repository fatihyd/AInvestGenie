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
      const response = await fetch(
        "https://ainvestgenieserver.adaptable.app/users/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fullName, email, password }),
        }
      );
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
        mode="text"
        onPress={() => navigate("/")}
        style={styles.backButton}
        labelStyle={styles.backButtonText}
      >
        Ana Sayfa
      </Button>
      <View style={styles.container}>
        <TextInput
          label="Ad Soyad"
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
          theme={{
            colors: {
              primary: "rgb(23, 75, 160)", // Change this to your desired focus color
            },
          }}
        />
        <TextInput
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          theme={{
            colors: {
              primary: "rgb(23, 75, 160)", // Change this to your desired focus color
            },
          }}
        />
        <TextInput
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          theme={{
            colors: {
              primary: "rgb(23, 75, 160)", // Change this to your desired focus color
            },
          }}
          secureTextEntry
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
  },
  backButtonText: {
    color: "rgb(23, 75, 160)",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#eeeeee",
  },
  button: {
    marginTop: 16,
    backgroundColor: "rgb(23, 75, 160)",
  },
});

export default SignUpView;
