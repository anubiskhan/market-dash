import { BarChart3, LayoutDashboard, Search } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
	{ to: "/", icon: LayoutDashboard, label: "Dashboard" },
	{ to: "/screener", icon: Search, label: "Screener" },
];

export function Layout() {
	return (
		<div className="flex h-screen">
			{/* Sidebar */}
			<aside className="w-64 border-r border-border bg-card">
				<div className="flex h-14 items-center gap-2 border-b border-border px-4">
					<BarChart3 className="h-6 w-6 text-primary" />
					<span className="text-lg font-semibold">Market Dash</span>
				</div>
				<nav className="p-2">
					{navItems.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							className={({ isActive }) =>
								cn(
									"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
									isActive
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-secondary hover:text-foreground",
								)
							}
						>
							<item.icon className="h-4 w-4" />
							{item.label}
						</NavLink>
					))}
				</nav>
			</aside>

			{/* Main content */}
			<main className="flex-1 overflow-auto">
				<Outlet />
			</main>
		</div>
	);
}
