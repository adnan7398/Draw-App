import { JWT_SECRET } from "@repo/backend-common/config";
import { NextFunction ,Request, Response} from "express"
import  Jwt from "jsonwebtoken";

export const Middleware = (req:Request,res:Response,next:NextFunction)=>{
    const token = req.headers["authorization"] ?? "";
    const decoded = Jwt.verify(token,JWT_SECRET);

    if(decoded){
        //@ts-ignore
        req.userId = decoded.userId;
        next();
    }else{
        res.status(403).json({
            message:"Unauthorized"
        })
    }

}