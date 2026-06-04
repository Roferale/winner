import Link from "next/link";
import type { Route } from "next";
import {
  BarChart3,
  FileText,
  HelpCircle,
  Landmark,
  Settings,
  UserPlus,
  UsersRound
} from "lucide-react";

const groups = [
  {
    label: "Winner Academia",
    items: [
      { href: "/dashboard"      as Route, label: "Dashboard",      icon: BarChart3  },
      { href: "/financeiro"     as Route, label: "Financeiro",     icon: Landmark   },
      { href: "/alunos"         as Route, label: "Alunos",         icon: UsersRound },
      { href: "/cadastro"       as Route, label: "Cadastro",       icon: UserPlus   },
      { href: "/relatorios"     as Route, label: "Relatórios",     icon: FileText   },
      { href: "/configuracoes"  as Route, label: "Configurações",  icon: Settings   },
      { href: "/ajuda"          as Route, label: "Ajuda",          icon: HelpCircle }
    ]
  }
];

export function SidebarNav({ currentPath }: { currentPath: string }) {
  return (
    <div className="sidebar-nav">
      {groups.map((group) => (
        <div key={group.label} className="nav-group">
          <div className="nav-group-label">{group.label}</div>
          <div className="nav-group-items">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.href;
              return (
                <Link key={item.href} href={item.href} className={active ? "menu-item active" : "menu-item"}>
                  <span className="menu-item-icon">
                    <Icon size={15} strokeWidth={2} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
