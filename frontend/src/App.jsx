import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'

// Auth pages
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// App pages
import Dashboard from './pages/dashboard/Dashboard'
import ClientsList from './pages/clients/ClientsList'
import ClientForm from './pages/clients/ClientForm'
import ClientDetail from './pages/clients/ClientDetail'
import MotorcyclesList from './pages/motorcycles/MotorcyclesList'
import MotorcycleForm from './pages/motorcycles/MotorcycleForm'
import MotorcycleDetail from './pages/motorcycles/MotorcycleDetail'
import ServicesList from './pages/services/ServicesList'
import ServiceForm from './pages/services/ServiceForm'
import ServiceDetail from './pages/services/ServiceDetail'
import ChecklistTemplates from './pages/checklists/ChecklistTemplates'
import InventoryList from './pages/inventory/InventoryList'
import InventoryForm from './pages/inventory/InventoryForm'
import StockMovements from './pages/inventory/StockMovements'
import SuppliersList from './pages/suppliers/SuppliersList'
import UsersList from './pages/users/UsersList'
import UserForm from './pages/users/UserForm'
import AuditLog from './pages/audit/AuditLog'
import Reports from './pages/reports/Reports'
import NotFound from './pages/NotFound'

const PrivateRoute = ({ children, roles }) => {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* Private */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route path="clients" element={<ClientsList />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="clients/:id/edit" element={<ClientForm />} />

        <Route path="motorcycles" element={<MotorcyclesList />} />
        <Route path="motorcycles/new" element={<MotorcycleForm />} />
        <Route path="motorcycles/:id" element={<MotorcycleDetail />} />
        <Route path="motorcycles/:id/edit" element={<MotorcycleForm />} />

        <Route path="services" element={<ServicesList />} />
        <Route path="services/new" element={<ServiceForm />} />
        <Route path="services/:id" element={<ServiceDetail />} />
        <Route path="services/:id/edit" element={<ServiceForm />} />

        <Route path="checklists" element={<ChecklistTemplates />} />

        <Route path="inventory" element={<InventoryList />} />
        <Route path="inventory/new" element={<InventoryForm />} />
        <Route path="inventory/:id/edit" element={<InventoryForm />} />
        <Route path="inventory/movements" element={<StockMovements />} />

        <Route path="suppliers" element={<SuppliersList />} />

        <Route path="users" element={<PrivateRoute roles={['ADMIN', 'SUPERVISOR']}><UsersList /></PrivateRoute>} />
        <Route path="users/new" element={<PrivateRoute roles={['ADMIN']}><UserForm /></PrivateRoute>} />
        <Route path="users/:id/edit" element={<PrivateRoute roles={['ADMIN']}><UserForm /></PrivateRoute>} />

        <Route path="audit" element={<PrivateRoute roles={['ADMIN', 'SUPERVISOR']}><AuditLog /></PrivateRoute>} />
        <Route path="reports" element={<PrivateRoute roles={['ADMIN', 'SUPERVISOR']}><Reports /></PrivateRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
