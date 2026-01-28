import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./Register";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import FamilyChoice from "./pages/FamilyChoice";
import CreateFamily from "./pages/CreateFamily";
import AddBudgetItem from "./pages/AddBudgetItem";

function App() {
  return (
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
          path="/budget/add"
          element={
            <ProtectedRoute>
              <AddBudgetItem />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
