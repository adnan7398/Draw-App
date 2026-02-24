"use client";

import { motion } from "framer-motion";

const integrations = [
    { name: "Slack", icon: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" },
    { name: "Notion", icon: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" },
    { name: "GitHub", icon: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" },
    { name: "Figma", icon: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" },
    { name: "Jira", icon: "https://worldvectorlogo.com/logos/jira-3.svg" },
];

export function Integrations() {
    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-lg font-medium text-gray-500 mb-12">
                    Integrates seamlessly with your favorite tools
                </p>

                <div className="flex flex-wrap justify-center gap-12 grayscale opacity-70">
                    {integrations.map((integration) => (
                        <div key={integration.name} className="flex items-center justify-center">
                            <img
                                src={integration.icon}
                                alt={integration.name}
                                className="h-8 md:h-10 w-auto object-contain hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
