import { Link, useLocation } from "react-router-dom";
import WalletButton from "./WalletButton";

const links = [
  { to: "/deposit", label: "Depositar" },
  { to: "/withdraw", label: "Retirar" },
  { to: "/auditor", label: "Auditor" },
  { to: "/status", label: "Estado" },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="border-b border-pool-border bg-pool-bg/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-pool-violet flex items-center justify-center shadow-violet-sm group-hover:shadow-violet transition-shadow">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-pool-text">MongliPool</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                pathname === to
                  ? "bg-pool-violet/10 text-pool-violet-light"
                  : "text-pool-text-dim hover:text-pool-text hover:bg-pool-surface"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <WalletButton />
      </div>
    </nav>
  );
}