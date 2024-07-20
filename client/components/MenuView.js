import React from "react";
import { SafeAreaView, View, StyleSheet, ScrollView, Text } from "react-native";
import { Button } from "react-native-paper";
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MenuView = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      navigate("/");
    } catch (error) {
      console.error("Logout Error:", error);
      alert("Error logging out");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Button
        icon="arrow-left"
        mode="contained"
        onPress={() => navigate("/chat")}
        style={styles.backButton}
      >
        Sohbet
      </Button>

      <View style={styles.container}>
        <ScrollView>
          <Text>...</Text>
        </ScrollView>
        <Button onPress={handleLogout} mode="contained" style={styles.button}>
          Çıkış Yap
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
    padding: 20,
  },
  message: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    marginLeft: 10,
    backgroundColor: "rgba(116, 140, 244, 0.5)",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#748cf4",
  },
});

export default MenuView;