 import { Prisma, User } from "@prisma/client";
 import { prisma } from "../database/prisma";


 class UserRepository {
    async create (
        data: Prisma.UserCreateInput,
        tx?: Prisma.TransactionClient
    ): Promise<User> {
        const client = tx ?? prisma;
        return client.user.create({ data });
    }

    async findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { id } });
    }
    
    async findByPhone(phoneNumber: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { phoneNumber } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { email } });
    }
 }

 export const userRepository = new UserRepository();