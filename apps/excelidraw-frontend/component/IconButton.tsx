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
                className={`w-10 h-10 rounded border transition-all duration-200 flex items-center justify-center ${
                    activated 
                        ? 'bg-gray-900 border-gray-900 text-white shadow-sm' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900'
                }`}
                onClick={onClick}
            >
                {icon}
            </button>
            
            {label && (
                <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {label}
                </div>
            )}
        </div>
    );
}

