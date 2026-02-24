"use client";

import { RoomCard } from "./RoomCard";
import { Plus, Search } from "lucide-react";
import { motion } from "framer-motion";

const mockRooms = [
    { id: "1", name: "Q3 Engineering Roadmap", lastEdited: "2h ago", isPrivate: true, thumbnail: "" },
    { id: "2", name: "Design System Architecture", lastEdited: "5h ago", isPrivate: false, thumbnail: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=500&q=80" },
    { id: "3", name: "Weekly Sync Notes", lastEdited: "1d ago", isPrivate: true, thumbnail: "" },
    { id: "4", name: "Database Schema V2", lastEdited: "2d ago", isPrivate: true, thumbnail: "" },
    { id: "5", name: "Marketing Brainstorm", lastEdited: "3d ago", isPrivate: false, thumbnail: "" },
    { id: "6", name: "Onboarding Flow", lastEdited: "1w ago", isPrivate: false, thumbnail: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=500&q=80" },
];

interface RoomGridProps {
    searchQuery: string;
    onCreateRoom: () => void;
}

export function RoomGrid({ searchQuery, onCreateRoom }: RoomGridProps) {
    const filteredRooms = mockRooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {/* Create New Card */}
            <motion.button
                onClick={onCreateRoom}
                whileHover={{ y: -2 }}
                className="group relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50/50 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all h-[240px]"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <span className="font-medium text-gray-600 group-hover:text-blue-600">Create New Room</span>
            </motion.button>

            {/* Room Cards */}
            {filteredRooms.map((room) => (
                <RoomCard key={room.id} {...room} />
            ))}
        </div>
    );
}
