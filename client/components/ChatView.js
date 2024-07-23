import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigate, useLocation } from "react-router-native";

const ChatView = () => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [token, setToken] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadTokenAndConversation = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("userToken");
        if (savedToken) {
          setToken(savedToken);
          const convId = location.state?.conversationId;
          if (convId) {
            setConversationId(convId);
            fetchConversationMessages(savedToken, convId);
          } else {
            fetchConversations(savedToken);
          }
        } else {
          console.error("No token found");
        }
      } catch (error) {
        console.error("Error retrieving token:", error);
      }
    };
    loadTokenAndConversation();
  }, [location.state]);

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

  const fetchConversationMessages = async (token, convId) => {
    try {
      const response = await fetch(
        `http://10.0.2.2:5001/conversations/${convId}`,
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

      const conversation = await response.json();
      setMessages(
        conversation.messages.map((msg) => ({
          text: msg.text,
          type: msg.sender,
        }))
      );
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
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

      // Fetch the messages of the new conversation
      const messagesResponse = await fetch(
        `http://10.0.2.2:5001/conversations/${newConversation._id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (messagesResponse.status === 401) {
        console.error("Unauthorized access. Invalid token.");
        return;
      }

      const conversation = await messagesResponse.json();
      setMessages(
        conversation.messages.map((msg) => ({
          text: msg.text,
          type: msg.sender,
        }))
      );
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
        // Save the user's message to the database
        const userMessageResponse = await fetch(
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

        if (userMessageResponse.status === 401) {
          console.error("Unauthorized access. Invalid token.");
          return;
        }

        // Fetch response from the OpenAI endpoint
        const response = await fetch(`http://10.0.2.2:5001/openai/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text }),
        });

        const responseText = await response.text();
        console.log("Raw response:", responseText);

        if (response.status === 401) {
          console.error("Unauthorized access. Invalid token.");
          return;
        }

        handleChatResponse(responseText);
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const handleChatResponse = async (responseText) => {
    const data = JSON.parse(responseText);
    if (data.response) {
      const responseMessage = { text: data.response, type: "bot" };
      setMessages((prevMessages) => [...prevMessages, responseMessage]);

      try {
        console.log("Attempting to save bot response to database");
        const response = await fetch(
          `http://10.0.2.2:5001/messages/${conversationId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ text: data.response, sender: "bot" }),
          }
        );

        if (response.ok) {
          console.log("Bot response saved successfully.");
        } else {
          console.error("Failed to save bot response:", response.status);
        }
      } catch (error) {
        console.error("Error saving bot response:", error);
      }
    } else {
      console.error("No response from the server");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Button
          icon="menu"
          mode="text"
          onPress={() => navigate("/menu")}
          style={styles.menuButton}
          labelStyle={styles.buttonTexts}
        >
          Menü
        </Button>
        <Button
          icon="chat"
          onPress={() => createNewConversation(token)}
          style={styles.newChatButton}
          labelStyle={styles.buttonTexts}
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
              style={[
                styles.messageWrapper,
                message.type === "user"
                  ? styles.userMessageWrapper
                  : styles.botMessageWrapper,
              ]}
            >
              {message.type === "bot" && (
                <Image
                  source={require("../assets/bot.png")}
                  style={styles.botImage}
                />
              )}
              <View
                style={
                  message.type === "user"
                    ? styles.userMessage
                    : styles.botMessage
                }
              >
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
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
            theme={{
              colors: {
                primary: "rgb(23, 75, 160)",
              },
            }}
          />
          <Button
            icon="send"
            onPress={handleSend}
            style={styles.sendButton}
            labelStyle={styles.buttonTexts}
          >
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
  messageWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  userMessageWrapper: {
    justifyContent: "flex-end",
  },
  botMessageWrapper: {
    justifyContent: "flex-start",
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
  buttonTexts: {
    color: "rgb(23, 75, 160)",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#dcf8c6",
    borderRadius: 20,
    padding: 10,
    maxWidth: "80%",
  },
  botMessageWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ebebeb",
    borderRadius: 20,
    padding: 10,
    maxWidth: "80%",
    borderColor: "#ccc",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  botImage: {
    width: 35,
    height: 35,
    marginRight: 10,
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
});

export default ChatView;
