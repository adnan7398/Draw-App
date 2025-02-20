import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";


export function Middleware(req: Request, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers["authorization"];

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(403).json({ message: "Unauthorized: No token provided" });
            return; // Ensure middleware doesn't continue
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            res.status(403).json({ message: "Unauthorized: Token missing" });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        if (!decoded || typeof decoded !== "object" || !decoded.userId) {
            res.status(403).json({ message: "Unauthorized: Invalid Token" });
            return;
        }

        //@ts-ignore
        req.userId = decoded.userId as string;
        next(); // Proceed to next middleware/route
    } catch (error) {
        console.error("JWT Error:", error);
        res.status(403).json({ message: "Unauthorized: Invalid or Expired Token" });
        return;
    }
}
