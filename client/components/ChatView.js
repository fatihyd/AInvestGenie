import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigate } from "react-router-native";

const ChatView = () => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [token, setToken] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("userToken");
        if (savedToken) {
          setToken(savedToken);
          fetchConversations(savedToken);
        } else {
          console.error("No token found");
        }
      } catch (error) {
        console.error("Error retrieving token:", error);
      }
    };
    loadToken();
  }, []);

  const fetchConversations = async (token) => {
    try {
      const response = await fetch("http://10.0.2.2:5001/conversations", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.error("Unauthorized access. Invalid token.");
        return;
      }

      const data = await response.json();
      if (data.length > 0) {
        const firstConversation = data[0];
        setConversationId(firstConversation._id);
        setMessages(
          firstConversation.messages.map((msg) => ({
            text: msg.text,
            type: msg.sender,
          }))
        );
      } else {
        createNewConversation(token);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const createNewConversation = async (token) => {
    try {
      const response = await fetch("http://10.0.2.2:5001/conversations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.error("Unauthorized access. Invalid token.");
        return;
      }

      const newConversation = await response.json();
      setConversationId(newConversation._id);
    } catch (error) {
      console.error("Error creating new conversation:", error);
    }
  };

  const handleSend = async () => {
    if (text.trim()) {
      const newMessage = { text, type: "user" };
      setMessages([...messages, newMessage]);
      setText("");

      try {
        const response = await fetch(
          `http://10.0.2.2:5001/messages/${conversationId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ text, sender: "user" }),
          }
        );

        const responseText = await response.text();
        console.log("Raw response:", responseText);

        if (response.status === 401) {
          console.error("Unauthorized access. Invalid token.");
          return;
        }

        const data = JSON.parse(responseText);
        if (data.text) {
          const responseMessage = { text: data.text, type: "bot" };
          setMessages((prevMessages) => [...prevMessages, responseMessage]);
        } else {
          console.error("No response from the server");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Button
          icon="menu"
          onPress={() => navigate("/menu")}
          style={styles.menuButton}
        >
          Menü
        </Button>
        <Button
          icon="chat"
          onPress={() => createNewConversation(token)}
          style={styles.newChatButton}
        >
          Yeni Sohbet
        </Button>
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView style={styles.messageContainer}>
          {messages.map((message, index) => (
            <View
              key={index}
              style={
                message.type === "user" ? styles.userMessage : styles.botMessage
              }
            >
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            label="Mesajınızı buraya yazın..."
            value={text}
            onChangeText={setText}
            style={styles.input}
          />
          <Button icon="send" onPress={handleSend} style={styles.sendButton}>
            Gönder
          </Button>
        </View>
      </KeyboardAvoidingView>
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
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  menuButton: {
    margin: 10,
  },
  newChatButton: {
    margin: 10,
  },
  messageContainer: {
    flex: 1,
    padding: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  input: {
    flex: 1,
    marginRight: 10,
  },
  sendButton: {
    marginBottom: 6,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#dcf8c6",
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
    maxWidth: "80%",
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ebebeb",
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
    maxWidth: "80%",
    borderColor: "#ccc",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  messageText: {
    fontSize: 16,
  },
});

export default ChatView;
