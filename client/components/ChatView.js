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
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigate, useLocation } from "react-router-native";
import Modal from "react-native-modal";
import { LinearGradient } from "expo-linear-gradient";

const ChatView = () => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [token, setToken] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initialize = async () => {
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
          const seenModal = await AsyncStorage.getItem("seenModal");
          if (!seenModal) {
            setModalVisible(true);
          }
        } else {
          console.error("No token found");
        }
      } catch (error) {
        console.error("Error retrieving token:", error);
      }
    };
    initialize();
  }, [location.state]);

  const fetchConversations = async (token) => {
    try {
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
        `https://ainvestgenieserver.adaptable.app/conversations/${convId}`,
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
      const response = await fetch(
        "https://ainvestgenieserver.adaptable.app/conversations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        console.error("Unauthorized access. Invalid token.");
        return;
      }

      const newConversation = await response.json();
      setConversationId(newConversation._id);

      const messagesResponse = await fetch(
        `https://ainvestgenieserver.adaptable.app/conversations/${newConversation._id}`,
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
      setIsTyping(true);

      try {
        const userMessageResponse = await fetch(
          `https://ainvestgenieserver.adaptable.app/messages/${conversationId}`,
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

        const response = await fetch(
          `https://ainvestgenieserver.adaptable.app/openai/query`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message: text }),
          }
        );

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
      setIsTyping(false);

      try {
        console.log("Attempting to save bot response to database");
        const response = await fetch(
          `https://ainvestgenieserver.adaptable.app/messages/${conversationId}`,
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

  const handleConfirm = async () => {
    setModalVisible(false);
    await AsyncStorage.setItem("seenModal", "true");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            {isTyping && (
              <View style={styles.typingIndicator}>
                <Image
                  source={require("../assets/typing.gif")}
                  style={styles.typingGif}
                />
              </View>
            )}
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
        <Modal
          isVisible={modalVisible}
          backdropColor="rgba(0, 0, 0, 0.5)"
          backdropOpacity={1}
          useNativeDriver={true}
          style={styles.modal}
        >
          <LinearGradient
            colors={["rgba(23, 75, 160, 0.3)", "rgba(23, 75, 160, 0.8)"]}
            style={styles.gradient}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>
                  Bu uygulamadaki yatırım tavsiyeleri kesinlik içermemektedir.
                  Yatırım kararlarınızı alırken, piyasa koşullarını ve
                  risklerini dikkatlice değerlendirmeniz önemlidir. Alacağınız
                  kararların sorumluluğu tamamen size aittir.
                </Text>
                <Button
                  mode="contained"
                  onPress={handleConfirm}
                  style={styles.modalButton}
                >
                  Anladım
                </Button>
              </View>
            </View>
          </LinearGradient>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  // Typing indicator styles
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 10,
  },
  typingGif: {
    width: 80,
    height: 90,
    marginLeft: -10,
  },
  // Modal styles
  modal: {
    justifyContent: "center",
    margin: 0,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
  },
  modalContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "rgb(23, 75, 160)",
  },
});

export default ChatView;
