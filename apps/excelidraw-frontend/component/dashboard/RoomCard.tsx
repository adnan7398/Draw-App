"use client";

import { motion } from "framer-motion";
import { MoreVertical, Users, Lock, Globe, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface RoomCardProps {
    id: string;
    name: string;
    lastEdited: string;
    isPrivate: boolean;
    thumbnail?: string;
}

export function RoomCard({ id, name, lastEdited, isPrivate, thumbnail }: RoomCardProps) {
    const [isStarred, setIsStarred] = useState(false);

    return (
        <Link href={`/room/${id}`}>
            <motion.div
                whileHover={{ y: -2 }}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md cursor-pointer"
            >
                {/* Thumbnail Area */}
                <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
                    {thumbnail ? (
                        <img
                            src={thumbnail}
                            alt={name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        // Placeholder pattern if no thumbnail
                        <div className="h-full w-full opacity-10" style={{
                            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }} />
                    )}

                    {/* Overlay Controls */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setIsStarred(!isStarred);
                            }}
                            className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white text-gray-500 hover:text-yellow-500"
                        >
                            <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-500 text-yellow-500" : ""}`} />
                        </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                        <div className="flex -space-x-2">
                            <div className="h-6 w-6 rounded-full border-2 border-white bg-blue-500" />
                            <div className="h-6 w-6 rounded-full border-2 border-white bg-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 truncate pr-4">{name}</h3>
                        <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between text-xs text-gray-500 pt-3">
                        <span>{lastEdited}</span>
                        <div className="flex items-center gap-1.5" title={isPrivate ? "Private Room" : "Public Room"}>
                            {isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                            <span>{isPrivate ? "Private" : "Public"}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
