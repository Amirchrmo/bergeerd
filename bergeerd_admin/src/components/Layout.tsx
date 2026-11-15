import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth";
import { useBranch } from "../branch";
import logo from "../assets/LOGO-header2.png";

const NAV = [
  { to: "/", label: "منو", end: true },
  { to: "/categories", label: "دسته‌بندی‌ها" },
  { to: "/branches", label: "شعبه‌ها" },
];

export default function Layout() {
  const { username, logout } = useAuth();
  const { branches, current, select, error } = useBranch();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur-md shadow-card">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <div className="flex items-center gap-3 shrink-0">
              <img src={logo} alt="برگِرد" className="h-11 w-11 object-contain" />
              <div className="leading-tight">
                <div className="font-bold text-lg text-charcoal tracking-wide">برگِرد</div>
                <div className="text-[11px] text-warm-gray/70">پنل مدیریت</div>
              </div>
            </div>
            <nav className="hidden sm:flex gap-1">
              {NAV.map((n) => (
                <NavItem key={n.to} {...n} />
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {branches.length > 0 && current && (
              <label className="flex items-center gap-2 text-sm text-warm-gray">
                <span className="hidden md:inline">شعبه:</span>
                <select
                  value={current.id}
                  onChange={(e) => select(e.target.value)}
                  aria-label="شعبهٔ در حال مدیریت"
                  className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-charcoal focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {b.is_active ? "" : " (غیرفعال)"}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <span className="hidden lg:inline text-sm text-warm-gray/80">{username}</span>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm rounded-lg border border-black/10 text-warm-gray hover:bg-brand/5 hover:border-brand/30 hover:text-brand transition-colors"
            >
              خروج
            </button>
          </div>
        </div>
        <nav className="sm:hidden flex gap-1 px-4 pb-3">
          {NAV.map((n) => (
            <NavItem key={n.to} {...n} mobile />
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 animate-fade-up">
        {error ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </div>
        ) : current ? (
          <Outlet />
        ) : (
          <div className="text-center py-20 text-warm-gray/50">در حال بارگذاری...</div>
        )}
      </main>

      <footer className="border-t border-black/5 py-4 text-center text-xs text-warm-gray/50">
        برگِرد — یه گرد خوشمزه
      </footer>
    </div>
  );
}

function NavItem({
  to,
  end,
  label,
  mobile,
}: {
  to: string;
  end?: boolean;
  label: string;
  mobile?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `${mobile ? "flex-1 text-center" : ""} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-brand text-white shadow-menu"
            : "text-warm-gray hover:bg-brand/8 hover:text-brand"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
