const prisma = require("./dist/shared/database/prisma").default;

async function check() {
  try {
    const users = await prisma.usuario.findMany({
      where: {
        email: {
          contains: "testuser_17721050",
        },
      },
      select: {
        id: true,
        email: true,
        senhaHash: true,
        emailVerified: true,
      },
      take: 5,
    });

    console.log("Usuários encontrados:");
    users.forEach((u) => {
      console.log(`ID: ${u.id}`);
      console.log(`Email: ${u.email}`);
      console.log(
        `SenhaHash: ${u.senhaHash ? "SIM (comprimento: " + u.senhaHash.length + ")" : "NÃO"}`,
      );
      console.log(`EmailVerified: ${u.emailVerified}`);
      console.log("---");
    });
  } catch (error) {
    console.error("Erro:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
