import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Bersihkan data board (opsional, hati-hati)
  await prisma.board.deleteMany();

  // Insert data dummy
  await prisma.board.createMany({
    data: [
      {
        id: "board-1",
        title: "Board Pertama",
      },
      {
        id: "board-2",
        title: "Board Kedua",
      },
    ],
  });

  console.log("Seed data berhasil!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
