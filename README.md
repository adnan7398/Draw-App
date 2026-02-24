# 🎨 Draw-App (ExcileDraw)

A real-time, highly scalable collaborative drawing application packed with advanced AI features and community challenges. Built with a modern tech stack utilizing a Turborepo monorepo architecture, this project is designed for seamless low-latency collaboration and creative expression.

---

## ✨ Key Features

- **Real-Time Collaboration**: Instant synchronization of shapes, text, and cursors across multiple users in the same room via WebSockets.
- **AI-Powered Capabilities**: Features include shape recognition (cleaning up hand-drawn sketches), diagram detection, handwriting recognition (OCR), and an AI Assistant for suggestions.
- **Community Challenges**: Participate in daily, weekly, or monthly drawing challenges with varying difficulties and categories. Submit and explore art within the community.
- **Secure Room Management**: Create public or private rooms with password protection and unique room codes.
- **High Performance**: Optimized canvas rendering, debounced real-time updates, and an event-driven architecture to support thousands of concurrent connections.

---

## 🏗️ System Architecture

This project is a monorepo powered by [Turborepo](https://turbo.build/repo/docs) and utilizes a microservices approach:

- **Frontend (`apps/excelidraw-frontend`)**: Next.js 15, React 19, TypeScript, Tailwind CSS, and HTML5 Canvas API.
- **HTTP Backend (`apps/http-backned`)**: Node.js & Express API for RESTful operations (auth, rooms).
- **WebSocket Backend (`apps/ws-backend`)**: Node.js WebSocket server for real-time room communication.
- **ML Backend (`apps/ml-backend`)**: Python FastAPI server utilizing PyTorch and Transformers for AI tasks.
- **Shared Packages (`packages/*`)**: Common types, Prisma database client, and shared UI components.

**Database**: PostgreSQL managed with Prisma ORM.

---

## 🐳 Running via Docker (Recommended)

The easiest way to get the application running alongside its database is by using Docker Compose.

**Prerequisites**:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

**Steps**:

1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   cd Draw-App
   ```

2. **Start the containers** in detached mode:
   ```bash
   docker-compose up --build -d
   ```
   *This command will spin up the PostgreSQL database, the HTTP backend, the WebSocket backend, and the Next.js frontend.*

3. **Access the application**:
   - Frontend: [http://localhost:3001](http://localhost:3001)
   - HTTP API: [http://localhost:3002](http://localhost:3002)
   - WebSocket Server: `ws://localhost:8081`

4. **Stopping the containers**:
   ```bash
   docker-compose down
   ```

---

## 💻 Running Locally

To run the project directly on your local machine for development purposes.

**Prerequisites**:
- [Node.js](https://nodejs.org/) (>= 18)
- [pnpm](https://pnpm.io/installation) (v9+)
- [PostgreSQL](https://www.postgresql.org/download/) (running locally)
- *Optional: Python 3.11+ (if you wish to run the ML backend locally)*

**Steps**:

1. **Install dependencies**:
   Run this command from the root directory to install packages for all workspaces.
   ```bash
   pnpm install
   ```

2. **Environment Variables**:
   Ensure you setup any necessary `.env` files in the respective app directories (`excelidraw-frontend`, `http-backned`, `ws-backend`) with your PostgreSQL connection string and JWT secrets. 
   *(Example for backend apps: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/drawapp"`)*

3. **Database Setup**:
   Navigate to the database package to apply migrations and seed initial data (like challenge categories).
   ```bash
   cd packages/db
   npx prisma migrate dev
   pnpm seed    # Optional, to seed challenge data
   cd ../..
   ```

4. **Start the Development Servers**:
   From the root directory, leverage Turborepo to start all apps simultaneously.
   ```bash
   pnpm dev
   ```

**App Defaults locally**:
- Frontend will typically start on `http://localhost:3000` (or `3001`).
- HTTP Backend runs on port `3002`.
- WebSocket Server runs on port `8081`.

---

## 📁 Repository Structure

```text
Draw-App/
├── apps/
│   ├── excelidraw-frontend/   # Next.js web application
│   ├── http-backned/          # Express API server 
│   ├── ml-backend/            # FastAPI machine learning server
│   └── ws-backend/            # Node.js WebSocket server
├── packages/
│   ├── backend-common/        # Shared backend logic
│   ├── common/                # Shared TypeScript models/types
│   ├── db/                    # Prisma schema, migrations, and seed logic
│   ├── eslint-config/         # Shared ESLint configuration
│   ├── typescript-config/     # Shared TS configs
│   └── ui/                    # Shared React UI components
├── docker/                    # Dockerfiles for each service
├── package.json               # Root workspace configuration
├── turbo.json                 # Turborepo pipeline configuration
└── docker-compose.yml         # Container orchestration
```

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License
This project is licensed under the MIT License.
