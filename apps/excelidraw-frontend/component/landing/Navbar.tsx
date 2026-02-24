"use client";

import Link from "next/link";
import { PenTool, Github } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <PenTool className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-900">
                        DrawTogether
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                        Features
                    </Link>
                    <Link href="#use-cases" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                        Use Cases
                    </Link>
                    <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                        Pricing
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/signin"
                        className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block"
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/signup"
                        className="inline-flex h-9 items-center justify-center rounded-full bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    >
                        Sign up free
                    </Link>
                </div>
            </div>
        </nav>
    );
}
