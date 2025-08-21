import { getBackendUrl } from "@/config";
import axios from "axios";

export async function getExistingShapes(roomId: string) {
    try {
        const res = await axios.get(`${getBackendUrl()}/chats/${roomId}`);
        const messages = res.data.messages;

        const shapes: any[] = [];
        
        for (const message of messages) {
            try {
                const messageData = JSON.parse(message.message);
                
                // Only process shape-related messages
                if (messageData.type === "shape_create" && messageData.shape) {
                    shapes.push(messageData.shape);
                } else if (messageData.type === "shape_update" && messageData.shape) {
                    // For updates, we need to find and replace existing shapes
                    const existingIndex = shapes.findIndex((s: any) => s.id === messageData.shape.id);
                    if (existingIndex !== -1) {
                        shapes[existingIndex] = messageData.shape;
                    } else {
                        shapes.push(messageData.shape);
                    }
                } else if (messageData.type === "shape_delete" && messageData.shapeId) {
                    // Remove deleted shapes
                    const index = shapes.findIndex((s: any) => s.id === messageData.shapeId);
                    if (index !== -1) {
                        shapes.splice(index, 1);
                    }
                }
            } catch (parseError) {
                // Skip messages that can't be parsed as JSON
                continue;
            }
        }

        // Filter out any invalid shapes
        return shapes.filter((shape: any) => 
            shape && 
            typeof shape === 'object' && 
            shape.type && 
            shape.id &&
            (shape.type === "rect" || shape.type === "circle" || shape.type === "line" || shape.type === "path")
        );
    } catch (error) {
        console.error("Error fetching existing shapes:", error);
        return [];
    }
}