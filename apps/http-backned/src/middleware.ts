import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";


export function Middleware(req: Request, res: Response, next: NextFunction) {
    const authHeader= req.headers["authorization"] ?? "";
    if (!authHeader) {
        res.status(401).json({ message: "Unauthorized: No token provided" });
        return;
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token as string, JWT_SECRET);

    if (decoded) {
        // @ts-ignore: TODO: Fix this
        req.userId = decoded.userId;
        next();
    } else {
        res.status(403).json({
            message: "Unauthorized"
        })
    }
}