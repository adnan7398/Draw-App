import React, { useEffect, useRef, useState } from 'react';
import { Shape } from './types';
import { Game } from '../draw/Game';

interface TextEditorProps {
    shape: Shape | null | undefined;
    text: string;
    game: Game | undefined;
    onChange: (text: string) => void;
    onBlur: () => void;
}

export function TextEditor({ shape, text, game, onChange, onBlur }: TextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        const updatePosition = () => {
            if (shape && game && textareaRef.current && shape.type === 'text') {
                // Calculate screen position
                const screenPos = game.worldToScreen(shape.x, shape.y);
                const scale = game.getScale();
                const fontSize = shape.fontSize * scale;
                const color = (shape as any).color || shape.style?.textColor || '#000000';

                setStyle({
                    position: 'absolute',
                    left: `${screenPos.x}px`,
                    top: `${screenPos.y - 4}px`, // Slight offset to align with canvas text baseline
                    fontSize: `${fontSize}px`,
                    fontFamily: 'Arial, sans-serif',
                    color: color,
                    backgroundColor: 'transparent',
                    border: '1px dashed #0d99ff',
                    padding: '0px',
                    margin: '0',
                    outline: 'none',
                    resize: 'none',
                    overflow: 'hidden',
                    whiteSpace: 'pre',
                    lineHeight: '1.3',
                    zIndex: 100,
                    minWidth: '50px',
                    minHeight: `${fontSize * 1.3}px`,
                    opacity: 1
                });
            }
        };

        // Initial update
        updatePosition();

        // Listen for view changes
        const canvas = game?.getCanvas();
        if (canvas) {
            canvas.addEventListener('viewChanged', updatePosition);
            return () => {
                canvas.removeEventListener('viewChanged', updatePosition);
            };
        }
    }, [shape, game]);

    // Focus on mount
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.width = '0px';
            textareaRef.current.style.height = '0px';

            textareaRef.current.style.width = `${textareaRef.current.scrollWidth + 20}px`;
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [text, style]); // Re-run when text changes or style (font size) updates

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onBlur();
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onBlur();
        }
        e.stopPropagation(); // Prevent Canvas from receiving keys
    };

    if (!shape) return null;

    return (
        <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur} // Only blur if clicking outside or finished? Blur might trigger premature save if we just click toolbar/panel.
            // However, standard behavior is clicking outside commits text.
            // If clicking toolbar, we typically want access to it.
            // Excalidraw keeps selection active maybe.
            onKeyDown={handleKeyDown}
            style={style}
            spellCheck="false"
        />
    );
}
