import crypto from "crypto";
import { prisma } from "@/lib/db";

function saltAndHashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

function getSaltAndHash(password: string): { salt: string; hash: string } {
  const [salt, hash] = password.split(":");
  return { salt, hash };
}

async function verifyPassword(
  email: string,
  password: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    return false;
  }
  const { salt, hash } = getSaltAndHash(user.password_hash);
  const hashToVerify = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");

  return hash === hashToVerify;
}

export { saltAndHashPassword, verifyPassword };
