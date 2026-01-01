import prisma from "@/lib/db";
import { CurrentUser } from "@/models/user.model";

export const ensureUserExists = async (user: CurrentUser) => {
  if (!user) {
    throw new Error("Not authenticated");
  }
  const email = user.email ?? `${user.id}@local`;
  const name = user.name ?? "User";

  const existingById = await prisma.user.findUnique({ where: { id: user.id } });
  if (existingById) return existingById;

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) return existingByEmail;

  return prisma.user.create({
    data: {
      id: user.id,
      name,
      email,
      password: "placeholder",
    },
  });
};
