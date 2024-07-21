import React from "react";
import { SafeAreaView, View, StyleSheet, Image } from "react-native";
import { Button } from "react-native-paper";
import { useNavigate } from "react-router-native";

const MainView = () => {
  const navigate = useNavigate();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          style={styles.companyLogo}
          source={require("../assets/app_logo.webp")}
        />
        <Button
          mode="contained"
          onPress={() => navigate("/login")}
          style={styles.loginButton}
        >
          Giriş Yap
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigate("/signup")}
          style={styles.signupButton}
          labelStyle={styles.signupButtonText}
        >
          Üye Ol
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loginButton: {
    marginVertical: 8,
    width: "80%",
    backgroundColor: "rgb(23, 75, 160)",
  },
  signupButton: {
    marginVertical: 8,
    width: "80%",
  },
  signupButtonText: {
    color: "rgb(23, 75, 160)",
  },
  companyLogo: {
    marginBottom: 80,
    width: 400,
    height: 400,
  },
});

export default MainView;
