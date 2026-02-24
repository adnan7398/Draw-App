"use client";

import { Star } from "lucide-react";
import Image from "next/image";

const testimonials = [
    {
        content: "The real-time collaboration is seamless. It feels like we're all in the same room, pointing at the whiteboard.",
        author: "Sarah Chen",
        role: "Staff Engineer via Vercel",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
    },
    {
        content: "We switched from Miro. The performance of this app is incredible, even with massive system architecture diagrams.",
        author: "Alex Morgan",
        role: "Product Manager via Linear",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
    },
    {
        content: "The hand-drawn style makes technical diagrams feel less intimidating and more approachable for non-technical stakeholders.",
        author: "David Park",
        role: "Design Lead via Airbnb",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    }
];

export function Testimonials() {
    return (
        <section className="py-24 bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold tracking-tight text-center text-gray-900 mb-16">
                    Loved by teams everywhere
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-lg text-gray-700 leading-relaxed mb-8">
                                    "{testimonial.content}"
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <img
                                    src={testimonial.avatar}
                                    alt={testimonial.author}
                                    className="h-12 w-12 rounded-full object-cover"
                                />
                                <div>
                                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
