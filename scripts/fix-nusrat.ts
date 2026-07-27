import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const femaleIds = ['1544005313-94ddf0286df2', '1494790108377-be9c29b29330', '1534528741775-53994a69daeb', '1531746020798-e6953c6e8e04', '1524504388266-3d237b67bcf7', '1529626455594-4ff0802cfb7e', '1502823403499-6ccfcf4fb453', '1552374196-c4e7ffc6e126', '1438761681033-6461ffad8d80'];
  const avatarUrl = `https://images.unsplash.com/photo-${femaleIds[1]}?auto=format&fit=crop&q=80&w=256&h=256`;
  
  const user = await db.user.findFirst({
    where: { handle: 'nusratbuilds' } // Usually this is her handle based on 'nusrat jana'
  });

  if (user) {
    await db.user.update({
      where: { id: user.id },
      data: { avatarUrl }
    });
    console.log(`Updated Nusrat's avatar (ID: ${user.id})`);
  } else {
    // Search by name
    const nusrat = await db.user.findFirst({
      where: { name: { contains: 'Nusrat', mode: 'insensitive' } }
    });
    
    if (nusrat) {
      await db.user.update({
        where: { id: nusrat.id },
        data: { avatarUrl }
      });
      console.log(`Updated Nusrat's avatar (ID: ${nusrat.id}, handle: ${nusrat.handle})`);
    } else {
      console.log("Could not find Nusrat in the DB.");
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
