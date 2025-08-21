import { ReactNode } from "react";

export function IconButton({
    icon, 
    onClick, 
    activated,
    label
}: {
    icon: ReactNode,
    onClick: () => void,
    activated: boolean,
    label?: string
}) {
    return (
        <div className="group relative">
            <button
                className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 flex items-center justify-center ${
                    activated 
                        ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/25' 
                        : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:border-white/30 hover:text-white'
                }`}
                onClick={onClick}
            >
                {icon}
            </button>
            
            {label && (
                <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {label}
                </div>
            )}
        </div>
    );
}

