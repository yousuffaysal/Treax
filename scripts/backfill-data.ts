import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Backfilling user avatars...');
  
  // Find users without an avatarUrl
  const users = await db.user.findMany({
    where: { avatarUrl: null }
  });

  console.log(`Found ${users.length} users without avatars.`);

  const maleIds = ['1506794778202-cad84cf45f1d', '1500648225252-a3ebdb461a29', '1543610892871-f4cd5e4de4c5', '1472099645785-5658abf4ff4e', '1507003211169-0a1dd7228f2d', '1527980965255-d3b416303d12', '1504257432389-523431e1564e', '1519085360753-af0119f7cbe7', '1511367461989-f85a21fda167'];
  const femaleIds = ['1544005313-94ddf0286df2', '1494790108377-be9c29b29330', '1534528741775-53994a69daeb', '1531746020798-e6953c6e8e04', '1524504388266-3d237b67bcf7', '1529626455594-4ff0802cfb7e', '1502823403499-6ccfcf4fb453', '1552374196-c4e7ffc6e126', '1438761681033-6461ffad8d80'];
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const isMale = i % 2 === 0;
    const ids = isMale ? maleIds : femaleIds;
    const id = ids[i % ids.length];
    
    // Some users might get the locally generated images we used before
    let avatarUrl = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=256&h=256`;
    
    await db.user.update({
      where: { id: user.id },
      data: { avatarUrl }
    });
  }

  console.log('Avatars backfilled successfully.');

  console.log('Updating Billboard poster...');
  
  // The Billboard uses the ID "singleton" based on the schema
  await db.billboard.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      imageUrl: '/assets/glowing-contact-bg.png',
      headline: 'Contact us for premium placement',
      cta: 'Learn more'
    },
    update: {
      imageUrl: '/assets/glowing-contact-bg.png'
    }
  });

  console.log('Billboard updated successfully!');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
