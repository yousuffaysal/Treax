import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  // Get some existing posts
  const posts = await db.post.findMany({ take: 10 });
  
  if (posts.length === 0) {
    console.log("No posts found to update.");
    return;
  }

  // Update a few of them with the new background image
  const postsToUpdate = posts.slice(0, 3);
  
  for (const post of postsToUpdate) {
    await db.post.update({
      where: { id: post.id },
      data: { imageUrl: '/assets/glowing-contact-bg.png' }
    });
    console.log(`Updated post ${post.id} with glowing background image.`);
  }

  console.log("Successfully updated posts!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
