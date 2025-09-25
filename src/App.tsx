
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Productos from './pages/Productos';
import ProductDetail from './pages/ProductDetail';
import Categorias from './pages/Categorias';
import CategoryDetail from './pages/CategoryDetail';
import Proveedores from './pages/Proveedores';
import SupplierDetail from './pages/SupplierDetail';
import Ordenes from './pages/Ordenes';
import OrderDetail from './pages/OrderDetail';
import Ventas from './pages/Ventas';
import SalesDetail from './pages/SalesDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/productos" replace />} />
          <Route path="productos" element={<Productos />} />
          <Route path="productos/:id" element={<ProductDetail />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="categorias/:id" element={<CategoryDetail />} />
          <Route path="categorias/:id/editar" element={<CategoryDetail />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="proveedores/:id" element={<SupplierDetail />} />
          <Route path="proveedores/:id/editar" element={<SupplierDetail />} />
          <Route path="ordenes" element={<Ordenes />} />
          <Route path="ordenes/:id" element={<OrderDetail />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="ventas/:id" element={<SalesDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
