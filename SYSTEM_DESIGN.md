# Draw-App System Design Document
## Comprehensive System Architecture & Design Patterns

---

## 1. SYSTEM OVERVIEW

### 1.1 Problem Statement
Build a real-time collaborative drawing application (similar to Excalidraw) with:
- Multi-user real-time collaboration
- AI-powered shape recognition and diagram detection
- Drawing challenges and submissions
- Room-based collaboration with public/private rooms
- WebSocket-based real-time synchronization

### 1.2 Core Requirements
- **Functional Requirements:**
  - User authentication and authorization
  - Real-time collaborative drawing canvas
  - Multiple drawing tools (pencil, shapes, text, etc.)
  - Room creation and management
  - AI-powered features (shape recognition, OCR, diagram detection)
  - Drawing challenges system
  - Chat functionality within rooms

- **Non-Functional Requirements:**
  - Low latency (< 100ms for real-time updates)
  - High availability (99.9% uptime)
  - Scalability (support 10K+ concurrent users)
  - Security (JWT-based auth, rate limiting)
  - Cross-platform (web, mobile-responsive)

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Next.js Frontend (React 19, TypeScript)        │  │
│  │  - Canvas Rendering (HTML5 Canvas API)                │  │
│  │  - WebSocket Client                                    │  │
│  │  - State Management (React Hooks)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ HTTP Backend │  │ WS Backend   │  │ ML Backend   │      │
│  │ (Express.js) │  │ (WebSocket)  │  │ (FastAPI)    │      │
│  │ Port: 3002   │  │ Port: 8081   │  │ Port: 3003   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   Redis      │  │   File       │      │
│  │  (Prisma)    │  │  (Optional)  │  │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Patterns

#### **Monorepo Architecture (Turborepo)**
- **Pattern**: Monorepo with workspace packages
- **Benefits**: 
  - Code sharing across services
  - Unified build pipeline
  - Type safety across packages
  - Easier dependency management
- **Structure**:
  ```
  apps/
    ├── excelidraw-frontend/  (Next.js)
    ├── http-backned/          (Express API)
    ├── ws-backend/            (WebSocket Server)
    └── ml-backend/            (Python FastAPI)
  
  packages/
    ├── common/                 (Shared types)
    ├── db/                    (Prisma client)
    ├── backend-common/        (Backend utilities)
    └── ui/                    (Shared UI components)
  ```

#### **Microservices Architecture**
- **Service Separation**:
  - **HTTP Backend**: RESTful API for CRUD operations
  - **WebSocket Backend**: Real-time communication
  - **ML Backend**: AI/ML processing (isolated for scalability)
- **Communication**: 
  - HTTP for synchronous operations
  - WebSocket for real-time events
  - Shared database for data consistency

#### **Event-Driven Architecture**
- **WebSocket Events**:
  - `join_room`: User joins a room
  - `draw`: Shape creation
  - `edit_shape`: Shape modification
  - `erase`: Shape deletion
  - `cursor_update`: Real-time cursor tracking
  - `user_activity`: User presence tracking

---

## 3. TECHNOLOGY STACK

### 3.1 Frontend Stack
- **Framework**: Next.js 15.1.7 (React 19)
- **Language**: TypeScript 5.5.4
- **Styling**: Tailwind CSS 4.0.6
- **Canvas API**: HTML5 Canvas with 2D Context
- **State Management**: React Hooks (Custom hooks pattern)
- **Build Tool**: Turborepo 2.3.3
- **Package Manager**: pnpm 9.0.0

### 3.2 Backend Stack
- **HTTP API**: Express.js 4.21.2 (Node.js)
- **WebSocket**: ws 8.18.0 (Node.js)
- **Language**: TypeScript
- **Validation**: Zod schemas (via @repo/common/types)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcrypt 5.1.1

### 3.3 ML/AI Backend
- **Framework**: FastAPI 0.104.0+
- **Language**: Python 3.11+
- **ML Libraries**:
  - PyTorch 2.1.0+ (Deep learning)
  - Transformers 4.35.0+ (Hugging Face)
  - OpenCV 4.8.0+ (Computer vision)
  - Pillow 10.0.0+ (Image processing)
- **Server**: Uvicorn (ASGI)

### 3.4 Database & ORM
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Migrations**: Prisma Migrate
- **Connection Pooling**: Prisma Client

### 3.5 Development Tools
- **Monorepo**: Turborepo
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript

---

## 4. COMPONENT DESIGN

### 4.1 Frontend Components

#### **Canvas Rendering Engine (Game.ts)**
- **Pattern**: Class-based stateful component
- **Responsibilities**:
  - Canvas rendering and drawing operations
  - Shape management (create, update, delete)
  - Viewport transformations (pan, zoom)
  - WebSocket message handling
  - Undo/redo functionality
  - Shape recognition (client-side)
- **Key Features**:
  - Infinite canvas with pan/zoom
  - Multi-touch support
  - Smooth path drawing with interpolation
  - Real-time cursor tracking
  - History stack for undo/redo

#### **React Component Architecture**
- **Pattern**: Custom Hooks + Component Composition
- **Hooks**:
  - `useCanvasState`: Canvas and WebSocket state
  - `useStylingState`: Color and styling management
  - `useTextTool`: Text editing functionality
  - `useAITools`: AI feature integration
  - `useChallenges`: Challenge system
- **Components**:
  - `CanvasRefactored`: Main canvas container
  - `Toolbar`: Drawing tools selection
  - `ColorPanel`: Color and styling controls
  - `AIPanel`: AI features UI
  - `Header`: Room info and controls

### 4.2 Backend Services

#### **HTTP Backend (Express.js)**
- **Endpoints**:
  - `POST /signup`: User registration
  - `POST /signin`: User authentication
  - `POST /room`: Create room
  - `GET /room/:id`: Get room details
  - `GET /rooms/my`: Get user's rooms
  - `POST /room/verify-password`: Verify private room password
- **Middleware**:
  - CORS middleware
  - JWT authentication middleware
  - Rate limiting (in-memory Map)
  - Request validation (Zod schemas)

#### **WebSocket Backend**
- **Connection Management**:
  - Token-based authentication (JWT in query params)
  - User session tracking
  - Room membership management
- **Message Types**:
  - `join_room`: Join a collaboration room
  - `draw`: Broadcast shape creation
  - `edit_shape`: Broadcast shape updates
  - `erase`: Broadcast shape deletion
  - `cursor_update`: Real-time cursor position
  - `user_activity`: User presence updates
  - `get_participant_count`: Request participant count
- **Optimization**:
  - Debouncing for drag operations
  - Room-based message filtering
  - Connection state management

#### **ML Backend (FastAPI)**
- **Endpoints**:
  - `POST /ai/shape-recognition`: Detect and clean shapes
  - `POST /ai/diagram-detection`: Detect diagram types
  - `POST /ai/handwriting-recognition`: OCR for handwritten text
  - `POST /ai/suggest-diagram`: Suggest diagram types
  - `POST /ai/auto-arrange`: Auto-arrange shapes
  - `POST /ai/complete-analysis`: Comprehensive AI analysis
- **Services**:
  - `ShapeRecognitionService`: Geometric shape detection
  - `DiagramDetectionService`: Diagram type classification
  - `OCRService`: Handwriting recognition
  - `AIAssistantService`: AI suggestions and assistance

---

## 5. DATA MODELS & DATABASE DESIGN

### 5.1 Database Schema (PostgreSQL + Prisma)

#### **User Model**
```prisma
model User {
  id       String  @id @default(uuid())
  email    String  @unique
  password String  // bcrypt hashed
  name     String
  photo    String?
  chats    Chat[]
  room     Room[]
  challengeSubmissions ChallengeSubmission[]
}
```
- **Design Decisions**:
  - UUID for user IDs (security, scalability)
  - Email as unique identifier
  - Optional photo for profile pictures
  - One-to-many relationships with rooms and submissions

#### **Room Model**
```prisma
model Room {
  id         Int      @id @default(autoincrement())
  name       String
  slug       String   @unique
  roomCode   String?  @unique // For private rooms
  created_at DateTime @default(now())
  adminId    String
  password   String?  // Optional password (bcrypt hashed)
  chats      Chat[]
  admin      User     @relation(fields: [adminId], references: [id])
}
```
- **Design Decisions**:
  - Integer ID for rooms (simpler URLs)
  - Unique slug for SEO-friendly URLs
  - Optional roomCode for private room sharing
  - Optional password for private rooms
  - Admin relationship for room ownership

#### **Chat Model**
```prisma
model Chat {
  id        Int      @id @default(autoincrement())
  roomId    Int
  message   String
  userId    String
  createdAt DateTime @default(now())
  room      Room     @relation(fields: [roomId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}
```
- **Design Decisions**:
  - Separate chat table for room messages
  - Timestamps for message ordering
  - Foreign keys for data integrity

#### **Challenge System Models**
```prisma
model ChallengeCategory {
  id          String     @id @default(uuid())
  name        String
  description String?
  color       String?
  icon        String?
  challenges  Challenge[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Challenge {
  id          String     @id @default(uuid())
  title       String
  description String
  prompt      String
  categoryId  String
  difficulty  String     // "beginner", "intermediate", "advanced"
  type        String     // "daily", "weekly", "monthly"
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean    @default(true)
  imageUrl    String?
  tags        String[]   // Array of tags
  submissions ChallengeSubmission[]
  category    ChallengeCategory @relation(...)
}

model ChallengeSubmission {
  id          String    @id @default(uuid())
  challengeId String
  userId      String
  title       String?
  description String?
  imageUrl    String
  canvasData  String?   // JSON string for reconstruction
  likes       Int       @default(0)
  isPublic    Boolean   @default(true)
  submittedAt DateTime  @default(now())
  challenge   Challenge @relation(...)
  user        User      @relation(...)
}
```

### 5.2 Database Design Patterns

#### **Normalization**
- 3NF normalized schema
- Separate tables for entities
- Foreign key relationships
- Indexed unique constraints

#### **Data Types**
- UUID for user IDs (distributed system friendly)
- Integer for room IDs (simpler, sequential)
- JSON strings for canvas data (flexible schema)
- Array types for tags (PostgreSQL arrays)

#### **Indexing Strategy**
- Primary keys (automatic indexes)
- Unique constraints (email, slug, roomCode)
- Foreign keys (automatic indexes)
- Consider: Index on `Room.created_at` for sorting
- Consider: Index on `Challenge.isActive` for filtering

---

## 6. REAL-TIME COMMUNICATION

### 6.1 WebSocket Architecture

#### **Connection Flow**
1. Client establishes WebSocket connection with JWT token
2. Server validates token and authenticates user
3. User joins room(s) via `join_room` message
4. Server maintains user-to-room mapping
5. Messages broadcasted to all users in the same room

#### **Message Broadcasting Pattern**
```typescript
// Server-side broadcasting
users.forEach(u => {
  if (u.rooms.includes(roomId) && 
      u.ws.readyState === WebSocket.OPEN && 
      u.userId !== senderId) {
    u.ws.send(JSON.stringify(message));
  }
});
```

#### **Optimization Techniques**

1. **Debouncing for Drag Operations**
   - Prevents spam during shape dragging
   - Uses `Map<string, NodeJS.Timeout>` to track pending updates
   - Only sends final position when drag ends

2. **Room-Based Filtering**
   - Messages only sent to users in the same room
   - Reduces unnecessary network traffic
   - Improves scalability

3. **Connection State Management**
   - Tracks `WebSocket.OPEN` state
   - Removes closed connections
   - Handles reconnection gracefully

4. **Throttling for Cursor Updates**
   - Cursor updates throttled to 20fps (50ms interval)
   - Reduces bandwidth usage
   - Maintains smooth user experience

### 6.2 Real-Time Features

#### **Shape Synchronization**
- **Create**: Broadcast `draw` message with shape data
- **Update**: Broadcast `edit_shape` message
- **Delete**: Broadcast `erase` message with shapeId
- **Conflict Resolution**: Last-write-wins (by shape ID)

#### **Cursor Tracking**
- Real-time cursor position updates
- User identification with colors
- Drawing state indication
- Automatic cleanup of stale cursors (10s timeout)

#### **User Presence**
- Participant count tracking
- User activity updates
- Join/leave notifications
- User list synchronization

---

## 7. SECURITY & AUTHENTICATION

### 7.1 Authentication Flow

#### **JWT-Based Authentication**
- **Token Structure**:
  ```json
  {
    "userId": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "iat": timestamp,
    "exp": timestamp
  }
  ```
- **Token Storage**: localStorage (client-side)
- **Token Validation**: 
  - HTTP requests: Bearer token in Authorization header
  - WebSocket: Token in query parameter

#### **Password Security**
- **Hashing**: bcrypt with salt rounds
- **Storage**: Never store plaintext passwords
- **Validation**: Server-side only

### 7.2 Security Measures

#### **Rate Limiting**
- **Implementation**: In-memory Map (can be moved to Redis)
- **Login Attempts**: 5 max attempts
- **Lock Duration**: 15 minutes
- **Reset Period**: 1 hour
- **Pattern**: Sliding window with exponential backoff

#### **Input Validation**
- **Schema Validation**: Zod schemas
- **Type Safety**: TypeScript
- **Sanitization**: Server-side validation
- **SQL Injection Prevention**: Prisma ORM (parameterized queries)

#### **CORS Configuration**
- **Development**: Allow all origins (`*`)
- **Production**: Should restrict to specific domains
- **Credentials**: Enabled for cookie-based auth (if needed)

#### **WebSocket Security**
- **Authentication**: Token required for connection
- **Authorization**: Room-based access control
- **Message Validation**: JSON schema validation
- **Connection Limits**: Per-user connection limits (can be added)

### 7.3 Private Room Security
- **Password Protection**: Optional bcrypt-hashed passwords
- **Room Codes**: 6-character unique codes for private rooms
- **Access Control**: Only users with code/password can join
- **Admin Rights**: Room creator has admin privileges

---

## 8. SCALABILITY & PERFORMANCE

### 8.1 Scalability Considerations

#### **Horizontal Scaling Challenges**

1. **WebSocket Server Scaling**
   - **Problem**: WebSocket connections are stateful
   - **Solution**: 
     - Use Redis Pub/Sub for cross-server communication
     - Sticky sessions (session affinity)
     - Message queue for broadcasting

2. **Database Scaling**
   - **Read Replicas**: For read-heavy operations
   - **Connection Pooling**: Prisma connection pool
   - **Caching**: Redis for frequently accessed data
   - **Sharding**: By room ID or user ID (future)

3. **ML Backend Scaling**
   - **Stateless Design**: Each request is independent
   - **Load Balancing**: Round-robin or least connections
   - **GPU Resources**: For ML model inference
   - **Async Processing**: Queue-based for heavy operations

#### **Caching Strategy**

1. **Client-Side Caching**
   - Canvas state in memory
   - Shape history for undo/redo
   - User preferences in localStorage

2. **Server-Side Caching** (Future)
   - Redis for:
     - User sessions
     - Room metadata
     - Frequently accessed shapes
     - Rate limiting data

### 8.2 Performance Optimizations

#### **Frontend Optimizations**

1. **Canvas Rendering**
   - RequestAnimationFrame for smooth rendering
   - Throttling for redraw operations (~60fps)
   - Viewport culling (only render visible shapes)
   - Canvas optimization flags:
     ```typescript
     ctx.imageSmoothingEnabled = true;
     ctx.imageSmoothingQuality = 'high';
     ```

2. **State Management**
   - React hooks for efficient re-renders
   - Memoization for expensive computations
   - Debouncing for user input

3. **Network Optimization**
   - WebSocket for real-time (low overhead)
   - Batch updates when possible
   - Compression for large payloads

#### **Backend Optimizations**

1. **Database Queries**
   - Prisma query optimization
   - Eager loading for relationships
   - Pagination for large datasets
   - Indexed queries

2. **WebSocket Optimization**
   - Room-based message filtering
   - Debouncing for frequent updates
   - Connection pooling
   - Message compression (future)

3. **ML Backend**
   - Model caching in memory
   - Batch processing for multiple requests
   - GPU acceleration for inference
   - Async processing for heavy operations

---

## 9. AI/ML INTEGRATION

### 9.1 ML Services Architecture

#### **Service Isolation**
- **Why**: ML models are resource-intensive
- **Benefits**: 
  - Independent scaling
  - Fault isolation
  - Different deployment requirements (GPU)

#### **ML Features**

1. **Shape Recognition**
   - **Input**: Hand-drawn sketch image
   - **Output**: Detected shapes (rectangles, circles, lines, etc.)
   - **Technology**: Computer vision + pattern recognition
   - **Use Case**: Convert rough sketches to clean shapes

2. **Diagram Detection**
   - **Input**: Complete drawing image
   - **Output**: Diagram type (flowchart, UML, mindmap, etc.)
   - **Technology**: Image classification
   - **Use Case**: Categorize and enhance diagrams

3. **Handwriting Recognition (OCR)**
   - **Input**: Handwritten text image
   - **Output**: Extracted text with confidence scores
   - **Technology**: OCR models (Tesseract or deep learning)
   - **Use Case**: Convert handwritten notes to editable text

4. **AI Assistant**
   - **Features**:
     - Diagram type suggestions
     - Icon recommendations
     - Auto-arrangement of shapes
     - Description generation
   - **Technology**: NLP models (GPT-2 or similar)

### 9.2 ML Pipeline

```
Client Request
    ↓
FastAPI Endpoint
    ↓
Image Preprocessing (PIL, OpenCV)
    ↓
ML Model Inference (PyTorch/Transformers)
    ↓
Post-processing
    ↓
JSON Response
```

### 9.3 Model Management
- **Loading**: Lazy loading on first request
- **Caching**: Models cached in memory
- **Versioning**: Model version tracking
- **Fallback**: Graceful degradation if model unavailable

---

## 10. DEPLOYMENT & INFRASTRUCTURE

### 10.1 Deployment Architecture

#### **Recommended Setup**

1. **Frontend**
   - **Platform**: Vercel, Netlify, or AWS S3 + CloudFront
   - **Build**: Next.js static export or SSR
   - **CDN**: For static assets

2. **HTTP Backend**
   - **Platform**: AWS ECS, Railway, Render, or DigitalOcean
   - **Container**: Docker
   - **Load Balancer**: Application Load Balancer

3. **WebSocket Backend**
   - **Platform**: Same as HTTP backend (or separate)
   - **Considerations**: 
     - Sticky sessions required
     - Redis Pub/Sub for multi-instance
     - Connection limits per instance

4. **ML Backend**
   - **Platform**: AWS ECS with GPU, Google Cloud Run, or dedicated GPU instance
   - **Requirements**: GPU for model inference
   - **Scaling**: Auto-scale based on queue length

5. **Database**
   - **Platform**: AWS RDS, DigitalOcean Managed DB, or Supabase
   - **Configuration**: 
     - Read replicas for scaling
     - Automated backups
     - Connection pooling

### 10.2 Infrastructure Components

#### **Containerization**
- **Docker**: For all services
- **Docker Compose**: For local development
- **Multi-stage builds**: For optimized images

#### **Monitoring & Logging**
- **Application Logs**: Console logging (can use CloudWatch, Datadog)
- **Error Tracking**: Sentry or similar
- **Metrics**: 
  - WebSocket connection count
  - API response times
  - Database query performance
  - ML inference latency

#### **CI/CD Pipeline**
- **Version Control**: Git (GitHub/GitLab)
- **Build**: Turborepo build pipeline
- **Testing**: Unit tests, integration tests
- **Deployment**: Automated deployment on merge

---

## 11. DESIGN PATTERNS & BEST PRACTICES

### 11.1 Design Patterns Used

1. **Monorepo Pattern**
   - Shared code across services
   - Type safety across boundaries
   - Unified build pipeline

2. **Microservices Pattern**
   - Service separation by concern
   - Independent deployment
   - Technology diversity (Node.js + Python)

3. **Event-Driven Pattern**
   - WebSocket events for real-time updates
   - Decoupled communication
   - Scalable message broadcasting

4. **Repository Pattern** (via Prisma)
   - Data access abstraction
   - Type-safe queries
   - Migration management

5. **Custom Hooks Pattern** (React)
   - Reusable state logic
   - Separation of concerns
   - Testability

6. **Observer Pattern**
   - WebSocket message listeners
   - Event-driven updates
   - React state updates

### 11.2 Code Organization

#### **Frontend Structure**
```
apps/excelidraw-frontend/
├── app/              # Next.js app router pages
├── component/        # React components
├── hooks/            # Custom React hooks
├── draw/             # Canvas rendering engine
└── config.ts         # Configuration
```

#### **Backend Structure**
```
apps/http-backned/
├── src/
│   ├── index.ts      # Express app
│   └── middleware.ts # Auth middleware

apps/ws-backend/
├── src/
│   └── index.ts      # WebSocket server

apps/ml-backend/
├── src/
│   ├── main.py       # FastAPI app
│   ├── ai_services.py
│   └── ml_services.py
```

#### **Shared Packages**
```
packages/
├── common/           # Shared TypeScript types
├── db/               # Prisma client
├── backend-common/   # Backend utilities
└── ui/               # Shared UI components
```

---

## 12. POTENTIAL INTERVIEW QUESTIONS & ANSWERS

### Q1: How does your system handle real-time collaboration?

**Answer:**
- **WebSocket-based communication**: Persistent connections for low-latency updates
- **Room-based broadcasting**: Messages filtered by room membership
- **Optimization techniques**:
  - Debouncing for drag operations (prevents spam)
  - Throttling for cursor updates (20fps)
  - Room-based message filtering
- **Conflict resolution**: Last-write-wins based on shape IDs
- **State synchronization**: 
  - Initial state loaded from database
  - Incremental updates via WebSocket
  - Client-side state management with React

### Q2: How would you scale this system to support 1 million concurrent users?

**Answer:**
1. **WebSocket Scaling**:
   - Use Redis Pub/Sub for cross-server communication
   - Implement sticky sessions (session affinity)
   - Horizontal scaling with load balancer
   - Connection limits per server instance

2. **Database Scaling**:
   - Read replicas for read-heavy operations
   - Connection pooling (Prisma)
   - Caching layer (Redis) for frequently accessed data
   - Database sharding by room ID or user ID

3. **ML Backend Scaling**:
   - Stateless design allows easy horizontal scaling
   - Load balancing with round-robin
   - Queue-based processing for heavy operations
   - GPU instances for model inference

4. **CDN & Caching**:
   - CDN for static assets
   - Redis for session data and room metadata
   - Client-side caching for canvas state

### Q3: How do you ensure data consistency in a distributed system?

**Answer:**
1. **Database Transactions**: 
   - ACID properties via PostgreSQL
   - Prisma transactions for multi-step operations

2. **Eventual Consistency**:
   - Real-time updates are eventually consistent
   - Last-write-wins for shape conflicts
   - Database as source of truth

3. **Conflict Resolution**:
   - Shape IDs prevent duplicates
   - Timestamp-based ordering
   - Client-side deduplication

4. **Idempotency**:
   - Shape operations are idempotent
   - Retry-safe message handling

### Q4: How does your authentication and authorization work?

**Answer:**
1. **Authentication**:
   - JWT tokens for stateless authentication
   - Token stored in localStorage (client)
   - Token validation on every request
   - Password hashing with bcrypt

2. **Authorization**:
   - JWT middleware for protected routes
   - Room-based access control
   - Admin privileges for room creators
   - Private room password protection

3. **Security Measures**:
   - Rate limiting (5 attempts, 15min lock)
   - Input validation (Zod schemas)
   - SQL injection prevention (Prisma ORM)
   - CORS configuration

### Q5: How would you handle WebSocket connection failures?

**Answer:**
1. **Client-Side**:
   - Exponential backoff reconnection
   - Connection state tracking
   - Graceful degradation
   - User notification of connection status

2. **Server-Side**:
   - Connection cleanup on close
   - Heartbeat/ping-pong for keepalive
   - Automatic user removal from rooms
   - Participant count updates

3. **Recovery**:
   - Re-sync state from database on reconnect
   - Message queue for missed updates (future)
   - Conflict resolution on rejoin

### Q6: How do you optimize for performance?

**Answer:**
1. **Frontend**:
   - RequestAnimationFrame for smooth rendering
   - Viewport culling (only render visible shapes)
   - Throttling and debouncing
   - React optimization (hooks, memoization)

2. **Backend**:
   - Database query optimization
   - Connection pooling
   - Caching (Redis for future)
   - Efficient WebSocket message filtering

3. **Network**:
   - WebSocket for real-time (low overhead)
   - Batch updates when possible
   - Compression for large payloads
   - CDN for static assets

### Q7: How does your ML backend integrate with the main system?

**Answer:**
1. **Architecture**:
   - Separate FastAPI service
   - Independent scaling
   - RESTful API communication
   - Stateless design

2. **Integration**:
   - Client makes HTTP requests to ML backend
   - Async processing for heavy operations
   - Error handling and fallbacks
   - Model caching for performance

3. **Scalability**:
   - Horizontal scaling with load balancer
   - Queue-based processing (future)
   - GPU instances for inference
   - Model versioning

### Q8: How would you implement undo/redo functionality?

**Answer:**
1. **Implementation**:
   - History stack in memory (client-side)
   - Shape state snapshots
   - Stack-based undo/redo
   - Keyboard shortcuts (Ctrl+Z, Ctrl+Y)

2. **Challenges**:
   - Memory management (limit stack size)
   - Multi-user conflicts
   - Network synchronization

3. **Solution**:
   - Local undo/redo (client-side only)
   - Server-side history (future)
   - Operational transformation (advanced)

### Q9: How do you handle different drawing tools and shapes?

**Answer:**
1. **Shape Types**:
   - Union types in TypeScript for type safety
   - Polymorphic rendering based on shape type
   - Extensible design for new shapes

2. **Tool System**:
   - Tool selection state
   - Tool-specific event handlers
   - Preview rendering during drawing
   - Shape recognition for freehand drawing

3. **Rendering**:
   - Canvas 2D API for all shapes
   - Smooth path interpolation
   - Gradient and styling support
   - Selection and resize handles

### Q10: How would you add persistence for drawings?

**Answer:**
1. **Current Implementation**:
   - Shapes stored in database (via HTTP API)
   - Initial load on room join
   - Real-time updates via WebSocket

2. **Enhancements**:
   - Periodic auto-save
   - Version history
   - Export/import functionality
   - Cloud storage for images

3. **Database Design**:
   - Separate table for shape data
   - JSON storage for complex shapes
   - Indexing for fast retrieval
   - Archival for old drawings

---

## 13. METRICS & MONITORING

### 13.1 Key Metrics to Track

1. **Performance Metrics**:
   - API response time (p50, p95, p99)
   - WebSocket message latency
   - Database query time
   - ML inference latency

2. **Scalability Metrics**:
   - Concurrent WebSocket connections
   - Active rooms count
   - Messages per second
   - Database connection pool usage

3. **Reliability Metrics**:
   - Uptime percentage
   - Error rate
   - Connection failure rate
   - Message delivery success rate

4. **User Metrics**:
   - Active users
   - Rooms created per day
   - Average session duration
   - Feature usage (AI features, challenges)

### 13.2 Monitoring Tools (Recommended)

- **Application Monitoring**: Datadog, New Relic, or AWS CloudWatch
- **Error Tracking**: Sentry
- **Logging**: ELK Stack or CloudWatch Logs
- **APM**: Application Performance Monitoring tools
- **Uptime Monitoring**: Pingdom or UptimeRobot

---

## 14. FUTURE ENHANCEMENTS

### 14.1 Scalability Improvements
- Redis for session management and caching
- Message queue (RabbitMQ/Kafka) for async processing
- Database read replicas
- CDN for static assets
- WebSocket connection pooling

### 14.2 Feature Enhancements
- Version history for drawings
- Export to various formats (PDF, PNG, SVG)
- Templates library
- Collaboration permissions (view-only, edit, admin)
- Comments and annotations
- Mobile app (React Native)

### 14.3 Technical Improvements
- GraphQL API (alternative to REST)
- WebRTC for peer-to-peer (reduce server load)
- Operational transformation for better conflict resolution
- End-to-end encryption for private rooms
- Advanced caching strategies

---

## 15. CONCLUSION

This system demonstrates:
- **Microservices architecture** with service separation
- **Real-time communication** via WebSocket
- **Scalable design** with horizontal scaling support
- **Security best practices** (JWT, rate limiting, input validation)
- **AI/ML integration** with isolated ML service
- **Modern tech stack** (Next.js, TypeScript, Prisma, FastAPI)
- **Monorepo structure** for code sharing and type safety
- **Performance optimizations** at multiple layers

The architecture is designed to handle:
- Real-time collaboration with low latency
- High concurrency with proper scaling strategies
- Security and authentication
- AI-powered features
- Extensibility for future enhancements

---

## APPENDIX: KEY CODE PATTERNS

### A. WebSocket Message Broadcasting
```typescript
// Broadcast to all users in a room except sender
users.forEach(u => {
  if (u.rooms.includes(roomId) && 
      u.ws.readyState === WebSocket.OPEN && 
      u.userId !== senderId) {
    u.ws.send(JSON.stringify(message));
  }
});
```

### B. Rate Limiting Pattern
```typescript
const loginAttempts = new Map<string, {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}>();

function checkRateLimit(email: string) {
  // Sliding window with lockout
  // Reset after 1 hour
  // Lock for 15 minutes after 5 attempts
}
```

### C. Shape Rendering Pattern
```typescript
// Polymorphic rendering based on shape type
if (shape.type === "rect") {
  // Render rectangle
} else if (shape.type === "circle") {
  // Render circle
} else if (shape.type === "path") {
  // Render path with smooth interpolation
}
```

### D. Custom Hook Pattern
```typescript
export function useCanvasState(roomId: string, socket: WebSocket) {
  const [state, setState] = useState<CanvasState>({...});
  
  useEffect(() => {
    // WebSocket event listeners
    // State updates
  }, [socket, roomId]);
  
  return { state, setters, ... };
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2025  
**Author**: System Design Documentation

