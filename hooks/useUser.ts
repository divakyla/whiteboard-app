// hooks/useUser.ts
import { useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
  email?: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user exists in localStorage
    const savedUser = localStorage.getItem("canvas-user");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("canvas-user");
      }
    }

    setIsLoading(false);
  }, []);

  const login = (userData: { username: string; email?: string }) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      username: userData.username,
      email: userData.email,
    };

    setUser(newUser);
    localStorage.setItem("canvas-user", JSON.stringify(newUser));

    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("canvas-user");
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("canvas-user", JSON.stringify(updatedUser));
  };

  return {
    user,
    isLoading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };
}
