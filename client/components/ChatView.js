import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { useNavigate } from "react-router-native";

const ChatView = () => {
  const navigate = useNavigate();

  return (
    <View style={styles.container}>
      <Text>burası CHAT</Text>
      <Button mode="contained" onPress={() => navigate("/menu")}>
        menüye git
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatView;
