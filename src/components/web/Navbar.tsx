import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const { isAdmin, login, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      if (confirm("¿Cerrar sesión de administrador?")) {
        logout();
      }
    } else {
      const password = prompt("Ingrese contraseña de administrador:");
      if (password) {
        if (!login(password)) {
          alert("Contraseña incorrecta");
        }
      }
    }
  };

  return (
    <nav className="bg-linear-to-r from-gray-800 to-gray-900 shadow-lg border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-white font-bold text-xl hidden sm:block">
                Admin Training
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                className={
                  isActive("/")
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }
              >
                Inicio
              </Button>
            </Link>

            <Link to="/simulator">
              <Button
                variant={isActive("/simulator") ? "default" : "ghost"}
                className={
                  isActive("/simulator")
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }
              >
                Simulador
              </Button>
            </Link>

            <Link to="/web-training">
              <Button
                variant={isActive("/web-training") ? "default" : "ghost"}
                className={
                  isActive("/web-training")
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }
              >
                Web Training
              </Button>
            </Link>
          </div>

          {/* Status Indicator & Admin Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAdminClick}
              className={`text-gray-300 hover:text-white hover:bg-gray-700 transition-colors ${isAdmin ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : ""}`}
              title={isAdmin ? "Modo Admin Activo (Click para salir)" : "Acceso Admin"}
            >
              {isAdmin ? "🔓 Admin" : "🔒"}
            </Button>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </nav>
  );
}
