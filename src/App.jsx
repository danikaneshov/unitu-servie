import { createElement } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmployeeApp from "./components/EmployeeApp";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import OutletSelector from "./components/OutletSelector";
import ProtectedRoute from "./components/ProtectedRoute";
import useDynamicFavicon from "./hooks/useDynamicFavicon";
import Landing from "./components/Landing";

function AppRoutes() {
  useDynamicFavicon();
  return createElement(Routes, null,
    createElement(Route, { path: "/", element: createElement(Landing) }),
    createElement(Route, { path: "/admin/login", element: createElement(AdminLogin) }),
    createElement(Route, { path: "/select-outlet", element: createElement(ProtectedRoute, { allowedRoles: ["admin", "superadmin"] }, createElement(OutletSelector)) }),
    createElement(Route, { path: "/:company_slug", element: createElement(EmployeeApp) }),
    createElement(Route, { path: "/:company_slug/admin", element: createElement(ProtectedRoute, { allowedRoles: ["admin", "superadmin"] }, createElement(AdminDashboard)) }),
    createElement(Route, { path: "/superadmin", element: createElement(ProtectedRoute, { allowedRoles: ["superadmin"] }, createElement(SuperAdminDashboard)) })
  );
}

function App() {
  return createElement(BrowserRouter, null, createElement(AppRoutes));
}

export default App;
