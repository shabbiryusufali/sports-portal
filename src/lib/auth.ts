import { User } from "@prisma/client";
import { prisma } from "./db";
import { saltAndHashPassword } from "@/utils/password";

async function createUserWithCredentials(credentials: {
  email: string;
  password: string;
  name?: string;
}): Promise<User> {
  const pwHash = saltAndHashPassword(credentials.password);
  let user = prisma.user.create({
    data: {
      name: credentials.name,
      email: credentials.email,
      password_hash: pwHash,
      username:
        credentials.name?.replaceAll(" ", "") ||
        credentials.email.split("@")[0],
    },
  });

  return user;
}

export { createUserWithCredentials };
