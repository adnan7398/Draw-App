"use client";

import { motion } from "framer-motion";
import { MousePointer2 } from "lucide-react";

export function ProductPreview() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="relative mx-auto w-full max-w-5xl rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden aspect-[16/9]"
                >
                    {/* Mock UI Header */}
                    <div className="flex h-12 items-center border-b border-gray-100 bg-gray-50/50 px-4 gap-2">
                        <div className="flex gap-1.5">
                            <div className="h-3 w-3 rounded-full bg-red-400" />
                            <div className="h-3 w-3 rounded-full bg-yellow-400" />
                            <div className="h-3 w-3 rounded-full bg-green-400" />
                        </div>
                        <div className="ml-4 flex gap-2">
                            <div className="h-6 w-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">A</div>
                            <div className="h-6 w-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs">B</div>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <div className="h-8 w-20 rounded bg-blue-600"></div>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="relative h-full w-full bg-[#f8f9fa] p-8"
                        style={{
                            backgroundImage: 'radial-gradient(#ddd 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}>

                        {/* Animated Shapes */}
                        <motion.div
                            initial={{ x: 100, y: 100, opacity: 0 }}
                            animate={{ x: 150, y: 150, opacity: 1 }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                            className="absolute h-32 w-32 rounded-lg border-2 border-blue-500 bg-blue-100/50"
                        />

                        <motion.div
                            initial={{ x: 400, y: 200, opacity: 0 }}
                            animate={{ x: 350, y: 250, opacity: 1 }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
                            className="absolute h-32 w-32 rounded-full border-2 border-purple-500 bg-purple-100/50"
                        />

                        {/* Connection Line */}
                        <svg className="absolute inset-0 pointer-events-none">
                            <motion.path
                                d="M 230 210 Q 300 250 400 280"
                                stroke="#94a3b8"
                                strokeWidth="2"
                                fill="none"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </svg>

                        {/* Cursors */}
                        <motion.div
                            animate={{ x: [100, 250, 150], y: [100, 200, 150] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute top-0 left-0 z-10"
                        >
                            <MousePointer2 className="h-5 w-5 fill-blue-500 text-blue-500" />
                            <div className="ml-2 rounded bg-blue-500 px-2 py-0.5 text-xs text-white">Alice</div>
                        </motion.div>

                        <motion.div
                            animate={{ x: [400, 300, 350], y: [200, 300, 250] }}
                            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                            className="absolute top-0 left-0 z-10"
                        >
                            <MousePointer2 className="h-5 w-5 fill-purple-500 text-purple-500" />
                            <div className="ml-2 rounded bg-purple-500 px-2 py-0.5 text-xs text-white">Bob</div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
