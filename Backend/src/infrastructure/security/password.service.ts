import bcrypt from "bcrypt";
import { env } from "../../config/env";

class PasswordService {
    async hash(plainText: string): Promise<string> {
        return bcrypt.hash(plainText, env.BCRYPT_ROUNDS);
    }

    async compare(plainText: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plainText, hash);
    }
}

export const paswswordService = new PasswordService();