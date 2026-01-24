"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding challenge data...');
    // Create challenge categories
    const categories = await Promise.all([
        prisma.challengeCategory.create({
            data: {
                name: 'Still Life',
                description: 'Objects and everyday items',
                color: '#8B5CF6',
                icon: '🍎',
            },
        }),
        prisma.challengeCategory.create({
            data: {
                name: 'Fantasy',
                description: 'Imaginative and magical scenes',
                color: '#EC4899',
                icon: '🐉',
            },
        }),
        prisma.challengeCategory.create({
            data: {
                name: 'Portrait',
                description: 'People and faces',
                color: '#F59E0B',
                icon: '👤',
            },
        }),
        prisma.challengeCategory.create({
            data: {
                name: 'Landscape',
                description: 'Nature and outdoor scenes',
                color: '#10B981',
                icon: '🏔️',
            },
        }),
        prisma.challengeCategory.create({
            data: {
                name: 'Abstract',
                description: 'Non-representational art',
                color: '#EF4444',
                icon: '🎨',
            },
        }),
    ]);
    console.log('✅ Created categories:', categories.map(c => c.name));
    // Get category IDs
    const stillLifeId = categories.find(c => c.name === 'Still Life').id;
    const fantasyId = categories.find(c => c.name === 'Fantasy').id;
    const portraitId = categories.find(c => c.name === 'Portrait').id;
    const landscapeId = categories.find(c => c.name === 'Landscape').id;
    const abstractId = categories.find(c => c.name === 'Abstract').id;
    // Create challenges
    const challenges = await Promise.all([
        // Daily challenges
        prisma.challenge.create({
            data: {
                title: 'Daily Sketch: Coffee Cup',
                description: 'Start your day with a warm cup of creativity! Draw a coffee cup in your unique style.',
                prompt: 'Draw a coffee cup with steam rising from it. Add your own creative twist!',
                categoryId: stillLifeId,
                difficulty: 'beginner',
                type: 'daily',
                startDate: new Date(),
                endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                isActive: true,
                imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
                tags: ['coffee', 'daily', 'simple'],
            },
        }),
        prisma.challenge.create({
            data: {
                title: 'Daily Sketch: Your Favorite Book',
                description: 'Draw a book that has special meaning to you.',
                prompt: 'Illustrate your favorite book cover or a scene from it.',
                categoryId: stillLifeId,
                difficulty: 'beginner',
                type: 'daily',
                startDate: new Date(),
                endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                isActive: true,
                imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
                tags: ['books', 'daily', 'personal'],
            },
        }),
        // Weekly challenges
        prisma.challenge.create({
            data: {
                title: 'Weekly Challenge: Fantasy Landscape',
                description: 'Create a magical fantasy landscape with floating islands and mystical creatures.',
                prompt: 'Design a fantasy landscape with floating islands, waterfalls, and magical elements.',
                categoryId: fantasyId,
                difficulty: 'intermediate',
                type: 'weekly',
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                isActive: true,
                imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
                tags: ['fantasy', 'landscape', 'creative'],
            },
        }),
        prisma.challenge.create({
            data: {
                title: 'Weekly Challenge: Character Design',
                description: 'Design an original character with unique personality and style.',
                prompt: 'Create a character with distinctive features, clothing, and personality traits.',
                categoryId: fantasyId,
                difficulty: 'intermediate',
                type: 'weekly',
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                isActive: true,
                imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
                tags: ['character', 'design', 'creative'],
            },
        }),
        // Monthly challenges
        prisma.challenge.create({
            data: {
                title: 'Monthly Masterpiece: Portrait',
                description: 'Challenge yourself with a detailed portrait drawing.',
                prompt: 'Create a detailed portrait of a person with expressive features and emotions.',
                categoryId: portraitId,
                difficulty: 'advanced',
                type: 'monthly',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                isActive: true,
                imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
                tags: ['portrait', 'advanced', 'detailed'],
            },
        }),
        prisma.challenge.create({
            data: {
                title: 'Monthly Masterpiece: Abstract Composition',
                description: 'Create an abstract composition using shapes, colors, and textures.',
                prompt: 'Design an abstract artwork that conveys emotion through color and form.',
                categoryId: abstractId,
                difficulty: 'advanced',
                type: 'monthly',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isActive: true,
                imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
                tags: ['abstract', 'advanced', 'composition'],
            },
        }),
        // Additional challenges
        prisma.challenge.create({
            data: {
                title: 'Nature Study: Tree Bark',
                description: 'Study the intricate textures and patterns of tree bark.',
                prompt: 'Draw the detailed texture and patterns of tree bark up close.',
                categoryId: landscapeId,
                difficulty: 'intermediate',
                type: 'weekly',
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                isActive: true,
                imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
                tags: ['nature', 'texture', 'study'],
            },
        }),
        prisma.challenge.create({
            data: {
                title: 'Emotion Through Color',
                description: 'Express emotions using only colors and abstract shapes.',
                prompt: 'Create an artwork that represents a specific emotion using color psychology.',
                categoryId: abstractId,
                difficulty: 'intermediate',
                type: 'weekly',
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                isActive: true,
                imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
                tags: ['emotion', 'color', 'abstract'],
            },
        }),
    ]);
    console.log('✅ Created challenges:', challenges.map(c => c.title));
    console.log('🎉 Seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
