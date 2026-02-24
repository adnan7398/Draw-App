"use client";

import { Sidebar } from "@/component/dashboard/Sidebar";
import { RoomGrid } from "@/component/dashboard/RoomGrid";
import { CreateRoomModal } from "@/component/dashboard/CreateRoomModal";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

export function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Keyboard shortcut listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + K to focus search
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                const searchInput = document.getElementById("dashboard-search");
                if (searchInput) {
                    searchInput.focus();
                }
            }
            // C to create new room (if not typing)
            if (e.key === "c" && document.activeElement?.tagName !== "INPUT") {
                e.preventDefault();
                setIsModalOpen(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <Sidebar onCreateRoom={() => setIsModalOpen(true)} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header / Search */}
                <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between shrink-0">
                    <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            id="dashboard-search"
                            type="text"
                            className="block w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Search rooms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 text-xs border border-gray-200 rounded px-1.5 py-0.5">⌘K</span>
                        </div>
                    </div>
                </header>

                {/* Scrollable Grid */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[1600px] mx-auto">
                        <RoomGrid searchQuery={searchQuery} onCreateRoom={() => setIsModalOpen(true)} />
                    </div>
                </div>
            </main>

            {/* Modal */}
            <CreateRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
