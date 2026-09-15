// context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  getToken,
  setToken as persistToken,
  login as apiLogin,
  signup as apiSignup,
  getMe,
  updateUser as apiUpdateUser, // Import the new function
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const userData = await getMe();
        setUser(userData);
      } catch {
        persistToken(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function login(credentials) {
    const { token, user: loggedInUser } = await apiLogin(credentials);
    persistToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function signup(details) {
    const { token, user: newUser } = await apiSignup(details);
    persistToken(token);
    setUser(newUser);
    return newUser;
  }

  // Add this function to update user data
  async function updateUser(userData) {
    const updatedUser = await apiUpdateUser(userData);
    setUser(updatedUser);
    return updatedUser;
  }

  function logout() {
    persistToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateUser, // Add this to the context
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
