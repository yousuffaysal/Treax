import { PrismaClient, Role, AccessLevel, PostTag } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const db = new PrismaClient();

const PASSWORD = process.env.SEED_PASSWORD || 'treax1234';

const LOCAL_MALE_AVATARS = [
  '/seed/profiles/male_profile_1.png',
  '/seed/profiles/male_profile_2.png',
];

async function seedExtended() {
  console.log('Seeding extended mock data...');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const newUsers = [];
  
  // 1. Create 30 Users (15 male, 15 female)
  for (let i = 0; i < 30; i++) {
    const isMale = i % 2 === 0;
    const gender = isMale ? 'male' : 'female';
    const firstName = faker.person.firstName(gender);
    const lastName = faker.person.lastName(gender);
    const name = `${firstName} ${lastName}`;
    const handle = faker.internet.username({ firstName, lastName }).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 15) + i;
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    
    let avatarUrl = null;
    if (isMale && i/2 < LOCAL_MALE_AVATARS.length) {
      avatarUrl = LOCAL_MALE_AVATARS[i/2];
    } else {
      // Unsplash placeholders using real face image ids to guarantee faces
      const maleIds = ['1506794778202-cad84cf45f1d', '1500648225252-a3ebdb461a29', '1543610892871-f4cd5e4de4c5', '1472099645785-5658abf4ff4e', '1507003211169-0a1dd7228f2d', '1527980965255-d3b416303d12', '1504257432389-523431e1564e', '1519085360753-af0119f7cbe7', '1511367461989-f85a21fda167'];
      const femaleIds = ['1544005313-94ddf0286df2', '1494790108377-be9c29b29330', '1534528741775-53994a69daeb', '1531746020798-e6953c6e8e04', '1524504388266-3d237b67bcf7', '1529626455594-4ff0802cfb7e', '1502823403499-6ccfcf4fb453', '1552374196-c4e7ffc6e126', '1438761681033-6461ffad8d80'];
      
      const ids = isMale ? maleIds : femaleIds;
      const id = ids[Math.floor(i/2) % ids.length];
      avatarUrl = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=256&h=256`;
    }

    const user = await db.user.upsert({
      where: { email },
      create: {
        email,
        name,
        handle,
        passwordHash,
        role: Role.BUILDER,
        initials: `${firstName[0]}${lastName[0]}`,
        avatarColor: faker.color.rgb(),
        avatarUrl,
        bio: faker.person.bio().slice(0, 200),
        university: faker.helpers.arrayElement(['Dhaka University', 'BUET', 'BRAC University', 'NSU', 'UIU', 'AIUB']),
        focus: faker.helpers.arrayElement(['Software Engineer', 'Product Designer', 'Marketing', 'Startup Founder']),
        tags: faker.helpers.arrayElements(['AI', 'Web3', 'SaaS', 'EdTech', 'FinTech', 'Design'], 2),
        onboardingDone: true,
        verified: faker.datatype.boolean(),
        streak: faker.number.int({ min: 0, max: 50 }),
      },
      update: {}
    });
    newUsers.push(user);
    console.log(`Created user: ${name} (@${handle})`);
  }

  // 2. Create Posts
  console.log('Creating posts...');
  const tags = Object.values(PostTag);
  const postImages = [
    '1498050108023-c5249f4df085',
    '1517694712202-14dd9538aa97',
    '1522542550221-31fd19575a2d',
    '1481481312836-43b8782ee4ea',
    '1505373877841-8d25f7d46678',
    '1451187580459-43490279c0fa',
    '1460925895917-afdab827c52f'
  ];

  for (const user of newUsers) {
    const postCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < postCount; i++) {
      const hasImage = faker.datatype.boolean();
      let imageUrl = null;
      if (hasImage) {
         const id = faker.helpers.arrayElement(postImages);
         imageUrl = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=800&h=600`;
      }
      
      await db.post.create({
        data: {
          authorId: user.id,
          body: faker.lorem.paragraph(),
          tag: faker.helpers.arrayElement(tags),
          imageUrl,
          createdAt: faker.date.recent({ days: 30 }),
        }
      });
    }
  }

  // 3. Create Services (for 5 users)
  console.log('Creating services...');
  const expertUsers = faker.helpers.arrayElements(newUsers, 5);
  for (const user of expertUsers) {
    await db.service.create({
      data: {
        ownerId: user.id,
        title: faker.company.catchPhrase(),
        description: faker.lorem.paragraphs(2),
        price: `৳${faker.number.int({ min: 500, max: 5000 })}`,
        category: faker.commerce.department(),
        rating: faker.number.float({ min: 4, max: 5, fractionDigits: 1 }),
        active: true,
      }
    });
  }

  // 4. Create Blog Posts (for 5 users)
  console.log('Creating blog posts...');
  const bloggerUsers = faker.helpers.arrayElements(newUsers, 5);
  for (const user of bloggerUsers) {
    await db.blogPost.create({
      data: {
        ownerId: user.id,
        title: faker.lorem.sentence(),
        excerpt: faker.lorem.sentences(2),
        body: faker.lorem.paragraphs(5),
        readTime: `${faker.number.int({ min: 2, max: 10 })} min read`,
        createdAt: faker.date.recent({ days: 60 }),
      }
    });
  }

  // 5. Create Conversations & Messages
  console.log('Creating messages...');
  for (let i = 0; i < 15; i++) {
    const [u1, u2] = faker.helpers.arrayElements(newUsers, 2);
    if (u1.id === u2.id) continue;

    // Create conversation
    const conv = await db.conversation.create({
      data: {
        members: {
          create: [
            { userId: u1.id },
            { userId: u2.id }
          ]
        }
      }
    });

    const msgCount = faker.number.int({ min: 5, max: 15 });
    for (let m = 0; m < msgCount; m++) {
      const sender = faker.datatype.boolean() ? u1 : u2;
      await db.message.create({
        data: {
          conversationId: conv.id,
          senderId: sender.id,
          body: faker.lorem.sentences({ min: 1, max: 3 }),
          createdAt: faker.date.recent({ days: 10 }),
        }
      });
    }
  }

  console.log('Seed completed successfully!');
}

seedExtended()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
