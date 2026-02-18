import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./Register";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import FamilyChoice from "./pages/FamilyChoice";
import CreateFamily from "./pages/CreateFamily";
import JoinFamily from "./pages/JoinFamily";
import AddBudgetItem from "./pages/AddBudgetItem";
import PermissionRequests from "./pages/PermissionRequests";
import Settings from "./pages/Settings";
import { NotificationProvider } from "./context/NotificationContext";
import { SettingsProvider } from "./context/SettingsContext";
import NotificationContainer from "./components/NotificationContainer";
import { Toaster } from "sonner";

function App() {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <NotificationContainer />
        <Toaster position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route
              path="/family"
              element={
                <ProtectedRoute>
                  <FamilyChoice />
                </ProtectedRoute>
              }
            />

            <Route
              path="/family/create"
              element={
                <ProtectedRoute>
                  <CreateFamily />
                </ProtectedRoute>
              }
            />

            <Route
              path="/family/join"
              element={
                <ProtectedRoute>
                  <JoinFamily />
                </ProtectedRoute>
              }
            />

            <Route
              path="/budget/add"
              element={
                <ProtectedRoute>
                  <AddBudgetItem />
                </ProtectedRoute>
              }
            />

            <Route
              path="/permissions"
              element={
                <ProtectedRoute>
                  <PermissionRequests />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </SettingsProvider>
  );
}

export default App;
