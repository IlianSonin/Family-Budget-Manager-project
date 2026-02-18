import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";
import api, { familyAdminAPI, remindersAPI } from "../services/api";
import QuickAddModal from "../components/QuickAddModal";
import EditBudgetItem from "../components/EditBudgetItem";
import ShoppingList from "../components/ShoppingList";
import { NotificationContext } from "../context/NotificationContext";
import { useSettings } from "../context/SettingsContext";
import CustomizationPanel from "../components/CustomizationPanel";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function getMonthOptions() {
  const options = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1,
    );
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
    options.push({ value, label });
  }
  return options;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [family, setFamily] = useState(null);
  const [recent, setRecent] = useState([]);
  const [memberStats, setMemberStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { addNotification } = useContext(NotificationContext);
  const { settings } = useSettings();
  const [showCustomization, setShowCustomization] = useState(false);
  const navigate = useNavigate();
  const lastPermissionCountRef = useRef(0);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const monthOptions = useMemo(() => getMonthOptions(), []);

  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showCompletedReminders, setShowCompletedReminders] = useState(false);
  const [shownReminderToasts, setShownReminderToasts] = useState(new Set());

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMenuDropdown &&
        !event.target.closest(".dropdown-menu") &&
        !event.target.closest('button[title="Menu"]')
      ) {
        setShowMenuDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenuDropdown]);

  const loadData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setError(null);
          setLoading(true);
        }

        console.log("Loading data for month:", selectedMonth);

        // Load data individually to handle errors better
        let summaryRes = {
          data: { income: 0, expenses: 0, balance: 0, items: [] },
        };
        try {
          summaryRes = await api.get("/budget/summary", {
            params: { month: selectedMonth },
          });
        } catch (summaryError) {
          console.log(
            "Budget summary failed (expected if no family):",
            summaryError.response?.data?.message,
          );
          // Use default empty data
        }

        let categoriesRes = { data: [] };
        try {
          categoriesRes = await api.get("/budget/categories", {
            params: { month: selectedMonth },
          });
        } catch (categoriesError) {
          console.log(
            "Budget categories failed (expected if no family):",
            categoriesError.response?.data?.message,
          );
          // Use default empty data
        }

        // Family data might fail if user has no family, so handle it separately
        let familyRes = { data: null };
        try {
          familyRes = await api.get("/family/my");
        } catch (familyError) {
          console.log(
            "Family data failed (expected if no family):",
            familyError.response?.data?.message,
          );
          // Don't fail the whole load if family fails
        }

        let recentRes = { data: [] };
        try {
          recentRes = await api.get("/budget/recent", {
            params: { month: selectedMonth },
          });
        } catch (recentError) {
          console.log(
            "Recent budget items failed (expected if no family):",
            recentError.response?.data?.message,
          );
          // Use default empty data
        }

        // Member stats might fail if user has no family, so handle it separately
        let memberStatsRes = { data: [] };
        try {
          memberStatsRes = await api.get("/budget/member-stats", {
            params: { month: selectedMonth },
          });
        } catch (memberStatsError) {
          console.log(
            "Member stats failed (expected if no family):",
            memberStatsError.response?.data?.message,
          );
          // Don't fail the whole load if member stats fails
        }

        // Load reminders
        let remindersRes = { data: [] };
        try {
          remindersRes = await remindersAPI.getReminders(selectedMonth);
        } catch (remindersError) {
          console.log(
            "Reminders failed:",
            remindersError.response?.data?.message,
          );
        }

        let meRes = { data: null };
        try {
          meRes = await api.get("/auth/me");
        } catch (meError) {
          console.log("Auth me failed:", meError.response?.data?.message);
          // If auth fails, redirect to login
          if (meError.response?.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }
          throw meError; // Re-throw if not auth error
        }

        setFamily(familyRes.data);
        setSummary(summaryRes.data);
        setCategories(categoriesRes.data);
        setRecent(recentRes.data);
        setMemberStats(memberStatsRes.data);
        setReminders(remindersRes.data);
        setCurrentUser(meRes.data);

        // Debug: Log family members for reminder creation
        console.log("Family data loaded:", {
          familyName: familyRes.data?.name || "No family",
          memberCount: familyRes.data?.members?.length || 0,
          members:
            familyRes.data?.members?.map((m) => ({
              name: m.name,
              id: m._id,
            })) || [],
          currentUserId: meRes.data._id,
        });
      } catch (err) {
        console.log(
          "Dashboard error:",
          err.response?.data?.message || err.message,
        );

        // If unauthorized, redirect to login
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const errorMessage =
          err.response?.data?.message || err.message || "Failed to load data";
        setError(errorMessage);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [selectedMonth, navigate],
  );

  // Check for new permission requests
  const checkPermissions = useCallback(async () => {
    try {
      const res = await api.get("/permission/pending");
      const currentCount = res.data.length;

      if (currentCount > lastPermissionCountRef.current) {
        const newCount = currentCount - lastPermissionCountRef.current;
        addNotification(
          `You have ${newCount} new edit request${newCount > 1 ? "s" : ""}!`,
          "info",
          5000,
        );
      }

      lastPermissionCountRef.current = currentCount;
    } catch (err) {
      console.error("Failed to check permissions:", err);
    }
  }, [addNotification]);

  useEffect(() => {
    loadData(true); // Initial load with loading state

    // Set up polling: load data every 30 seconds without showing loading
    const dataInterval = setInterval(() => loadData(false), 30000);
    const permInterval = setInterval(checkPermissions, 10000); // Check permissions every 10 seconds

    return () => {
      clearInterval(dataInterval);
      clearInterval(permInterval);
    };
  }, [loadData, checkPermissions]);

  // Check for due reminders and show toasts
  useEffect(() => {
    if (reminders.length > 0) {
      const now = new Date();
      const sixtyMinutesFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      reminders.forEach((reminder) => {
        if (!reminder.isDone && !shownReminderToasts.has(reminder._id)) {
          const dueDate = new Date(reminder.dueAt);
          if (dueDate >= now && dueDate <= sixtyMinutesFromNow) {
            const timeString = dueDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
            const dateString =
              dueDate.toDateString() === now.toDateString()
                ? "Today"
                : dueDate.toLocaleDateString("en-US", { weekday: "long" });

            toast(
              `Reminder due ${dateString} ${timeString}: ${reminder.title} from ${reminder.createdBy.name}`,
              {
                duration: 8000,
              },
            );

            setShownReminderToasts((prev) => new Set([...prev, reminder._id]));
          }
        }
      });
    }
  }, [reminders, shownReminderToasts]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    addNotification("Logged out successfully", "success", 2000);
    setTimeout(() => {
      navigate("/login");
    }, 500);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await api.delete("/budget/delete", { data: { budgetItemId: itemId } });
        addNotification("Item deleted successfully", "success", 2000);
        loadData(true); // Refresh the data with loading state
      } catch (err) {
        addNotification("Failed to delete item", "error", 2000);
      }
    }
  };

  // Reminder functions
  const handleCompleteReminder = async (reminderId) => {
    try {
      await remindersAPI.completeReminder(reminderId);
      addNotification("Reminder completed!", "success", 2000);
      loadData(false); // Refresh reminders without loading state
    } catch (err) {
      addNotification("Failed to complete reminder", "error", 2000);
    }
  };

  const handleCreateReminder = async (reminderData) => {
    try {
      await remindersAPI.createReminder(reminderData);
      toast("Reminder sent successfully!");
      setShowAddReminder(false);
      loadData(false); // Refresh reminders without loading state
    } catch (err) {
      addNotification("Failed to create reminder", "error", 3000);
    }
  };

  // Admin functions
  const handleRemoveMember = async (memberId, memberName) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${memberName} from the family? This will delete all their budget items, permissions, messages, and shopping items.`,
      )
    ) {
      try {
        await familyAdminAPI.removeMember(memberId);
        addNotification(
          `${memberName} has been removed from the family`,
          "success",
          3000,
        );
        loadData(true);
      } catch (err) {
        addNotification("Failed to remove member", "error", 3000);
      }
    }
  };

  const handleTransferAdmin = async (newAdminId, newAdminName) => {
    if (
      window.confirm(
        `Are you sure you want to transfer admin rights to ${newAdminName}? You will no longer be the family admin.`,
      )
    ) {
      try {
        await familyAdminAPI.transferAdmin(newAdminId);
        addNotification(
          `Admin rights transferred to ${newAdminName}`,
          "success",
          3000,
        );
        loadData(true);
      } catch (err) {
        addNotification("Failed to transfer admin rights", "error", 3000);
      }
    }
  };

  const handleDeleteFamily = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete the entire family? This action cannot be undone and will remove all family data including budget items, messages, and shopping lists.",
      )
    ) {
      const confirmText = window.prompt(
        "Type 'DELETE' to confirm family deletion:",
      );
      if (confirmText === "DELETE") {
        try {
          await familyAdminAPI.deleteFamily();
          addNotification("Family deleted successfully", "success", 3000);
          navigate("/family"); // Redirect to family choice page
        } catch (err) {
          addNotification("Failed to delete family", "error", 3000);
        }
      }
    }
  };

  const loadAdminStats = async () => {
    try {
      const res = await familyAdminAPI.getFamilyStats(selectedMonth);
      setAdminStats(res.data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    }
  };

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!summary) return <p>Failed to load budget data</p>;

  return (
    <>
      {/* Floating Action Button */}
      <div
        className="fab-container"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        {fabOpen && (
          <div
            className="fab-menu"
            style={{
              marginBottom: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              zIndex: 10001,
            }}
          >
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowAdd(true);
                setFabOpen(false);
              }}
              style={{ minWidth: 120 }}
            >
              Add Budget Item
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowAddIncome(true);
                setFabOpen(false);
              }}
              style={{ minWidth: 120 }}
            >
              Add Budget Income
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const shoppingList = document.getElementById("shopping-list");
                if (shoppingList) {
                  shoppingList.scrollIntoView({ behavior: "smooth" });
                }
                setFabOpen(false);
              }}
              style={{ minWidth: 120 }}
            >
              View Shopping List
            </button>
          </div>
        )}
        <button
          className="fab"
          onClick={() => setFabOpen(!fabOpen)}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#1e88e5",
            color: "white",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(30, 136, 229, 0.3)",
            transition: "transform 0.2s ease",
            zIndex: 10000,
          }}
        >
          {fabOpen ? "×" : "+"}
        </button>
      </div>

      <div
        className="page-wrapper"
        style={{
          background: settings?.theme?.backgroundGradient
            ? `linear-gradient(${settings.theme.backgroundGradient.direction}, ${settings.theme.backgroundGradient.start} 0%, ${settings.theme.backgroundGradient.end} 100%)`
            : undefined,
          position: "relative",
        }}
      >
        {/* Semi-transparent overlay to soften the gradient */}
        {settings?.theme?.backgroundGradient && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255, 255, 255, 0.5)",
              pointerEvents: "none",
            }}
          />
        )}
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Navbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0",
              borderBottom: "1px solid #e0e0e0",
              marginBottom: 32,
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: "#1e88e5" }}>Family Budget</h2>
              {currentUser && (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "0.9em",
                    color: "#666",
                  }}
                >
                  Welcome back, {currentUser.name}
                </p>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  console.log(
                    "Menu button clicked, toggling dropdown:",
                    !showMenuDropdown,
                  );
                  setShowMenuDropdown(!showMenuDropdown);
                }}
                style={{
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  padding: "10px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  color: "#666",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e8f4fd";
                  e.target.style.borderColor = "#1e88e5";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                  e.target.style.borderColor = "#ddd";
                }}
                onBlur={() => {
                  // Only close dropdown if we're not clicking on a dropdown item
                  setTimeout(() => {
                    if (!document.activeElement?.closest(".dropdown-menu")) {
                      setShowMenuDropdown(false);
                    }
                  }, 100);
                }}
                title="Menu"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {showMenuDropdown && (
                <div
                  className="dropdown-menu"
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    backgroundColor: "white",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    minWidth: "160px",
                    marginTop: "4px",
                  }}
                >
                  <button
                    onClick={() => {
                      console.log("Settings button clicked");
                      navigate("/settings");
                      setShowMenuDropdown(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      borderRadius: "8px 8px 0 0",
                      color: "#333",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      console.log("Customization button clicked");
                      setShowCustomization(true);
                      setShowMenuDropdown(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#333",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    Customization
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMenuDropdown(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      borderRadius: "0 0 8px 8px",
                      color: "#d32f2f",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#ffebee")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ color: "#757575" }}>
              Track your family's monthly budget and shopping needs
            </p>
          </div>

          {/* Month Selector */}
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <label
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#424242",
                marginRight: "12px",
              }}
            >
              Select Month:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                backgroundColor: "white",
                fontSize: "16px",
                minWidth: "180px",
                fontWeight: "500",
              }}
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Family Card */}
          {family && settings?.layout?.showFamilyMembers && (
            <div
              className="card"
              style={{
                marginBottom: 24,
                background:
                  settings?.components?.familyCard?.background ||
                  "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                borderRadius:
                  settings?.components?.familyCard?.borderRadius || "12px",
                boxShadow:
                  settings?.components?.familyCard?.shadow ||
                  "0 4px 16px rgba(30, 136, 229, 0.15)",
              }}
            >
              <div className="card-header">
                <div>
                  <div className="card-title">{family.name}</div>
                  <div className="card-subtitle">
                    Family • Admin: {family.adminId?.name || "Unknown"}
                  </div>
                </div>
                {currentUser &&
                  family.adminId &&
                  currentUser._id === family.adminId._id && (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                      onClick={() => setShowAdminPanel(true)}
                    >
                      Manage Family
                    </button>
                  )}
              </div>
              <div className="card-body">
                {Array.isArray(family.members) && family.members.length > 0 ? (
                  <div>
                    <p
                      style={{
                        marginBottom: 12,
                        fontWeight: 600,
                        color: "#212121",
                      }}
                    >
                      Members ({family.members.length})
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                      }}
                    >
                      {family.members.map((m) => (
                        <div
                          key={m._id}
                          style={{
                            padding: 12,
                            background:
                              "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                            borderRadius: 8,
                            borderLeft: "4px solid #1e88e5",
                          }}
                        >
                          <div style={{ fontWeight: 600, color: "#212121" }}>
                            {m.name}
                          </div>
                          {m.email && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#757575",
                                marginTop: 4,
                              }}
                            >
                              {m.email}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p>No members yet</p>
                )}
              </div>
            </div>
          )}

          {/* Summary Cards */}
          {settings?.layout?.showIncomeExpenses && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <Card
                label="Month"
                value={new Date(selectedMonth + "-01").toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "long" },
                )}
                color="#64b5f6"
              />
              <Card
                label="Budget Added"
                value={`₪${summary.income}`}
                color="#4caf50"
              />
              <Card
                label="Budget Spent"
                value={`₪${summary.expenses}`}
                color="#ff9800"
              />
              <Card
                label="Balance"
                value={`₪${summary.balance}`}
                color={summary.balance >= 0 ? "#4caf50" : "#f44336"}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <button
              className="btn btn-primary"
              onClick={() => setShowAdd(true)}
            >
              Add Budget Item
            </button>
            <button className="btn btn-secondary" onClick={loadData}>
              Refresh
            </button>
            <a
              href="/permissions"
              className="btn btn-primary"
              style={{ textDecoration: "none", display: "inline-block" }}
            >
              Edit Permissions
            </a>
          </div>

          {/* Member Stats */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div>
                <div className="card-title">Family Member Stats</div>
                <div className="card-subtitle">
                  Budget contributions this month
                </div>
              </div>
            </div>
            <div className="card-body">
              {memberStats.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "#666",
                    padding: "20px",
                  }}
                >
                  No budget activity yet this month
                </p>
              ) : (
                <div>
                  {/* Pie Chart for Expenses by Member */}
                  <div style={{ marginBottom: "24px" }}>
                    <h4 style={{ marginBottom: "12px", color: "#333" }}>
                      Expenses by Member
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={memberStats.filter((m) => m.totalExpenses > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="totalExpenses"
                        >
                          {memberStats
                            .filter((m) => m.totalExpenses > 0)
                            .map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`₪${value}`, "Expenses"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Member Details */}
                  <div style={{ display: "grid", gap: "12px" }}>
                    {memberStats.map((member) => (
                      <div
                        key={member.userId}
                        style={{
                          padding: "16px",
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: "600",
                                color: "#333",
                                fontSize: "1.1em",
                              }}
                            >
                              {member.name}
                              {currentUser &&
                                member.userId === currentUser._id && (
                                  <span
                                    style={{
                                      fontSize: "0.8em",
                                      color: "#666",
                                      marginLeft: "8px",
                                    }}
                                  >
                                    (You)
                                  </span>
                                )}
                            </div>
                            <div style={{ fontSize: "0.9em", color: "#666" }}>
                              {member.itemCount} items • Balance: ₪
                              {member.balance}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontSize: "0.9em",
                                color: "#4caf50",
                                marginBottom: "2px",
                              }}
                            >
                              +₪{member.totalIncome}
                            </div>
                            <div
                              style={{ fontSize: "0.9em", color: "#ff9800" }}
                            >
                              -₪{member.totalExpenses}
                            </div>
                          </div>
                        </div>

                        {/* Top Categories */}
                        {member.topCategories &&
                          member.topCategories.length > 0 && (
                            <div style={{ marginTop: "8px" }}>
                              <div
                                style={{
                                  fontSize: "0.8em",
                                  color: "#666",
                                  marginBottom: "4px",
                                }}
                              >
                                Top categories:
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  flexWrap: "wrap",
                                }}
                              >
                                {member.topCategories.map((cat, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      fontSize: "0.8em",
                                      backgroundColor: "#e3f2fd",
                                      color: "#1976d2",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    {cat.category}: ₪{cat.amount}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shopping List */}
          {settings?.layout?.showShoppingList && (
            <div id="shopping-list">
              <ShoppingList
                onPurchase={() => loadData(false)}
                month={selectedMonth}
              />
            </div>
          )}

          {/* Reminders Widget */}
          <div
            className="card"
            style={{
              marginBottom: 24,
              background: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(255, 152, 0, 0.15)",
            }}
          >
            <div className="card-header">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ margin: 0 }}>Your Reminders</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  {family &&
                    family.members &&
                    family.members.filter(
                      (member) => member._id !== currentUser?._id,
                    ).length > 0 && (
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: "12px", padding: "6px 12px" }}
                        onClick={() => {
                          console.log("Opening Add Reminder modal:", {
                            hasFamily: !!family,
                            familyName: family?.name,
                            memberCount: family?.members?.length || 0,
                            availableMembers:
                              family?.members?.filter(
                                (member) => member._id !== currentUser?._id,
                              ).length || 0,
                            currentUserId: currentUser?._id,
                          });
                          setShowAddReminder(true);
                        }}
                      >
                        + Add
                      </button>
                    )}
                  {(!family ||
                    !family.members ||
                    family.members.filter(
                      (member) => member._id !== currentUser?._id,
                    ).length === 0) && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        fontStyle: "italic",
                      }}
                    >
                      Need family members to create reminders
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              {reminders.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "#757575",
                    padding: "20px",
                  }}
                >
                  {family &&
                  family.members &&
                  family.members.filter(
                    (member) => member._id !== currentUser?._id,
                  ).length > 0
                    ? "No reminders yet. Create one to get started!"
                    : "Add family members to start creating reminders."}
                </p>
              ) : (
                <div>
                  <div
                    style={{
                      marginBottom: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: "#666" }}>
                      {reminders.filter((r) => !r.isDone).length} upcoming
                    </span>
                    <button
                      onClick={() =>
                        setShowCompletedReminders(!showCompletedReminders)
                      }
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      {showCompletedReminders ? "Hide" : "Show"} completed
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {reminders
                      .filter(
                        (reminder) =>
                          showCompletedReminders || !reminder.isDone,
                      )
                      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
                      .map((reminder) => (
                        <div
                          key={reminder._id}
                          style={{
                            padding: "12px",
                            background: reminder.isDone ? "#f5f5f5" : "#fff",
                            borderRadius: "8px",
                            border: reminder.isDone
                              ? "1px solid #e0e0e0"
                              : "1px solid #ffe0b2",
                            opacity: reminder.isDone ? 0.7 : 1,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontWeight: "600",
                                  marginBottom: "4px",
                                }}
                              >
                                {reminder.title}
                              </div>
                              {reminder.note && (
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#666",
                                    marginBottom: "8px",
                                  }}
                                >
                                  {reminder.note}
                                </div>
                              )}
                              <div style={{ fontSize: "12px", color: "#888" }}>
                                Due:{" "}
                                {new Date(reminder.dueAt).toLocaleString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                              <div style={{ fontSize: "12px", color: "#888" }}>
                                From: {reminder.createdBy?.name || "Unknown"}
                                {reminder.createdBy?._id ===
                                  currentUser?._id && (
                                  <span
                                    style={{
                                      color: "#ff9800",
                                      marginLeft: "4px",
                                    }}
                                  >
                                    (You)
                                  </span>
                                )}
                              </div>
                            </div>
                            {!reminder.isDone && (
                              <button
                                className="btn btn-success"
                                style={{
                                  fontSize: "12px",
                                  padding: "4px 8px",
                                  marginLeft: "12px",
                                }}
                                onClick={() =>
                                  handleCompleteReminder(reminder._id)
                                }
                              >
                                Done
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Categories Section */}
          <div
            className="card"
            style={{
              marginBottom: 24,
              background:
                settings?.components?.budgetCard?.background ||
                "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
              borderRadius:
                settings?.components?.budgetCard?.borderRadius || "12px",
              boxShadow:
                settings?.components?.budgetCard?.shadow ||
                "0 4px 16px rgba(106, 27, 154, 0.15)",
            }}
          >
            <div className="card-header">
              <h3 style={{ margin: 0 }}>Top Budget Categories</h3>
            </div>
            <div className="card-body">
              {categories.length === 0 ? (
                <p style={{ textAlign: "center", color: "#757575" }}>
                  No expenses yet for this month
                </p>
              ) : (
                <div>
                  {categories.slice(0, 5).map((c, idx) => (
                    <div
                      key={c.category}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 0",
                        borderBottom:
                          idx < categories.slice(0, 5).length - 1
                            ? "1px solid #eeeeee"
                            : "none",
                      }}
                    >
                      <span style={{ color: "#212121", fontWeight: 500 }}>
                        {c.category}
                      </span>
                      <span className="badge badge-primary">₪{c.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div
            className="card"
            style={{
              background:
                settings?.components?.recentActionsCard?.background ||
                "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
              borderRadius:
                settings?.components?.recentActionsCard?.borderRadius || "12px",
              boxShadow:
                settings?.components?.recentActionsCard?.shadow ||
                "0 4px 16px rgba(255, 152, 0, 0.15)",
            }}
          >
            <div className="card-header">
              <h3 style={{ margin: 0 }}>Recent Activity</h3>
            </div>
            <div className="card-body">
              {recent.length === 0 ? (
                <p style={{ textAlign: "center", color: "#757575" }}>
                  No activity yet
                </p>
              ) : (
                <div>
                  {recent.map((a, idx) => {
                    const isOwner =
                      currentUser &&
                      a.createdBy &&
                      typeof a.createdBy === "object" &&
                      a.createdBy._id === currentUser._id;
                    const canEdit = a.canEdit || isOwner;
                    const isIncome = a.type === "income";

                    return (
                      <div
                        key={a._id}
                        style={{
                          padding: 12,
                          marginBottom: idx < recent.length - 1 ? 12 : 0,
                          background:
                            "linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)",
                          borderRadius: 8,
                          borderLeft: `4px solid ${isIncome ? "#4caf50" : "#ff9800"}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "#212121",
                                marginBottom: 8,
                              }}
                            >
                              {a.createdBy?.name || "Someone"}{" "}
                              {isIncome ? "added budget" : "spent budget"}
                              <span
                                className="badge"
                                style={{
                                  marginLeft: 8,
                                  background: isIncome ? "#c8e6c9" : "#ffe0b2",
                                  color: isIncome ? "#2e7d32" : "#e65100",
                                }}
                              >
                                ₪{a.amount}
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: 12,
                                color: "#757575",
                                marginBottom: 8,
                              }}
                            >
                              {a.category} {a.note ? `• ${a.note}` : ""}
                            </p>
                            {a.editedBy &&
                              typeof a.editedBy === "object" &&
                              a.editedBy._id !== a.createdBy._id && (
                                <p style={{ fontSize: 11, color: "#ff9800" }}>
                                  Edited by {a.editedBy?.name || "someone"}
                                </p>
                              )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                              alignItems: "flex-end",
                              marginLeft: 16,
                            }}
                          >
                            <button
                              className="btn btn-small"
                              onClick={() => setEditingItemId(a._id)}
                              style={{
                                background: canEdit
                                  ? "linear-gradient(135deg, #4caf50 0%, #45a049 100%)"
                                  : "linear-gradient(135deg, #64b5f6 0%, #1e88e5 100%)",
                              }}
                            >
                              {canEdit ? "Edit" : "Request"}
                            </button>
                            {canEdit && (
                              <button
                                className="btn btn-small"
                                onClick={() => handleDeleteItem(a._id)}
                                style={{
                                  background:
                                    "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                                }}
                              >
                                Delete
                              </button>
                            )}
                            <div
                              style={{
                                fontSize: 11,
                                color: "#999",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {a.createdAt
                                ? new Date(a.createdAt).toLocaleDateString()
                                : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        {showAdd && (
          <QuickAddModal
            onClose={() => setShowAdd(false)}
            onAdded={() => {
              setShowAdd(false);
              loadData(true);
            }}
          />
        )}

        {editingItemId && (
          <EditBudgetItem
            itemId={editingItemId}
            onClose={() => setEditingItemId(null)}
            onSaved={() => {
              setEditingItemId(null);
              loadData(true);
            }}
          />
        )}
      </div>

      <CustomizationPanel
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
      />

      {/* Quick Add Income Modal */}
      {showAddIncome && (
        <QuickAddModal
          initialType="income"
          onClose={() => setShowAddIncome(false)}
          onAdded={() => {
            setShowAddIncome(false);
            loadData(true);
          }}
        />
      )}
      {ReactDOM.createPortal(
        <div
          className="fab-container"
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          {fabOpen && (
            <div
              className="fab-menu"
              style={{
                marginBottom: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                zIndex: 10001,
              }}
            >
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowAdd(true);
                  setFabOpen(false);
                }}
                style={{ minWidth: 120 }}
              >
                Add Budget
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowAddIncome(true);
                  setFabOpen(false);
                }}
                style={{ minWidth: 120 }}
              >
                Add Budget
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const shoppingList = document.getElementById("shopping-list");
                  if (shoppingList) {
                    shoppingList.scrollIntoView({ behavior: "smooth" });
                  }
                  setFabOpen(false);
                }}
                style={{ minWidth: 120 }}
              >
                View Shopping List
              </button>
            </div>
          )}
          <button
            className="fab"
            onClick={() => setFabOpen(!fabOpen)}
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#1e88e5",
              color: "white",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(30, 136, 229, 0.3)",
              transition: "transform 0.2s ease",
              zIndex: 10000,
            }}
          >
            {fabOpen ? "×" : "+"}
          </button>
        </div>,
        document.body,
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel &&
        currentUser &&
        family &&
        currentUser._id === family.adminId?._id && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
            }}
            onClick={() => setShowAdminPanel(false)}
          >
            <div
              className="card"
              style={{
                maxWidth: 600,
                width: "90%",
                maxHeight: "80vh",
                overflow: "auto",
                margin: 20,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-header">
                <div>
                  <div className="card-title">Family Administration</div>
                  <div className="card-subtitle">{family.name}</div>
                </div>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 24,
                    cursor: "pointer",
                    color: "#757575",
                  }}
                >
                  ×
                </button>
              </div>
              <div className="card-body">
                {/* Family Members Management */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ marginBottom: 16, color: "#1e88e5" }}>
                    Family Members
                  </h3>
                  <div style={{ display: "grid", gap: 12 }}>
                    {family.members.map((member) => (
                      <div
                        key={member._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: 12,
                          background: "#f5f5f5",
                          borderRadius: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{member.name}</div>
                          <div style={{ fontSize: 12, color: "#757575" }}>
                            {member.email}
                            {member._id === family.adminId?._id && (
                              <span style={{ color: "#ff9800", marginLeft: 8 }}>
                                ⭐ Admin
                              </span>
                            )}
                          </div>
                        </div>
                        {member._id !== currentUser._id && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: 12, padding: "4px 8px" }}
                              onClick={() =>
                                handleTransferAdmin(member._id, member.name)
                              }
                            >
                              Make Admin
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ fontSize: 12, padding: "4px 8px" }}
                              onClick={() =>
                                handleRemoveMember(member._id, member.name)
                              }
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 24 }}>
                  <h3 style={{ marginBottom: 16, color: "#f44336" }}>
                    Danger Zone
                  </h3>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      className="btn btn-danger"
                      onClick={handleDeleteFamily}
                      style={{ flex: 1 }}
                    >
                      Delete Family
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: "#757575", marginTop: 8 }}>
                    This action cannot be undone. All family data will be
                    permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Add Reminder Modal */}
      {showAddReminder && family && family.members && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setShowAddReminder(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: 500,
              width: "90%",
              margin: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div>
                <div className="card-title">Create Reminder</div>
                <div className="card-subtitle">
                  Send a reminder to a family member
                </div>
              </div>
              <button
                onClick={() => setShowAddReminder(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#757575",
                }}
              >
                ×
              </button>
            </div>
            <div className="card-body">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const reminderData = {
                    assignedTo: formData.get("assignedTo"),
                    title: formData.get("title"),
                    note: formData.get("note"),
                    dueAt: formData.get("dueAt"),
                  };
                  handleCreateReminder(reminderData);
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    Assign to:
                  </label>
                  <select
                    name="assignedTo"
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      fontSize: "16px",
                    }}
                  >
                    <option value="">Select family member...</option>
                    {family.members
                      .filter((member) => member._id !== currentUser?._id)
                      .map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name} {member.email && `(${member.email})`}
                        </option>
                      ))}
                  </select>
                  {family.members.filter(
                    (member) => member._id !== currentUser?._id,
                  ).length === 0 && (
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        marginTop: "8px",
                      }}
                    >
                      No other family members available. You need at least one
                      family member to create reminders.
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    Title:
                  </label>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="e.g., Buy milk"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    Note (optional):
                  </label>
                  <textarea
                    name="note"
                    placeholder="Additional details..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      fontSize: "16px",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    Due date & time:
                  </label>
                  <input
                    name="dueAt"
                    type="datetime-local"
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddReminder(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Send Reminder
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Card({ label, value, color }) {
  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          background: color,
          opacity: 0.1,
          borderRadius: "50%",
          transform: "translate(20%, -20%)",
        }}
      ></div>
      <div className="card-subtitle" style={{ color: "#757575" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "1.8rem",
          fontWeight: 700,
          color: color,
          marginTop: 8,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default Dashboard;
