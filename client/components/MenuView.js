import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { Button } from "react-native-paper";
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MenuView = () => {
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.error("No token found");
          return;
        }

        const response = await fetch(
          "https://ainvestgenieserver.adaptable.app/conversations",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          console.error("Unauthorized access. Invalid token.");
          return;
        }

        const data = await response.json();
        setConversations(data.reverse());
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    fetchConversations();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("seenModal");
      navigate("/");
    } catch (error) {
      console.error("Logout Error:", error);
      alert("Error logging out");
    }
  };

  const handleConversationClick = (conversationId) => {
    navigate("/chat", { state: { conversationId } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Button
        icon="arrow-left"
        mode="text"
        onPress={() => navigate(-1)}
        style={styles.backButton}
        labelStyle={styles.backButtonText}
      >
        Sohbet
      </Button>

      <View style={styles.container}>
        <ScrollView>
          {conversations.map((conversation, index) => (
            <TouchableOpacity
              key={conversation._id}
              style={styles.conversationItem}
              onPress={() => handleConversationClick(conversation._id)}
            >
              <Text style={styles.conversationTitle}>
                Chat #{conversations.length - index}
              </Text>
            </TouchableOpacity>
          ))}
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
  conversationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  conversationTitle: {
    fontSize: 16,
    color: "#333",
  },
  backButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    marginLeft: 10,
  },
  backButtonText: {
    color: "rgb(23, 75, 160)",
  },
  button: {
    marginTop: 16,
    backgroundColor: "rgb(23, 75, 160)",
  },
});

export default MenuView;
