import express from "express";
import Jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config"
import { CreateUserSchema, SigninSchema, CreateRoomSchema, AuthResponse, AUTH_ERROR_MESSAGES } from "@repo/common/types"
import { prismaClient } from "@repo/db/client"
import { parse } from "path";
import { Middleware } from "./middleware";
import cors from "cors";
import bcrypt from "bcrypt";

const app = express();
app.use(cors())
app.use(express.json());

// Rate limiting for security
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();

const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  LOCK_DURATION: 15 * 60 * 1000, // 15 minutes
  RESET_AFTER: 60 * 60 * 1000, // 1 hour
};

// Helper function to check rate limiting
function checkRateLimit(email: string): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };

  // Reset if enough time has passed
  if (now - attempts.lastAttempt > RATE_LIMIT.RESET_AFTER) {
    loginAttempts.delete(email);
    return { allowed: true, remainingAttempts: RATE_LIMIT.MAX_ATTEMPTS };
  }

  // Check if account is locked
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      lockedUntil: attempts.lockedUntil 
    };
  }

  // Clear lock if time has passed
  if (attempts.lockedUntil && now >= attempts.lockedUntil) {
    attempts.lockedUntil = undefined;
    attempts.count = 0;
  }

  return { 
    allowed: attempts.count < RATE_LIMIT.MAX_ATTEMPTS, 
    remainingAttempts: Math.max(0, RATE_LIMIT.MAX_ATTEMPTS - attempts.count)
  };
}

// Helper function to record failed login attempt
function recordFailedAttempt(email: string) {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
  
  attempts.count += 1;
  attempts.lastAttempt = now;

  // Lock account if max attempts reached
  if (attempts.count >= RATE_LIMIT.MAX_ATTEMPTS) {
    attempts.lockedUntil = now + RATE_LIMIT.LOCK_DURATION;
  }

  loginAttempts.set(email, attempts);
}

// Helper function to clear failed attempts on successful login
function clearFailedAttempts(email: string) {
  loginAttempts.delete(email);
}

app.post("/signup", async (req, res) => {
  try {
    // Validate input data
    const parsedData = CreateUserSchema.safeParse(req.body);
    
    if (!parsedData.success) {
      const errors: Record<string, string[]> = {};
      
      parsedData.error.errors.forEach((error) => {
        const field = error.path.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(error.message);
      });

      const response: AuthResponse = {
        success: false,
        message: "Validation failed",
        errors
      };
      
      return res.status(400).json(response);
    }

    const { email, password, name } = parsedData.data;

    // Check if user already exists
    const existingUser = await prismaClient.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      const response: AuthResponse = {
        success: false,
        message: AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS
      };
      return res.status(409).json(response);
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 12); // Increased salt rounds for security

    // Create user
    const user = await prismaClient.user.create({
      data: {
        email,
        password: hashPassword,
        name,
      }
    });

    // Generate JWT token
    const token = Jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name
      }, 
      JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    const response: AuthResponse = {
      success: true,
      message: "Account created successfully!",
      token,
      userId: user.id
    };

    res.status(201).json(response);

  } catch (error) {
    console.error("Signup error:", error);
    
    const response: AuthResponse = {
      success: false,
      message: AUTH_ERROR_MESSAGES.SERVER_ERROR
    };
    
    res.status(500).json(response);
  }
});

app.post("/signin", async (req, res) => {
  try {
    // Validate input data
    const parsedData = SigninSchema.safeParse(req.body);
    
    if (!parsedData.success) {
      const errors: Record<string, string[]> = {};
      
      parsedData.error.errors.forEach((error) => {
        const field = error.path.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(error.message);
      });

      const response: AuthResponse = {
        success: false,
        message: "Validation failed",
        errors
      };
      
      return res.status(400).json(response);
    }

    const { email, password } = parsedData.data;

    // Check rate limiting
    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      const response: AuthResponse = {
        success: false,
        message: AUTH_ERROR_MESSAGES.ACCOUNT_LOCKED
      };
      return res.status(429).json(response);
    }

    // Find user
    const user = await prismaClient.user.findUnique({
      where: { email }
    });

    if (!user) {
      recordFailedAttempt(email);
      
      const response: AuthResponse = {
        success: false,
        message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS
      };
      return res.status(401).json(response);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      recordFailedAttempt(email);
      
      const response: AuthResponse = {
        success: false,
        message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS
      };
      return res.status(401).json(response);
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(email);

    // Generate JWT token
    const token = Jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name
      }, 
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response: AuthResponse = {
      success: true,
      message: "Signed in successfully!",
      token,
      userId: user.id
    };

    res.json(response);

  } catch (error) {
    console.error("Signin error:", error);
    
    const response: AuthResponse = {
      success: false,
      message: AUTH_ERROR_MESSAGES.SERVER_ERROR
    };
    
    res.status(500).json(response);
  }
});

app.post("/room", Middleware, async (req, res) => {
  try {
    const parsedData = CreateRoomSchema.safeParse(req.body); 
    
    if (!parsedData.success) {
      const errors: Record<string, string[]> = {};
      
      parsedData.error.errors.forEach((error) => {
        const field = error.path.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(error.message);
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    const { name, isPrivate, password } = parsedData.data;
    
    // @ts-ignore: TODO: Fix this
        const userId = req.userId;

    // Generate a unique slug for the room
    const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // Generate room code for private rooms
    let roomCode = null;
    if (isPrivate) {
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6-character code
    }

    // Hash password if room is private
    let hashedPassword = null;
    if (isPrivate && password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    const room = await prismaClient.room.create({
      data: {
        name,
        slug,
        roomCode,
        adminId: userId,
        password: hashedPassword
            }
        });
        
        res.json({
      success: true,
      message: "Room created successfully!",
      roomId: room.id,
      roomCode: room.roomCode
    });

    } catch (error) {
    console.error("Room creation error:", error);
        res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create room"
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString() 
  });
});

// Get user profile (protected route)
app.get("/profile", Middleware, async (req, res) => {
  try {
    // @ts-ignore: TODO: Fix this
    const userId = req.userId;

    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
});

// Get room by ID
app.get("/room/id/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await prismaClient.room.findUnique({
      where: { id: parseInt(roomId) }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    res.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        slug: room.slug,
        roomCode: room.roomCode,
        createdAt: room.created_at,
        isPrivate: !!room.password
      }
    });

  } catch (error) {
    console.error("Room fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch room"
    });
  }
});

// Get user's rooms
app.get("/rooms/my", Middleware, async (req, res) => {
  try {
    // @ts-ignore: TODO: Fix this
    const userId = req.userId;

    const rooms = await prismaClient.room.findMany({
      where: { adminId: userId },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      rooms: rooms.map(room => ({
        id: room.id,
        name: room.name,
        slug: room.slug,
        createdAt: room.created_at,
        isPrivate: false // For now, all rooms are public
      }))
    });

  } catch (error) {
    console.error("My rooms fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms"
    });
  }
});

// Get room by slug (must come after /room/id/:roomId to avoid conflicts)
app.get("/room/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    
    const room = await prismaClient.room.findUnique({
      where: { slug: slug }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    res.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        slug: room.slug,
        roomCode: room.roomCode,
        createdAt: room.created_at,
        isPrivate: !!room.password
      }
    });

  } catch (error) {
    console.error("Room fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch room"
    });
  }
});

// Get room by code
app.get("/room/code/:roomCode", async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    const room = await prismaClient.room.findUnique({
      where: { roomCode: roomCode }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    res.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        slug: room.slug,
        roomCode: room.roomCode,
        createdAt: room.created_at,
        isPrivate: !!room.password
      }
    });

  } catch (error) {
    console.error("Room fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch room"
    });
  }
});

// Verify room password
app.post("/room/verify-password", async (req, res) => {
  try {
    const { roomId, password } = req.body;
    
    if (!roomId || !password) {
      return res.status(400).json({
        success: false,
        message: "Room ID and password are required"
      });
    }

    const room = await prismaClient.room.findUnique({
      where: { id: parseInt(roomId) }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    if (!room.password) {
      return res.status(400).json({
        success: false,
        message: "This room is not password protected"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, room.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password"
      });
    }

    res.json({
      success: true,
      message: "Password verified successfully"
    });

  } catch (error) {
    console.error("Password verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify password"
    });
  }
});

// Get chat messages for a room
app.get("/chats/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await prismaClient.room.findUnique({
      where: { id: parseInt(roomId) }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    const messages = await prismaClient.chat.findMany({
      where: { roomId: parseInt(roomId) },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
        }
    });

    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        userId: msg.userId,
        roomId: msg.roomId,
        user: msg.user,
        createdAt: msg.createdAt
      }))
    });

  } catch (error) {
    console.error("Chat messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat messages"
    });
  }
});

// Challenge API endpoints

// Get all challenges with optional filters
app.get("/api/challenges", async (req, res) => {
  try {
    const { category, difficulty, type } = req.query;
    
    const where: any = {
      isActive: true,
    };

    if (category) where.categoryId = category;
    if (difficulty) where.difficulty = difficulty;
    if (type) where.type = type;

    const challenges = await prismaClient.challenge.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(challenges);
  } catch (error) {
    console.error("Challenges fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch challenges",
    });
  }
});

// Get current challenge (daily/weekly)
app.get("/api/challenges/current", async (req, res) => {
  try {
    const now = new Date();
    
    const currentChallenge = await prismaClient.challenge.findFirst({
      where: {
        isActive: true,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
      include: {
        category: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        endDate: 'asc', // Get the one ending soonest
      },
    });

    if (!currentChallenge) {
      return res.status(404).json({
        success: false,
        message: "No active challenge found",
      });
    }

    res.json(currentChallenge);
  } catch (error) {
    console.error("Current challenge fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch current challenge",
    });
  }
});

// Get challenge by ID
app.get("/api/challenges/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const challenge = await prismaClient.challenge.findUnique({
      where: { id },
      include: {
        category: true,
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                photo: true,
              },
            },
          },
          orderBy: {
            submittedAt: 'desc',
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    res.json(challenge);
  } catch (error) {
    console.error("Challenge fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch challenge",
    });
  }
});

// Submit a challenge
app.post("/api/challenges/submit", async (req, res) => {
  try {
    const { challengeId, userId, imageUrl, canvasData, title, description, isPublic } = req.body;
    
    if (!challengeId || !userId || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Challenge ID, user ID, and image URL are required",
      });
    }

    // Check if challenge exists and is active
    const challenge = await prismaClient.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    if (!challenge.isActive) {
      return res.status(400).json({
        success: false,
        message: "Challenge is not active",
      });
    }

    // Check if user has already submitted to this challenge
    const existingSubmission = await prismaClient.challengeSubmission.findFirst({
      where: {
        challengeId,
        userId,
      },
    });

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted to this challenge",
      });
    }

    const submission = await prismaClient.challengeSubmission.create({
      data: {
        challengeId,
        userId,
        imageUrl,
        canvasData,
        title,
        description,
        isPublic: isPublic !== false, // Default to true
      },
      include: {
        challenge: true,
        user: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error("Challenge submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit challenge",
    });
  }
});

// Get user submissions
app.get("/api/challenges/submissions", async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const submissions = await prismaClient.challengeSubmission.findMany({
      where: {
        userId: userId as string,
        isPublic: true,
      },
      include: {
        challenge: true,
        user: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    res.json(submissions);
  } catch (error) {
    console.error("Submissions fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch submissions",
    });
  }
});

// Like a submission
app.post("/api/challenges/submissions/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await prismaClient.challengeSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    const updatedSubmission = await prismaClient.challengeSubmission.update({
      where: { id },
      data: {
        likes: {
          increment: 1,
        },
      },
    });

    res.json(updatedSubmission);
  } catch (error) {
    console.error("Like submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to like submission",
    });
  }
});

// Get challenge categories
app.get("/api/challenges/categories", async (req, res) => {
  try {
    const categories = await prismaClient.challengeCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    res.json(categories);
  } catch (error) {
    console.error("Categories fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

