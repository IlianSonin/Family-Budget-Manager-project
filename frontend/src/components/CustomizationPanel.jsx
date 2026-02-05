import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useSettings } from "../context/SettingsContext";

const CustomizationPanel = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("theme");
  const [tempSettings, setTempSettings] = useState(settings);

  // Sync tempSettings with settings when they change
  useEffect(() => {
    if (settings) {
      setTempSettings(settings);
    }
  }, [settings]);

  if (!isOpen || !settings) return null;

  const handleSave = async () => {
    const result = await updateSettings(tempSettings);
    if (result.success) {
      onClose();
    }
  };

  const handleReset = async () => {
    if (
      window.confirm("Are you sure you want to reset all settings to default?")
    ) {
      const result = await resetSettings();
      if (result.success) {
        // Reset tempSettings to default values
        setTempSettings({
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
        onClose();
      }
    }
  };

  const updateTempSettings = (path, value) => {
    setTempSettings((prev) => {
      const newSettings = { ...prev };
      const keys = path.split(".");
      let current = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0, color: "#333" }}>Customize Dashboard</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            marginBottom: "20px",
            borderBottom: "1px solid #eee",
          }}
        >
          {["theme", "layout", "components"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "10px 20px",
                border: "none",
                background: activeTab === tab ? "#1e88e5" : "transparent",
                color: activeTab === tab ? "white" : "#666",
                borderRadius: "8px 8px 0 0",
                cursor: "pointer",
                fontWeight: "500",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ marginBottom: "20px" }}>
          {activeTab === "theme" && (
            <div>
              <h3 style={{ marginBottom: "15px", color: "#555" }}>
                Theme Colors
              </h3>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Main Theme Color (Primary Buttons & Links)
                </label>
                <input
                  type="color"
                  value={tempSettings.theme.primaryColor}
                  onChange={(e) =>
                    updateTempSettings("theme.primaryColor", e.target.value)
                  }
                  style={{
                    width: "60px",
                    height: "40px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
                <div
                  style={{ marginTop: "5px", fontSize: "14px", color: "#666" }}
                >
                  Used for primary action buttons, navigation links, and main
                  interactive elements
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Secondary Theme Color (Secondary Buttons)
                </label>
                <input
                  type="color"
                  value={tempSettings.theme.secondaryColor}
                  onChange={(e) =>
                    updateTempSettings("theme.secondaryColor", e.target.value)
                  }
                  style={{
                    width: "60px",
                    height: "40px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
                <div
                  style={{ marginTop: "5px", fontSize: "14px", color: "#666" }}
                >
                  Used for secondary buttons and supporting UI elements
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Accent Color (Highlights & Special Elements)
                </label>
                <input
                  type="color"
                  value={tempSettings.theme.accentColor}
                  onChange={(e) =>
                    updateTempSettings("theme.accentColor", e.target.value)
                  }
                  style={{
                    width: "60px",
                    height: "40px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
                <div
                  style={{ marginTop: "5px", fontSize: "14px", color: "#666" }}
                >
                  Used for highlights, special icons, and accent decorative
                  elements
                </div>
              </div>

              <h3
                style={{
                  marginBottom: "15px",
                  marginTop: "25px",
                  color: "#555",
                }}
              >
                Page Background Gradient
              </h3>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Background Start Color (Top)
                </label>
                <input
                  type="color"
                  value={tempSettings.theme.backgroundGradient.start}
                  onChange={(e) =>
                    updateTempSettings(
                      "theme.backgroundGradient.start",
                      e.target.value,
                    )
                  }
                  style={{
                    width: "60px",
                    height: "40px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
                <div
                  style={{ marginTop: "5px", fontSize: "14px", color: "#666" }}
                >
                  The color at the top of the page background
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Background End Color (Bottom)
                </label>
                <input
                  type="color"
                  value={tempSettings.theme.backgroundGradient.end}
                  onChange={(e) =>
                    updateTempSettings(
                      "theme.backgroundGradient.end",
                      e.target.value,
                    )
                  }
                  style={{
                    width: "60px",
                    height: "40px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
                <div
                  style={{ marginTop: "5px", fontSize: "14px", color: "#666" }}
                >
                  The color at the bottom of the page background
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Gradient Direction (0-360°)
                </label>
                <input
                  type="number"
                  value={parseInt(
                    tempSettings.theme.backgroundGradient.direction,
                  )}
                  onChange={(e) =>
                    updateTempSettings(
                      "theme.backgroundGradient.direction",
                      `${e.target.value}deg`,
                    )
                  }
                  min="0"
                  max="360"
                  style={{
                    width: "80px",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
                <div
                  style={{ marginTop: "5px", fontSize: "14px", color: "#666" }}
                >
                  Direction of the gradient flow (0° = left to right, 90° = top
                  to bottom, etc.)
                </div>
              </div>
            </div>
          )}

          {activeTab === "layout" && (
            <div>
              <h3 style={{ marginBottom: "15px", color: "#555" }}>
                Dashboard Elements
              </h3>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={tempSettings.layout.showFamilyMembers}
                    onChange={(e) =>
                      updateTempSettings(
                        "layout.showFamilyMembers",
                        e.target.checked,
                      )
                    }
                    style={{ marginRight: "10px" }}
                  />
                  <span style={{ fontWeight: "500" }}>
                    Show Family Members Section
                  </span>
                </label>
                <p
                  style={{
                    margin: "5px 0 0 25px",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  Display the family members card on your dashboard
                </p>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={tempSettings.layout.showShoppingList}
                    onChange={(e) =>
                      updateTempSettings(
                        "layout.showShoppingList",
                        e.target.checked,
                      )
                    }
                    style={{ marginRight: "10px" }}
                  />
                  <span style={{ fontWeight: "500" }}>
                    Show Shopping List Section
                  </span>
                </label>
                <p
                  style={{
                    margin: "5px 0 0 25px",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  Display the shopping list card on your dashboard
                </p>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={tempSettings.layout.showIncomeExpenses}
                    onChange={(e) =>
                      updateTempSettings(
                        "layout.showIncomeExpenses",
                        e.target.checked,
                      )
                    }
                    style={{ marginRight: "10px" }}
                  />
                  <span style={{ fontWeight: "500" }}>
                    Show Income & Expenses Section
                  </span>
                </label>
                <p
                  style={{
                    margin: "5px 0 0 25px",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  Display the budget summary card on your dashboard
                </p>
              </div>
            </div>
          )}

          {activeTab === "components" && (
            <div>
              <h3 style={{ marginBottom: "15px", color: "#555" }}>
                Component Styling
              </h3>

              <div
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                  Family Members Card
                </h4>
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                    }}
                  >
                    Background Gradient
                  </label>
                  <input
                    type="text"
                    value={tempSettings.components.familyCard.background}
                    onChange={(e) =>
                      updateTempSettings(
                        "components.familyCard.background",
                        e.target.value,
                      )
                    }
                    placeholder="linear-gradient(135deg, #color1 0%, #color2 100%)"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                  Budget Summary Card
                </h4>
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                    }}
                  >
                    Background Gradient
                  </label>
                  <input
                    type="text"
                    value={tempSettings.components.budgetCard.background}
                    onChange={(e) =>
                      updateTempSettings(
                        "components.budgetCard.background",
                        e.target.value,
                      )
                    }
                    placeholder="linear-gradient(135deg, #color1 0%, #color2 100%)"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                  Shopping List Card
                </h4>
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                    }}
                  >
                    Background Gradient
                  </label>
                  <input
                    type="text"
                    value={tempSettings.components.shoppingCard.background}
                    onChange={(e) =>
                      updateTempSettings(
                        "components.shoppingCard.background",
                        e.target.value,
                      )
                    }
                    placeholder="linear-gradient(135deg, #color1 0%, #color2 100%)"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                  Recent Actions Card
                </h4>
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                    }}
                  >
                    Background Gradient
                  </label>
                  <input
                    type="text"
                    value={tempSettings.components.recentActionsCard.background}
                    onChange={(e) =>
                      updateTempSettings(
                        "components.recentActionsCard.background",
                        e.target.value,
                      )
                    }
                    placeholder="linear-gradient(135deg, #color1 0%, #color2 100%)"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <button
            onClick={handleReset}
            style={{
              padding: "12px 24px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Reset to Default
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "12px 24px",
                background: "#666",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              style={{
                padding: "12px 24px",
                background: "#1e88e5",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CustomizationPanel;
