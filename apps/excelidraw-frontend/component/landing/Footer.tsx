"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin, PenTool } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 pb-12 pt-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                                <PenTool className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-gray-900">
                                DrawTogether
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            The collaborative whiteboard platform for teams to visualize ideas, map workflows, and build better products.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Product</h3>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Features</Link></li>
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Templates</Link></li>
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Integrations</Link></li>
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Enterprise</Link></li>
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Documentation</Link></li>
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Blog</Link></li>
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Community</Link></li>
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Help Center</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">About</Link></li>
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Careers</Link></li>
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Legal</Link></li>
                            <li><Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        © {new Date().getFullYear()} DrawTogether. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="https://github.com/adnan7398" className="text-gray-400 hover:text-gray-600 transition-colors">
                            <Github className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                            <Twitter className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                            <Linkedin className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
