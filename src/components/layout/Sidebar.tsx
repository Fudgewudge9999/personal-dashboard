import { cn } from "@/lib/utils";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  BarChart3,
  Menu,
  ChevronLeft,
  Settings,
  Clock,
  Target,
  LogIn,
  User,
  FileText,
  GraduationCap,
} from "lucide-react";

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
}

function SidebarLink({ to, icon: Icon, label, isCollapsed }: SidebarLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-md transition-all duration-250 group",
          isCollapsed ? "justify-center py-3" : "gap-3 px-3 py-2",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-foreground/70 hover:bg-accent hover:text-foreground"
        )
      }
    >
      <Icon size={20} className={cn(isActive ? "" : "text-foreground/60")} />
      {!isCollapsed && (
        <span className="font-medium transition-all duration-300">
          {label}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const sidebarLinks = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/focus", icon: Clock, label: "Focus" },
    { to: "/calendar", icon: Calendar, label: "Calendar" },
    { to: "/tasks", icon: CheckSquare, label: "Tasks" },
    { to: "/goals", icon: Target, label: "Goals" },
    { to: "/resources", icon: BookOpen, label: "Resources" },
    { to: "/notes", icon: FileText, label: "Notes" },
    { to: "/tutoring", icon: GraduationCap, label: "Tutoring" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
  ];

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-background border-r",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      <div className="flex flex-col h-full">
        <div className={cn(
          "flex items-center p-4",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl">Reflection</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
          >
            {isCollapsed ? (
              <Menu size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        <nav className="px-2 py-4 flex-1 space-y-1">
          {sidebarLinks.map((link) => (
            <SidebarLink
              key={link.to}
              to={link.to}
              icon={link.icon}
              label={link.label}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        <div className={cn(
          "border-t",
          isCollapsed ? "px-2 py-4" : "p-4"
        )}>
          <SidebarLink
            to="/settings"
            icon={Settings}
            label="Settings"
            isCollapsed={isCollapsed}
          />
          
          {user ? (
            <SidebarLink
              to="/profile"
              icon={User}
              label="Profile"
              isCollapsed={isCollapsed}
            />
          ) : (
            <SidebarLink
              to="/auth/login"
              icon={LogIn}
              label="Login"
              isCollapsed={isCollapsed}
            />
          )}
        </div>
      </div>
    </aside>
  );
}
