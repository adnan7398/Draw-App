"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Globe, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
    const [loading, setLoading] = useState(false);
    const [privacy, setPrivacy] = useState<"public" | "private">("public");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            onClose();
            // Here would be navigation to the new room
        }, 1000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200"
                        >
                            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Create new room</h2>
                                <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 text-gray-500">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div>
                                    <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Room Name
                                    </label>
                                    <input
                                        type="text"
                                        id="roomName"
                                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                        placeholder="e.g. Q3 Roadmap Planning"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Privacy Setting
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setPrivacy("public")}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all",
                                                privacy === "public"
                                                    ? "border-blue-500 bg-blue-50/50 text-blue-700 ring-1 ring-blue-500"
                                                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                                            )}
                                        >
                                            <Globe className="h-5 w-5" />
                                            <div className="text-sm font-medium">Public</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPrivacy("private")}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all",
                                                privacy === "private"
                                                    ? "border-blue-500 bg-blue-50/50 text-blue-700 ring-1 ring-blue-500"
                                                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                                            )}
                                        >
                                            <Lock className="h-5 w-5" />
                                            <div className="text-sm font-medium">Private</div>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                    >
                                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Create Room
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
