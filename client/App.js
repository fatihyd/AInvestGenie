import React from "react";
import { MemoryRouter as Router, Routes, Route } from "react-router-native";
import MainView from "./components/MainView";
import LoginView from "./components/LoginView";
import SignUpView from "./components/SignUpView";
import ChatView from "./components/ChatView";
import MenuView from "./components/MenuView";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/signup" element={<SignUpView />} />
        <Route path="/chat" element={<ChatView />} />
        <Route path="/chat/:conversationId" element={<ChatView />} />
        <Route path="/menu" element={<MenuView />} />
        <Route path="*" element={<MainView />} />
      </Routes>
    </Router>
  );
};

export default App;
