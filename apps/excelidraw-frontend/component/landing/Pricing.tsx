"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const tiers = [
    {
        name: "Free",
        price: "$0",
        description: "For individuals and hobbyists.",
        features: [
            "Unlimited public drawings",
            "3 private drawings",
            "Real-time collaboration",
            "Export to PNG/SVG",
        ],
        buttonText: "Start for free",
        popular: false,
    },
    {
        name: "Pro",
        price: "$12",
        description: "For professionals and small teams.",
        features: [
            "Unlimited private drawings",
            "Advanced export options",
            "Priority support",
            "Remove watermark",
            "Version history (30 days)",
        ],
        buttonText: "Start 14-day trial",
        popular: true,
    },
    {
        name: "Team",
        price: "$20",
        description: "For growing organizations.",
        features: [
            "Everything in Pro",
            "SAML SSO",
            "Centralized billing",
            "Audit logs",
            "Unlimited version history",
            "Dedicated success manager",
        ],
        buttonText: "Contact sales",
        popular: false,
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Simple, transparent pricing
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Choose the perfect plan for your needs. Always free for open source.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {tiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={cn(
                                "relative rounded-2xl bg-white p-8 shadow-sm border",
                                tier.popular
                                    ? "border-blue-500 shadow-md scale-105 z-10"
                                    : "border-gray-200"
                            )}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-4 py-1 text-sm font-medium text-white shadow-sm">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                                <div className="mt-2 flex items-baseline">
                                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                                    <span className="ml-1 text-gray-500">/month</span>
                                </div>
                                <p className="mt-2 text-sm text-gray-600">{tier.description}</p>
                            </div>

                            <ul className="mb-8 space-y-4">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <Check className="mr-3 h-5 w-5 flex-shrink-0 text-blue-500" />
                                        <span className="text-sm text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={cn(
                                    "w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
                                    tier.popular
                                        ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                                        : "bg-gray-50 text-gray-900 hover:bg-gray-100 focus:ring-gray-200"
                                )}
                            >
                                {tier.buttonText}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
