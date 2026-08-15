import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCog,
  BarChart3,
  ClipboardList,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const adminNavLinks: NavLink[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/employees", label: "Employees", icon: UserCog },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export const employeeNavLinks: NavLink[] = [
  { href: "/employee", label: "My Jobs", icon: ClipboardList },
];
