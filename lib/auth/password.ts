import bcryptjs from 'bcryptjs'

const BCRYPT_ROUNDS = 12

export async function hashPassword(plainPassword: string): Promise<string> {
  return await bcryptjs.hash(plainPassword, BCRYPT_ROUNDS)
}

export async function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return await bcryptjs.compare(plainPassword, passwordHash)
}