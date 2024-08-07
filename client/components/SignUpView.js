import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
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

const SignUpView = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // New state for modal visibility
  const navigate = useNavigate();

  const handleSignUp = async () => {
    setLoading(true);
    setModalVisible(true); // Show modal when loading starts
    try {
      const response = await fetch(
        "https://ainvestgenieserver.adaptable.app/users/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fullName, email, password }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setLoading(false);
        setShowCheckmark(true);
        setTimeout(() => {
          setModalVisible(false); // Hide modal after showing checkmark
          navigate("/");
        }, 500); // Show checkmark for 2 seconds before navigating
      } else {
        setModalVisible(false); // Hide modal if there's an error
        alert(data.message);
      }
    } catch (error) {
      console.error("Signup Error:", error);
      alert("Error signing up");
      setModalVisible(false); // Hide modal on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            label="Ad Soyad"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            theme={{
              colors: {
                primary: "rgb(23, 75, 160)",
              },
            }}
          />
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
            autoCapitalize="none"
          />
          <TextInput
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            theme={{
              colors: {
                primary: "rgb(23, 75, 160)",
              },
            }}
            secureTextEntry
            autoCapitalize="none"
          />
          <Button onPress={handleSignUp} mode="contained" style={styles.button}>
            Üye Ol
          </Button>
        </View>

        <Portal>
          <Modal
            visible={modalVisible} // Use new state to control modal visibility
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

export default SignUpView;
