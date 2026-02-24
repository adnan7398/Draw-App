"use client";

import { motion } from "framer-motion";
import {
    Users,
    Infinity as InfinityIcon,
    History,
    Share2,
    Shield,
    Zap
} from "lucide-react";

const features = [
    {
        icon: Users,
        title: "Real-time Collaboration",
        description: "Work with your team in real-time. See their cursors and changes instantly."
    },
    {
        icon: InfinityIcon,
        title: "Infinite Canvas",
        description: "Never run out of space. Our canvas grows with your ideas."
    },
    {
        icon: History,
        title: "Version History",
        description: "Rewind to any version of your drawing. Never lose a great idea."
    },
    {
        icon: Share2,
        title: "Easy Sharing",
        description: "Share your drawings with a simple link. Control access with granular permissions."
    },
    {
        icon: Shield,
        title: "Secure Rooms",
        description: "End-to-end encryption ensures your diagrams remain private and secure."
    },
    {
        icon: Zap,
        title: "Fast & Smooth",
        description: "Engineered for performance. Handles thousands of shapes without lag."
    }
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Everything you need to visualize ideas
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Powerful tools that help you communicate complex information with clarity.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                                <feature.icon className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
