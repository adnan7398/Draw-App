export const JWT_SECRET = process.env.JWT_SECRET ||"123123";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
}