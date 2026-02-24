"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github, Play } from "lucide-react";
import Link from "next/link";

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto mb-8 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-gray-200 bg-white px-7 py-2 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                    <p className="text-sm font-semibold text-gray-700">
                        Now with AI-powered shapes
                    </p>
                    <ArrowRight className="h-4 w-4 text-gray-500" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl"
                >
                    Draw together.{" "}
                    <span className="text-blue-600">Think faster.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mx-auto mt-6 max-w-2xl text-lg text-gray-600"
                >
                    The open-source virtual whiteboard for engineering teams.
                    Sketch diagrams, plan workflows, and collaborate in real-time.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-10 flex justify-center gap-4"
                >
                    <Link
                        href="/drawing"
                        className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-base font-medium text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Start drawing free
                    </Link>
                    <Link
                        href="https://github.com/adnan7398/Draw-App"
                        target="_blank"
                        className="inline-flex h-12 items-center justify-center rounded-full border border-gray-200 bg-white px-8 text-base font-medium text-gray-900 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
                    >
                        <Github className="mr-2 h-5 w-5" />
                        Star on GitHub
                    </Link>
                </motion.div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-0 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50/50 blur-3xl" />
            <div className="absolute top-0 right-0 -z-10 h-[800px] w-[800px] translate-x-1/3 -translate-y-1/4 rounded-full bg-purple-50/50 blur-3xl opacity-60" />
        </section>
    );
}
