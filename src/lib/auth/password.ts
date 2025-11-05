import { hash, verify } from "@node-rs/argon2"

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
}

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, ARGON2_OPTIONS)
}

export async function verifyPassword(
  hashedPassword: string,
  password: string
): Promise<boolean> {
  return await verify(hashedPassword, password, ARGON2_OPTIONS)
}

