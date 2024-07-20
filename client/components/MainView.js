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
          source={require("../assets/app_logo.png")}
        />
        <Button
          mode="contained"
          onPress={() => navigate("/login")}
          style={styles.button}
        >
          Giriş Yap
        </Button>
        <Button
          mode="contained"
          onPress={() => navigate("/signup")}
          style={styles.button}
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
  button: {
    marginVertical: 8,
    width: "80%",
    backgroundColor: "#748cf4",
  },
  companyLogo: {
    marginBottom: 80,
    width: 250,
    height: 250,
  },
});

export default MainView;
