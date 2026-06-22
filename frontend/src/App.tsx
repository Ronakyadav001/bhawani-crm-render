import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ResourcePage } from "./pages/ResourcePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ClientProfilePage } from "./pages/ClientProfilePage";
import { ProtectedRoute, RoleBasedRoute } from "./routes/Guards";
import { pageRoutes } from "./routes/routeConfig";
import { useAuth } from "./store/auth";

function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to={user?.home || "/login"} replace />} />
          {pageRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <RoleBasedRoute roles={route.roles}>
                  {route.kind === "dashboard" ? (
                    <DashboardPage route={route} />
                  ) : route.kind === "analytics" ? (
                    <AnalyticsPage route={route} />
                  ) : route.kind === "client-profile" ? (
                    <ClientProfilePage />
                  ) : (
                    <ResourcePage route={route} />
                  )}
                </RoleBasedRoute>
              }
            />
          ))}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={user?.home || "/login"} replace />} />
    </Routes>
  );
}

export default App;
