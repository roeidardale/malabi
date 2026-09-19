import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const email = (await rl.question("Admin email: ")).trim();
    const name = (await rl.question("Admin name: ")).trim();
    const password = (await rl.question("Admin password (min 8 chars): ")).trim();

    if (!email || !name || password.length < 8) {
      console.error("Invalid input: email/name required, password must be >= 8 characters.");
      process.exitCode = 1;
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.adminUser.upsert({
      where: { email },
      update: { name, passwordHash },
      create: { email, name, passwordHash },
    });

    console.log(`Admin user ready: ${admin.email} (${admin.id})`);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
