import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';

const STORE_KEY = 'currentStoreId';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuthActions();

  const handleSignOut = () => {
    localStorage.removeItem(STORE_KEY);
    void signOut();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/tiendas', label: 'Tiendas', icon: '🏪' },
    { path: '/productos', label: 'Productos', icon: '📦' },
    { path: '/categorias', label: 'Categorías', icon: '🏷️' },
    { path: '/proveedores', label: 'Proveedores', icon: '🏢' },
    { path: '/ordenes', label: 'Órdenes', icon: '📋' },
    { path: '/ventas', label: 'Ventas', icon: '💰' },
    { path: '/finanzas', label: 'Finanzas', icon: '💳' },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo/Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            {!collapsed && <h1 className="text-xl font-semibold text-gray-900">Torre Admin</h1>}
            <button
              onClick={onToggleCollapse}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md p-1"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        collapsed ? 'justify-center' : 'space-x-3'
                      } ${
                        isActive
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
              <li>
                <button
                  onClick={handleSignOut}
                  className="font-medium text-red-700 hover:bg-gray-50 hover:text-red-800 w-full flex items-center px-3 py-2 rounded-lg"
                >
                  
                  <span className="ml-2 text-sm">Cerrar sesión</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900">Torre Admin</h1>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md p-1"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <button
                  onClick={() => {
                    onClose();
                    handleSignOut();
                  }}
                  className="font-medium text-red-700 hover:bg-gray-50 hover:text-red-800 w-full flex items-center space-x-3 px-3 py-2 rounded-lg"
                >
                  <span>Cerrar sesión</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
