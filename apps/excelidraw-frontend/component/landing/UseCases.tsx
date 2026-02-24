"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, PenTool, Layout, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const useCases = [
    {
        id: "engineering",
        label: "Engineering",
        icon: Code2,
        title: "Technical Architecture & System Design",
        description: "Map out complex systems, document APIs, and plan microservices architectures together.",
        color: "bg-blue-100 text-blue-600",
    },
    {
        id: "design",
        label: "Design",
        icon: PenTool,
        title: "Wireframing & UI Flows",
        description: "Create low-fidelity wireframes, user journeys, and sticky note brainstorming sessions.",
        color: "bg-purple-100 text-purple-600",
    },
    {
        id: "product",
        label: "Product",
        icon: Layout,
        title: "Roadmaps & Strategy",
        description: "Visualize product roadmaps, prioritize features, and align stakeholders on strategy.",
        color: "bg-green-100 text-green-600",
    },
    {
        id: "brainstorming",
        label: "Brainstorming",
        icon: Lightbulb,
        title: "Ideation & Workshops",
        description: "Run remote workshops, retrospectives, and brainstorming sessions on an infinite canvas.",
        color: "bg-yellow-100 text-yellow-600",
    },
];

export function UseCases() {
    const [activeTab, setActiveTab] = useState("engineering");
    const activeCase = useCases.find((c) => c.id === activeTab) || useCases[0];

    return (
        <section id="use-cases" className="py-24 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Built for every team
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        From technical diagrams to freeform ideation, we've got you covered.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    {/* Tabs */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-2">
                        {useCases.map((useCase) => (
                            <button
                                key={useCase.id}
                                onClick={() => setActiveTab(useCase.id)}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-xl text-left transition-all",
                                    activeTab === useCase.id
                                        ? "bg-gray-50 shadow-sm border border-gray-200"
                                        : "hover:bg-gray-50/50"
                                )}
                            >
                                <div className={cn("p-2 rounded-lg", useCase.color)}>
                                    <useCase.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className={cn("font-medium", activeTab === useCase.id ? "text-gray-900" : "text-gray-600")}>
                                        {useCase.label}
                                    </h3>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Content Preview */}
                    <div className="w-full lg:w-2/3">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="bg-gray-50 rounded-2xl p-8 border border-gray-100 h-[400px] flex flex-col justify-center relative overflow-hidden"
                            >
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{activeCase.title}</h3>
                                    <p className="text-lg text-gray-600 max-w-lg mb-8">{activeCase.description}</p>

                                    {/* Abstract Representation of the Use Case */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-48 w-full max-w-md">
                                        {activeTab === 'engineering' && (
                                            <div className="flex items-center justify-around h-full">
                                                <div className="h-16 w-16 border-2 border-blue-500 rounded flex items-center justify-center">API</div>
                                                <div className="h-0.5 w-12 bg-gray-300"></div>
                                                <div className="h-16 w-16 border-2 border-green-500 rounded-full flex items-center justify-center">DB</div>
                                            </div>
                                        )}
                                        {activeTab === 'design' && (
                                            <div className="space-y-4">
                                                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                                <div className="flex gap-4">
                                                    <div className="h-20 w-1/3 bg-gray-100 rounded"></div>
                                                    <div className="h-20 w-1/3 bg-gray-100 rounded"></div>
                                                    <div className="h-20 w-1/3 bg-gray-100 rounded"></div>
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === 'product' && (
                                            <div className="relative h-full">
                                                <div className="absolute left-0 top-4 h-2 w-full bg-gray-100 rounded"></div>
                                                <div className="absolute left-10 top-2 h-6 w-24 bg-blue-100 rounded border border-blue-200"></div>
                                                <div className="absolute left-40 top-2 h-6 w-32 bg-purple-100 rounded border border-purple-200"></div>
                                            </div>
                                        )}
                                        {activeTab === 'brainstorming' && (
                                            <div className="flex flex-wrap gap-4 justify-center">
                                                <div className="h-16 w-16 bg-yellow-100 -rotate-3 p-2 text-xs shadow-sm">Idea 1</div>
                                                <div className="h-16 w-16 bg-blue-100 rotate-6 p-2 text-xs shadow-sm">Idea 2</div>
                                                <div className="h-16 w-16 bg-pink-100 -rotate-1 p-2 text-xs shadow-sm">Idea 3</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Decorative background blob */}
                                <div className={cn("absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20", activeCase.color.split(" ")[0])} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
