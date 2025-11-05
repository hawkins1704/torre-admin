import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Productos from "./pages/Productos";
import ProductDetail from "./pages/ProductDetail";
import Stores from "./pages/Stores";
import StoreDetail from "./pages/StoreDetail";
import Categorias from "./pages/Categorias";
import CategoryDetail from "./pages/CategoryDetail";
import Proveedores from "./pages/Proveedores";
import SupplierDetail from "./pages/SupplierDetail";
import Ordenes from "./pages/Ordenes";
import OrderDetail from "./pages/OrderDetail";
import Ventas from "./pages/Ventas";
import SalesDetail from "./pages/SalesDetail";
import Finanzas from "./pages/Finanzas";
import FinancialDetail from "./pages/FinancialDetail";
import SignIn from "./pages/SignIn";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

function App() {
    return (
        <>
            <AuthLoading>
                <div>Loading...</div>
            </AuthLoading>
            <Unauthenticated>
                <Router>
                    <Routes>
                        <Route
                            index
                            element={<Navigate to="/login" replace />}
                        />
                        <Route path="/login" element={<SignIn />} />
                    </Routes>
                </Router>
            </Unauthenticated>
            <Authenticated>
                <Router>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route
                                index
                                element={<Navigate to="/dashboard" replace />}
                            />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="tiendas" element={<Stores />} />
                            <Route path="tiendas/:id" element={<StoreDetail />} />
                            <Route path="productos" element={<Productos />} />
                            <Route
                                path="productos/:id"
                                element={<ProductDetail />}
                            />
                            <Route path="categorias" element={<Categorias />} />
                            <Route
                                path="categorias/:id"
                                element={<CategoryDetail />}
                            />
                            <Route
                                path="categorias/:id/editar"
                                element={<CategoryDetail />}
                            />
                            <Route
                                path="proveedores"
                                element={<Proveedores />}
                            />
                            <Route
                                path="proveedores/:id"
                                element={<SupplierDetail />}
                            />
                            <Route
                                path="proveedores/:id/editar"
                                element={<SupplierDetail />}
                            />
                            <Route path="ordenes" element={<Ordenes />} />
                            <Route
                                path="ordenes/:id"
                                element={<OrderDetail />}
                            />
                            <Route path="ventas" element={<Ventas />} />
                            <Route
                                path="ventas/:id"
                                element={<SalesDetail />}
                            />
                            <Route path="finanzas" element={<Finanzas />} />
                            <Route
                                path="finanzas/:id"
                                element={<FinancialDetail />}
                            />
                        </Route>
                    </Routes>
                </Router>
            </Authenticated>
        </>
    );
}

export default App;
