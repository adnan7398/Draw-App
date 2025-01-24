import express from "express";
import Jwt from "jsonwebtoken";
import {JWT_SECRET}  from "@repo/backend-common/config"
import {CreateUserSchema,SigninSchema,CreateRoomSchema} from "@repo/common/types"
import {prismaClient} from "@repo/db/client"
import { parse } from "path";
const app = express();


app.post("/signup",async(req,res)=>{
    const parsedData = CreateUserSchema.safeParse(req.body)
    if(!parsedData.success){
         res.json({
            message:"Incorrect Input"
        })
        return ;
    }
    await prismaClient.user.create({
        data:{
            email:parsedData.data?.email,
            password:parsedData.data.password,
            name:parsedData.data.name,
            photo:parsedData.data.photo||"",
        }
    })
})

app.post("/signin",(req,res)=>{
    const data = SigninSchema.safeParse(req.body);
    if(!data.success){
        res.json({
            message:"Invalid SignIn detail"
        })
        return ;
    }
    const userId = 1;
    const token  = Jwt.sign({
        userId
    },JWT_SECRET);
})

app.post("/room",(req,res)=>{
    const data = CreateRoomSchema.safeParse(req.body);
    if(!data.success){
        res.json({
            Message:"invalid input "
        })
        return ;
    }
    res.json({
        roomId :123 
    })
})
app.listen(3002);

