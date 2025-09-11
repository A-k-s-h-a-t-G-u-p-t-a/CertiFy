import { PrismaClient } from '../generated/prisma';

let prisma;

if (typeof window === 'undefined') {
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: ['query'],
      });
    }
    prisma = global.prisma;
  }
}

export { prisma };
