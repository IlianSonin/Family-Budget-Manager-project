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
import {
  Card,
  Text,
  Title,
  Grid,
  Group,
  Badge,
  Button,
  Stack,
  Avatar,
  Progress,
  SimpleGrid,
  Container,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconShoppingCart,
  IconUsers,
  IconChartBar,
  IconSettings,
} from "@mantine/icons";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";
import api from "../services/api";
import QuickAddModal from "../components/QuickAddModal";
import EditBudgetItem from "../components/EditBudgetItem";
import ShoppingList from "../components/ShoppingList";
import { NotificationContext } from "../context/NotificationContext";
import { useSettings } from "../context/SettingsContext";
import CustomizationPanel from "../components/CustomizationPanel";

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [family, setFamily] = useState(null);
  const [recent, setRecent] = useState([]);
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

  const month = useMemo(() => getCurrentMonth(), []);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [summaryRes, categoriesRes, familyRes, recentRes, meRes] =
        await Promise.all([
          api.get("/budget/summary", { params: { month } }),
          api.get("/budget/categories", { params: { month } }),
          api.get("/family/me"),
          api.get("/budget/recent"),
          api.get("/auth/me"),
        ]);

      setSummary(summaryRes.data);
      setCategories(categoriesRes.data);
      setFamily(familyRes.data);
      setRecent(recentRes.data);
      setCurrentUser(meRes.data);
    } catch (err) {
      console.log("Dashboard error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [month]);

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
    loadData();

    // Set up polling: load data every 5 seconds, check permissions every 3 seconds
    const dataInterval = setInterval(loadData, 5000);
    const permInterval = setInterval(checkPermissions, 3000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(permInterval);
    };
  }, [loadData, checkPermissions]);

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
        loadData(); // Refresh the data
      } catch (err) {
        addNotification("Failed to delete item", "error", 2000);
      }
    }
  };

if (loading) return <Text align="center" size="lg">Loading dashboard...</Text>;
  if (error) return <Text align="center" color="red" size="lg">Error: {error}</Text>;
  if (!summary) return <Text align="center" size="lg">Failed to load budget data</Text>;

  // Prepare chart data
  const categoryData = categories.slice(0, 5).map(cat => ({
    name: cat.category,
    value: cat.total,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <>
      {/* Floating Action Button */}
      {ReactDOM.createPortal(
        <div
          className="fab-container"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          {fabOpen && (
            <div
              className="fab-menu"
              style={{
                marginBottom: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                zIndex: 10001,
              }}
            >
              <Button
                variant="filled"
                onClick={() => {
                  setShowAdd(true);
                  setFabOpen(false);
                }}
                style={{ minWidth: 120 }}
              >
                Add Budget Item
              </Button>
              <Button
                variant="filled"
                onClick={() => {
                  const shoppingList = document.getElementById('shopping-list');
                  if (shoppingList) {
                    shoppingList.scrollIntoView({ behavior: 'smooth' });
                  }
                  setFabOpen(false);
                }}
                style={{ minWidth: 120 }}
              >
                View Shopping List
              </Button>
            </div>
          )}
          <ActionIcon
            variant="filled"
            size="xl"
            radius="xl"
            onClick={() => setFabOpen(!fabOpen)}
            style={{
              boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)',
            }}
          >
            <IconPlus size={20} />
          </ActionIcon>
        </div>,
        document.body
      )}

      <Container size="xl" py="md">
        <Stack spacing="lg">
          {/* Header */}
          <Group position="apart" align="center">
            <div>
              <Title order={1}>Monthly Budget</Title>
              <Text color="dimmed">Household budget overview for {month}</Text>
            </div>
            <Group>
              <Tooltip label="Customize Dashboard">
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={() => setShowCustomization(true)}
                >
                  <IconSettings size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Budget Summary Cards */}
          {settings?.layout?.showIncomeExpenses && (
            <SimpleGrid cols={4} breakpoints={[{ maxWidth: 'md', cols: 2 }, { maxWidth: 'sm', cols: 1 }]}>
              <Card withBorder radius="md" padding="lg">
                <Group position="apart">
                  <div>
                    <Text size="xs" color="dimmed" transform="uppercase" weight={700}>
                      Month
                    </Text>
                    <Text size="lg" weight={500}>
                      {month}
                    </Text>
                  </div>
                </Group>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Group position="apart">
                  <div>
                    <Text size="xs" color="dimmed" transform="uppercase" weight={700}>
                      Budget Income
                    </Text>
                    <Text size="lg" weight={500} color="green">
                      ₪{summary.income}
                    </Text>
                  </div>
                </Group>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Group position="apart">
                  <div>
                    <Text size="xs" color="dimmed" transform="uppercase" weight={700}>
                      Budget Spent
                    </Text>
                    <Text size="lg" weight={500} color="orange">
                      ₪{summary.expenses}
                    </Text>
                  </div>
                </Group>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Group position="apart">
                  <div>
                    <Text size="xs" color="dimmed" transform="uppercase" weight={700}>
                      Balance
                    </Text>
                    <Text size="lg" weight={500} color={summary.balance >= 0 ? "green" : "red"}>
                      ₪{summary.balance}
                    </Text>
                  </div>
                </Group>
              </Card>
            </SimpleGrid>
          )}

          {/* Family Members */}
          {family && settings?.layout?.showFamilyMembers && (
            <Card withBorder radius="md">
              <Card.Section withBorder inheritPadding py="sm">
                <Group position="apart">
                  <Text weight={500}>Family Members</Text>
                  <Badge size="sm">{family.members?.length || 0} members</Badge>
                </Group>
              </Card.Section>
              <Card.Section inheritPadding py="sm">
                <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
                  {family.members?.map((member) => (
                    <Group key={member._id} spacing="sm">
                      <Avatar size="md" radius="xl">{member.name[0]}</Avatar>
                      <div>
                        <Text size="sm" weight={500}>{member.name}</Text>
                        <Text size="xs" color="dimmed">{member.email}</Text>
                      </div>
                    </Group>
                  ))}
                </SimpleGrid>
              </Card.Section>
            </Card>
          )}

          {/* Charts Row */}
          <Grid>
            <Grid.Col span={6}>
              <Card withBorder radius="md" padding="lg">
                <Title order={4} mb="md">Spending by Category</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card withBorder radius="md" padding="lg">
                <Title order={4} mb="md">Top Categories</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Shopping List */}
          {settings?.layout?.showShoppingList && (
            <Card withBorder radius="md" id="shopping-list">
              <Card.Section withBorder inheritPadding py="sm">
                <Group position="apart">
                  <Text weight={500}>Shopping List</Text>
                  <ActionIcon variant="light" onClick={() => navigate("/budget/add")}>
                    <IconPlus size={16} />
                  </ActionIcon>
                </Group>
              </Card.Section>
              <Card.Section inheritPadding py="sm">
                <ShoppingList />
              </Card.Section>
            </Card>
          )}

          {/* Recent Activity */}
          <Card withBorder radius="md">
            <Card.Section withBorder inheritPadding py="sm">
              <Text weight={500}>Recent Budget Activity</Text>
            </Card.Section>
            <Card.Section inheritPadding py="sm">
              <Stack spacing="sm">
                {recent.slice(0, 5).map((item) => (
                  <Group key={item._id} position="apart" align="flex-start">
                    <div>
                      <Text size="sm" weight={500}>
                        {item.createdBy?.name || "Someone"} added budget item
                      </Text>
                      <Text size="xs" color="dimmed">
                        {item.category} • {item.note || "No note"}
                      </Text>
                    </div>
                    <Badge color={item.type === "income" ? "green" : "orange"}>
                      ₪{item.amount}
                    </Badge>
                  </Group>
                ))}
              </Stack>
            </Card.Section>
          </Card>
        </Stack>
      </Container>

      {/* Modals */}
      {showAdd && (
        <QuickAddModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            loadData();
          }}
        />
      )}

      {editingItemId && (
        <EditBudgetItem
          budgetItemId={editingItemId}
          onClose={() => setEditingItemId(null)}
          onSaved={() => {
            setEditingItemId(null);
            loadData();
          }}
        />
      )}

      <CustomizationPanel
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
      />
    </>
  );
}

export default Dashboard;
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
          {/* Header */}
          <div className="flex-between" style={{ marginBottom: 32 }}>
            <div>
              <h1 style={{ marginBottom: 8, color: "#1e88e5" }}>Dashboard</h1>
              <p style={{ color: "#757575" }}>
                Welcome back! Here's your family budget overview
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCustomization(true)}
                style={{ background: "#666", color: "white" }}
              >
                Customize
              </button>
              <a
                href="/settings"
                className="btn btn-primary"
                style={{ textDecoration: "none", display: "inline-block" }}
              >
                Settings
              </a>
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
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
                  <div className="card-subtitle">Family</div>
                </div>
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
              <Card label="Month" value={month} color="#64b5f6" />
              <Card
                label="Income"
                value={`₪${summary.income}`}
                color="#4caf50"
              />
              <Card
                label="Expenses"
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
              Add Income/Expense
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

          {/* Shopping List */}
          {settings?.layout?.showShoppingList && (
            <div id="shopping-list">
              <ShoppingList />
            </div>
          )}

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
              <h3 style={{ margin: 0 }}>Top Expense Categories</h3>
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
                              {isIncome ? "added income" : "added expense"}
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
              loadData();
            }}
          />
        )}

        {editingItemId && (
          <EditBudgetItem
            itemId={editingItemId}
            onClose={() => setEditingItemId(null)}
            onSaved={() => {
              setEditingItemId(null);
              loadData();
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
            loadData();
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
                Add Expense
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowAddIncome(true);
                  setFabOpen(false);
                }}
                style={{ minWidth: 120 }}
              >
                Add Income
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
