import express from "express";
import Jwt from "jsonwebtoken";
import {JWT_SECRET}  from "@repo/backend-common/config"
import {CreateUserSchema,SigninSchema,CreateRoomSchema} from "@repo/common/types"
import {prismaClient} from "@repo/db/client"
import { parse } from "path";
import { Middleware } from "./middleware";
import cors from "cors";
import bcrypt from "bcrypt";
const app = express();
app.use(cors())
app.use(express.json());


app.post("/signup",async(req,res)=>{
    const parsedData = CreateUserSchema.safeParse(req.body)
    console.log(parsedData.error);
    if(!parsedData.success){
        console.log(parsedData.error);
         res.json({
            message:"Incorrect Input"
        })
        return ;
    }
    const email  = parsedData.data.email;
    const password = parsedData.data.password;  
    const name = parsedData.data.name;
    try {
        const hashPassword = await bcrypt.hash(password,10);
        const user = await prismaClient.user.create({
            data:{
                email:email,
                password:hashPassword,
                name:name,
            }
        })
        res.json({
            userId : user.id
        })
    } catch (e) {
        res.status(411).json({
            message:"User Already Exist with this username"
        })
    }
})

app.post("/signin",async(req,res)=>{
    const parsedData = SigninSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"Invalid SignIn detail"
        })
        return ;
    }
    const email= parsedData.data.email 
    const password = parsedData.data.password;
    const user = await prismaClient.user.findFirst({
        where:{
            email:email,
        }
    })
    if(!user){
        res.status(403).json({
            message:"Not Authorized"
        })
        return 
    }
    const comparepassword = await bcrypt.compare(password,user.password);
    if(!comparepassword){
        res.status(403).json({
            message:"Not Authorized,....."
        })
        return
    }

    const token  = Jwt.sign({
        userId :user?.id
    },JWT_SECRET);
   res.json({   
       token 
   })
})

app.post("/room",Middleware,async(req,res)=>{
    const parsedData = CreateRoomSchema.safeParse(req.body); 
    if(!parsedData.success){
        console.log(parsedData.error);
        res.json({  
            Message:"invalid input"
        })
        return ;
    }
    try {
        //@ts-ignore
        const userId = req.userId;
        const room = await prismaClient.room.create({
            data:{
                slug:parsedData.data.name,
                admindId:userId
            }
        })
        res.json({
            roomId :room.id 
        })
    } catch (error) {
        res.status(411).json({
            message:"this room is already exist"
        })
    }
})
app.get("/chats/:roomId",async (req,res)=>{
    const roomId = Number(req.params.roomId);
    const messages  = await prismaClient.chat.findMany({
       where:{
        roomId:roomId,
       },
       orderBy:{
            id:"desc"
       },
       take:500
    })
    res.json({
        messages
    })
})
app.get("/room/:slug", async (req, res) => {
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where: {
            slug
        }
    });

    res.json({
        roomId: room?.id
    })
})
app.listen(3002);

