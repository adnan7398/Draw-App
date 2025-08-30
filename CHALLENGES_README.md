# Drawing Challenges Feature

A comprehensive drawing challenge system for ExcileDraw that provides daily, weekly, and monthly prompts to inspire creativity and build a community of artists.

## Features

### 🎯 Challenge Types
- **Daily Challenges**: Quick, simple prompts for daily practice
- **Weekly Challenges**: More complex projects with longer timeframes
- **Monthly Challenges**: Advanced masterpieces for experienced artists

### 🏷️ Categories
- **Still Life**: Objects and everyday items
- **Fantasy**: Imaginative and magical scenes
- **Portrait**: People and faces
- **Landscape**: Nature and outdoor scenes
- **Abstract**: Non-representational art

### 🎨 Difficulty Levels
- **Beginner**: Simple prompts for new artists
- **Intermediate**: Moderate complexity for developing skills
- **Advanced**: Complex challenges for experienced artists

### 📱 User Interface
- **Current Challenge Tab**: Shows the active daily/weekly challenge
- **All Challenges Tab**: Browse all available challenges with filtering
- **Gallery Tab**: View community submissions and get inspired

## Database Schema

### ChallengeCategory
```sql
model ChallengeCategory {
  id          String     @id @default(uuid())
  name        String
  description String?
  color       String?    // Hex color for UI
  icon        String?    // Icon name for UI
  challenges  Challenge[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

### Challenge
```sql
model Challenge {
  id          String     @id @default(uuid())
  title       String
  description String
  prompt      String     // The actual drawing prompt
  categoryId  String
  difficulty  String     // "beginner", "intermediate", "advanced"
  type        String     // "daily", "weekly", "monthly"
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean    @default(true)
  imageUrl    String?    // Optional reference image
  tags        String[]   // Array of tags for filtering
  submissions ChallengeSubmission[]
  category    ChallengeCategory @relation(fields: [categoryId], references: [id])
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

### ChallengeSubmission
```sql
model ChallengeSubmission {
  id          String    @id @default(uuid())
  challengeId String
  userId      String
  title       String?
  description String?
  imageUrl    String    // URL to the submitted drawing
  canvasData  String?   // JSON string of canvas data for reconstruction
  likes       Int       @default(0)
  isPublic    Boolean   @default(true)
  submittedAt DateTime  @default(now())
  challenge   Challenge @relation(fields: [challengeId], references: [id])
  user        User      @relation(fields: [userId], references: [id])
}
```

## API Endpoints

### Get All Challenges
```http
GET /api/challenges?category=still-life&difficulty=beginner&type=daily
```

### Get Current Challenge
```http
GET /api/challenges/current
```

### Get Challenge by ID
```http
GET /api/challenges/:id
```

### Submit Challenge
```http
POST /api/challenges/submit
Content-Type: application/json

{
  "challengeId": "uuid",
  "userId": "uuid",
  "imageUrl": "https://example.com/image.jpg",
  "canvasData": "json-string",
  "title": "My Drawing",
  "description": "Description of my artwork",
  "isPublic": true
}
```

### Get User Submissions
```http
GET /api/challenges/submissions?userId=uuid
```

### Like Submission
```http
POST /api/challenges/submissions/:id/like
```

### Get Categories
```http
GET /api/challenges/categories
```

## Setup Instructions

### 1. Database Migration
```bash
cd packages/db
npx prisma migrate dev --name add_challenges
```

### 2. Seed Sample Data
```bash
cd packages/db
pnpm seed
```

### 3. Start the Application
```bash
# Terminal 1: Start HTTP backend
cd apps/http-backned
pnpm dev

# Terminal 2: Start frontend
cd apps/excelidraw-frontend
pnpm dev
```

## Usage

### For Users
1. Navigate to `/challenges` to view available challenges
2. Click "Start Drawing" on any challenge to begin
3. Use the drawing tools to create your artwork
4. Submit your drawing with optional title and description
5. View other submissions in the gallery for inspiration

### For Developers
1. The challenge system is fully integrated with the existing drawing canvas
2. Challenges can be filtered by category, difficulty, and type
3. Submissions include both image URLs and canvas data for reconstruction
4. The system supports public and private submissions
5. Users can like and interact with community submissions

## Components

### ChallengesMock.tsx
A mock version of the challenges component that works with sample data. Use this for development and testing before the database is fully set up.

### Challenges.tsx
The full-featured challenges component that integrates with the backend API.

### useChallenges.ts
A custom hook that manages challenge state and API interactions.

## Future Enhancements

### Planned Features
- **Challenge Voting**: Community voting on challenge themes
- **Achievement System**: Badges and rewards for participation
- **Challenge Creation**: Allow users to create their own challenges
- **Social Features**: Comments, sharing, and collaboration
- **AI Integration**: AI-generated prompts and feedback
- **Mobile App**: Native mobile application for challenges

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live challenge updates
- **Image Optimization**: Automatic image compression and optimization
- **Caching**: Redis caching for improved performance
- **Analytics**: Challenge participation and engagement metrics
- **Moderation**: Content moderation for submissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
