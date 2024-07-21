import React, { useState, useEffect } from "react"; // Import React and necessary hooks
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native"; // Import necessary React Native components
import { Button, TextInput } from "react-native-paper"; // Import Button and TextInput from react-native-paper
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage for storing and retrieving data
import { useNavigate } from "react-router-native"; // Import useNavigate for navigation

const ChatView = () => {
  const [text, setText] = useState(""); // State to hold the input text
  const [messages, setMessages] = useState([]); // State to hold the list of messages
  const [token, setToken] = useState(""); // State to hold the JWT token
  const [conversationId, setConversationId] = useState(null); // State to hold the current conversation ID
  const navigate = useNavigate(); // Hook for navigation

  // useEffect to load the token from AsyncStorage when the component mounts
  useEffect(() => {
    const loadToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("userToken"); // Retrieve token from AsyncStorage
        if (savedToken) {
          setToken(savedToken); // Set the token state
          fetchConversations(savedToken); // Fetch conversations with the retrieved token
        } else {
          console.error("No token found"); // Log error if no token is found
        }
      } catch (error) {
        console.error("Error retrieving token:", error); // Log error if there's an issue retrieving the token
      }
    };
    loadToken(); // Call loadToken function
  }, []);

  // Function to fetch conversations from the backend
  const fetchConversations = async (token) => {
    try {
      const response = await fetch("http://10.0.2.2:5001/conversations", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Include token in headers for authentication
        },
      });

      if (response.status === 401) {
        console.error("Unauthorized access. Invalid token."); // Log error if unauthorized
        return;
      }

      const data = await response.json();
      if (data.length > 0) {
        const firstConversation = data[0]; // Get the first conversation
        setConversationId(firstConversation._id); // Set the conversation ID
        setMessages(
          firstConversation.messages.map((msg) => ({
            text: msg.text,
            type: msg.sender,
          }))
        ); // Set messages state with the messages from the conversation
      } else {
        createNewConversation(token); // Create a new conversation if none exist
      }
    } catch (error) {
      console.error("Error fetching conversations:", error); // Log error if there's an issue fetching conversations
    }
  };

  // Function to create a new conversation
  const createNewConversation = async (token) => {
    try {
      const response = await fetch("http://10.0.2.2:5001/conversations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Include token in headers for authentication
        },
      });

      if (response.status === 401) {
        console.error("Unauthorized access. Invalid token."); // Log error if unauthorized
        return;
      }

      const newConversation = await response.json();
      setConversationId(newConversation._id); // Set the new conversation ID
    } catch (error) {
      console.error("Error creating new conversation:", error); // Log error if there's an issue creating a new conversation
    }
  };

  // Function to handle sending a message
  const handleSend = async () => {
    if (text.trim()) {
      const newMessage = { text, type: "user" }; // Create a new message object
      setMessages([...messages, newMessage]); // Add the new message to the messages state
      setText(""); // Clear the input text

      try {
        const response = await fetch(
          `http://10.0.2.2:5001/messages/${conversationId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // Include token in headers for authentication
            },
            body: JSON.stringify({ text, sender: "user" }), // Send message text and sender as the request body
          }
        );

        const responseText = await response.text();
        console.log("Raw response:", responseText); // Log the raw response

        if (response.status === 401) {
          console.error("Unauthorized access. Invalid token."); // Log error if unauthorized
          return;
        }

        const data = JSON.parse(responseText); // Parse the response as JSON
        if (data.text) {
          const responseMessage = { text: data.text, type: "bot" }; // Create a response message object
          setMessages((prevMessages) => [...prevMessages, responseMessage]); // Add the response message to the messages state
        } else {
          console.error("No response from the server"); // Log error if there's no response text
        }
      } catch (error) {
        console.error("Error:", error); // Log error if there's an issue sending the message
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
