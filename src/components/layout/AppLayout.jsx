import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LayoutDashboard, Ticket, AlertTriangle, Plus, Settings, Users, LogOut, Menu, X, Bell, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isManagerOrAdmin } from "@/lib/slaUtils";

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';
  const isMgrOrAdmin = isManagerOrAdmin(user);

  const navItems = [
  { label: "דשבורד", path: "/", icon: LayoutDashboard },
  { label: "כל הקריאות", path: "/tickets", icon: Ticket, managerOnly: true },
  { label: "פתיחת קריאה", path: "/tickets/new", icon: Plus },
  { label: "מפת שירות", path: "/service-map", icon: MapPin, managerOnly: true },
  { label: "חורגות SLA", path: "/sla-report", icon: AlertTriangle, managerOnly: true },
  { label: "הגדרות SLA", path: "/sla-settings", icon: Settings, managerOnly: true },
  { label: "הגדרות התראות", path: "/notification-settings", icon: Bell, adminOnly: true },
  { label: "ניהול משתמשים", path: "/users", icon: Users, adminOnly: true }].
  filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.managerOnly && !isMgrOrAdmin) return false;
    return true;
  });

  const handleLogout = () => base44.auth.logout("/login");
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Mobile overlay */}
      {mobileOpen &&
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeMobile} />
      }

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 h-full w-60 bg-sidebar text-sidebar-foreground z-50 flex flex-col transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-xs">W</span>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Workies שירות ותמיכה</p>
              <p className="text-[10px] text-sidebar-foreground/50">קריאות שירות</p>
            </div>
          </div>
          <button onClick={closeMobile} className="lg:hidden p-1 rounded hover:bg-sidebar-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New ticket CTA */}
        <div className="p-3">
          <Button
            onClick={() => {navigate("/tickets/new");closeMobile();}}
            className="w-full gap-2 text-sm">
            
            <Plus className="w-4 h-4" />
            קריאה חדשה
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active ?
                  "bg-sidebar-accent text-primary font-semibold" :
                  "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}>
                
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>);

          })}
        </nav>

        {/* User */}
        {user &&
        <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold shrink-0">
                {user.full_name?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.full_name}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">{user.role}</p>
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded hover:bg-sidebar-accent">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        }
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:mr-60">
        {/* Mobile header */}
        <header className="lg:hidden h-14 bg-sidebar text-sidebar-foreground flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">W</span>
            </div>
            <span className="font-semibold text-sm">Workies AIO</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate("/tickets/new")} className="h-8 text-xs gap-1">
              <Plus className="w-3.5 h-3.5" />קריאה
            </Button>
            <button onClick={() => setMobileOpen(true)} className="p-2">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>);

}