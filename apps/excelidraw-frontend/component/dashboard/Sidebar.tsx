"use client";

import Link from "next/link";
import {
    LayoutGrid,
    Clock,
    Star,
    Settings,
    Plus,
    PenTool,
    Search,
    LogOut,
    ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
    { name: "All Rooms", href: "/dashboard", icon: LayoutGrid },
    { name: "Recents", href: "/dashboard?filter=recent", icon: Clock },
    { name: "Favorites", href: "/dashboard?filter=favorites", icon: Star },
];

export function Sidebar({ onCreateRoom }: { onCreateRoom: () => void }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={cn(
            "flex flex-col border-r border-gray-200 bg-white transition-all duration-300 relative",
            collapsed ? "w-20" : "w-64"
        )}>
            {/* Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 z-10"
            >
                <ChevronLeft className={cn("h-4 w-4 text-gray-400 transition-transform", collapsed && "rotate-180")} />
            </button>

            {/* Header */}
            <div className="flex h-16 items-center px-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
                        <PenTool className="h-5 w-5" />
                    </div>
                    {!collapsed && (
                        <span className="text-lg font-bold tracking-tight text-gray-900 transition-opacity whitespace-nowrap overflow-hidden">
                            DrawTogether
                        </span>
                    )}
                </div>
            </div>

            {/* User Profile (Simplified) */}
            <div className="p-4 border-b border-gray-50">
                <div className={cn("flex items-center gap-3 rounded-xl bg-gray-50 p-2", collapsed && "justify-center px-0")}>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 shrink-0" />
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">Adnan</p>
                            <p className="text-xs text-gray-500 truncate">Free Plan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Button */}
            <div className="p-4">
                <button
                    onClick={onCreateRoom}
                    className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                        collapsed && "px-0"
                    )}
                >
                    <Plus className="h-5 w-5" />
                    {!collapsed && <span>New Room</span>}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                    >
                        <item.icon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 shrink-0" />
                        {!collapsed && <span>{item.name}</span>}
                    </Link>
                ))}
            </nav>

            {/* Footer Links */}
            <div className="border-t border-gray-200 p-3">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                >
                    <Settings className="h-5 w-5 text-gray-400 group-hover:text-gray-600 shrink-0" />
                    {!collapsed && <span>Settings</span>}
                </Link>
                <button
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors group"
                >
                    <LogOut className="h-5 w-5 text-red-400 group-hover:text-red-600 shrink-0" />
                    {!collapsed && <span>Sign out</span>}
                </button>
            </div>
        </div>
    );
}
