import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import ProjectsPage from "./pages/ProjectsPage";
import SignupPage from "./pages/SignupPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/projects" element={<ProjectsPage />} />

        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
