import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EmployeeApp from './components/EmployeeApp';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ProtectedRoute from './components/ProtectedRoute'; // Импортируем охранника
import useDynamicFavicon from './hooks/useDynamicFavicon';
import Landing from './components/Landing';

function AppRoutes() {
  useDynamicFavicon(); // Динамическая смена favicon по роуту

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/:company_slug" element={<EmployeeApp />} />
      
      {/* Защищаем маршрут админки конкретной точки */}
      <Route 
        path="/:company_slug/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Защищаем маршрут суперадминки */}
      <Route 
        path="/superadmin" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;