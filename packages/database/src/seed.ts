import { prisma } from "./index";

async function seed() {
  console.log("Seeding database...");

  const admin = await prisma.user.upsert({
    where: { email: "admin@openverify.dev" },
    update: {},
    create: {
      email: "admin@openverify.dev",
      username: "admin",
      displayName: "Administrator",
      role: "ADMIN",
      isVerified: true,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@openverify.dev" },
    update: {},
    create: {
      email: "demo@openverify.dev",
      username: "demo_user",
      displayName: "Demo User",
      role: "USER",
      isVerified: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "LOGIN",
      userId: admin.id,
      details: "Initial setup",
    },
  });

  console.log("Seed complete!");
  console.log(`  Admin user: ${admin.email}`);
  console.log(`  Demo user: ${demoUser.email}`);
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
