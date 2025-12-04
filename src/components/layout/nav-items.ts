import type { LucideIcon } from "lucide-react";
import { Home, Users, Receipt, Calendar } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: Array<"ADMIN" | "USER">;
};

export const navItems: NavItem[] = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
    roles: ["USER"],
  },
  {
    title: "Clientes",
    href: "/clients",
    icon: Users,
    roles: ["USER"],
  },
  {
    title: "Cobranças",
    href: "/cobrancas",
    icon: Receipt,
    roles: ["USER"],
  },
  {
    title: "Admin Dashboard",
    href: "/admin/dashboard",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "Usuários",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "Gerar Cobranças",
    href: "/admin/generate-bills",
    icon: Calendar,
    roles: ["ADMIN"],
  },
];

