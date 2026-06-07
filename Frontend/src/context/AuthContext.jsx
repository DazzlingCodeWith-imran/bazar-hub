import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);

  // App load hote hi token axios header mein set karo
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (token && storedUser) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setIsLoggedIn(true);
      setUser(storedUser);
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    axios.defaults.headers.common["Authorization"] = "";
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};