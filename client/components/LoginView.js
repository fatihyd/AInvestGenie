import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  Button,
  TextInput,
  Modal,
  Portal,
  Text,
  IconButton,
} from "react-native-paper";
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LoginView = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://ainvestgenieserver.adaptable.app/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem("userToken", data.token);
        setShowCheckmark(true);
        setTimeout(() => {
          createNewConversation(data.token);
        }, 1000); // Show checkmark for 1 second before navigating
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Error logging in");
    } finally {
      setLoading(false);
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
      navigate("/chat", { state: { conversationId: newConversation._id } });
    } catch (error) {
      console.error("Error creating new conversation:", error);
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
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          theme={{
            colors: {
              primary: "rgb(23, 75, 160)",
            },
          }}
        />
        <TextInput
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          theme={{
            colors: {
              primary: "rgb(23, 75, 160)",
            },
          }}
        />
        <Button onPress={handleLogin} mode="contained" style={styles.button}>
          Giriş Yap
        </Button>
      </View>

      <Portal>
        <Modal
          visible={loading}
          dismissable={false}
          contentContainerStyle={styles.modal}
        >
          {showCheckmark ? (
            <>
              <IconButton
                icon="check-circle"
                color="rgb(23, 75, 160)"
                size={50}
              />
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color="rgb(23, 75, 160)" />
            </>
          )}
        </Modal>
      </Portal>
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
  modal: {
    alignSelf: "center",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    marginTop: 10,
  },
});

export default LoginView;
