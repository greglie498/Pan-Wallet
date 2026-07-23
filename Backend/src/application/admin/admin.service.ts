import { Admin } from "@prisma/client";
import { adminRepository } from "../../infrastructure/repositories/admin.repository";
import { paswswordService } from "../../infrastructure/security/password.service";
import { jwtService } from "../../infrastructure/security/jwt.service";
import { UnauthorizedError, NotFoundError } from "../../domain/error";

export interface AdminLoginInput {
    username: string;
    password: string;
}

export interface AdminAuthResult {
    admin: {
        id: string;
        username: string;
        email: string;
        role: string;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

class AdminService {
    async login(input: AdminLoginInput): Promise<AdminAuthResult> {
        const admin = await adminRepository.findByUsername(input.username);

        if (!admin) {
            throw new UnauthorizedError("Invalid username or password");
        }

        const passwordMatch = await paswswordService.compare(
            input.password,
            admin.password
        );

        if (!passwordMatch) {
            throw new UnauthorizedError("Invalid username or password.");
        }

        const accessToken = jwtService.signAccessToken({
            sub: admin.id,
            phone: admin.email,
            role: "ADMIN",
        });

        const refreshToken = jwtService.signRefreshToken({
            sub: admin.id,
            phone: admin.email,
            family: crypto.randomUUID(),
            role: "ADMIN",
        });

        return {
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
            },
            tokens: { accessToken, refreshToken },
        };
    }
}

export const adminService = new AdminService();