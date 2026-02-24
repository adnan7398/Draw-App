"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Mail, ArrowRight, Chrome, PenTool } from "lucide-react";

export function Authpage({ isSignin }: { isSignin: boolean }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/2 -ml-[40rem] w-[80rem] h-[40rem] bg-blue-50 rounded-full blur-3xl opacity-60 mix-blend-multiply" />
                <div className="absolute top-0 right-0 -mr-[20rem] w-[60rem] h-[40rem] bg-purple-50 rounded-full blur-3xl opacity-60 mix-blend-multiply" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="flex justify-center mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
                        <PenTool className="h-6 w-6" />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                    {isSignin ? "Welcome back" : "Create your account"}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {isSignin ? "Ready to start drawing?" : "Start collaborating in seconds."}{" "}
                    <Link
                        href={isSignin ? "/signup" : "/signin"}
                        className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                    >
                        {isSignin ? "Create an account" : "Sign in instead"}
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white py-8 px-4 shadow-xl shadow-gray-100 sm:rounded-2xl sm:px-10 border border-gray-100"
                >
                    <form className="space-y-6" action="#" method="POST">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm transition-all"
                                />
                            </div>
                        </div>

                        {isSignin && (
                            <div className="flex items-center justify-end">
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                                        Forgot your password?
                                    </a>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="button"
                                className="flex w-full justify-center rounded-lg border border-transparent bg-gray-900 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                                onClick={() => { }}
                            >
                                {isSignin ? "Sign in" : "Sign up"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div>
                                <a
                                    href="#"
                                    className="inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50 transition-all"
                                >
                                    <span className="sr-only">Sign in with Google</span>
                                    <Chrome className="h-5 w-5" />
                                </a>
                            </div>

                            <div>
                                <a
                                    href="#"
                                    className="inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50 transition-all"
                                >
                                    <span className="sr-only">Sign in with GitHub</span>
                                    <Github className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            type="button"
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-4 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all"
                            onClick={() => { }}
                        >
                            Continue as Guest
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-500 mx-auto max-w-sm">
                By clicking continue, you agree to our <a href="#" className="underline hover:text-gray-900">Terms of Service</a> and <a href="#" className="underline hover:text-gray-900">Privacy Policy</a>.
            </div>
        </div>
    );
}