import { z} from "zod";
export const CreateUserSchema = z.object({
            email:z.string().min(5).max(20).email(),
            name:z.string().min(6).max(20),
            password:z.string().min(8).max(20).refine((password)=>{
                const uppercase = /[A-Z]/.test(password);
                const lowercase = /[a-z]/.test(password);
                const specialchar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
                return uppercase && lowercase && specialchar;
            }, {
                message: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character."
            })
}); 
export const SigninSchema = z.object({
    email:z.string().min(5).max(20).email(),
    password:z.string().min(8).max(20).refine((password)=>{
        const uppercase = /[A-Z]/.test(password);
        const lowercase = /[a-z]/.test(password);
        const specialchar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return uppercase && lowercase && specialchar;
    }, {
        message: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character."
    })
});

export const CreateRoomSchema = z.object({
    name:z.string().min(3).max(20),
});