import React, { createContext, useContext, useState, useEffect } from "react";
import { settingsAPI } from "../services/api";

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Set default settings if loading fails
      setSettings({
        theme: {
          primaryColor: "#1e88e5",
          secondaryColor: "#64b5f6",
          accentColor: "#e3f2fd",
          backgroundGradient: {
            start: "#f5f5f5",
            end: "#e3f2fd",
            direction: "135deg",
          },
        },
        layout: {
          showFamilyMembers: true,
          showShoppingList: true,
          showIncomeExpenses: true,
          dashboardOrder: ["family", "budget", "shopping", "recent"],
        },
        components: {
          familyCard: {
            background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
            borderRadius: "12px",
            shadow: "0 4px 16px rgba(30, 136, 229, 0.15)",
          },
          budgetCard: {
            background: "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
            borderRadius: "12px",
            shadow: "0 4px 16px rgba(106, 27, 154, 0.15)",
          },
          shoppingCard: {
            background: "linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)",
            borderRadius: "12px",
            shadow: "0 4px 16px rgba(76, 175, 80, 0.15)",
          },
          recentActionsCard: {
            background: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
            borderRadius: "12px",
            shadow: "0 4px 16px rgba(255, 152, 0, 0.15)",
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await settingsAPI.updateSettings(newSettings);
      setSettings(response.data.settings);
      return { success: true };
    } catch (error) {
      console.error("Failed to update settings:", error);
      return { success: false, error };
    }
  };

  const resetSettings = async () => {
    try {
      const response = await settingsAPI.resetSettings();
      setSettings(response.data.settings);
      return { success: true };
    } catch (error) {
      console.error("Failed to reset settings:", error);
      return { success: false, error };
    }
  };

  const value = {
    settings,
    loading,
    updateSettings,
    resetSettings,
    loadSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
