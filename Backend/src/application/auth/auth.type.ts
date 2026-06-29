export interface RegisterInput{
    phoneNumber: string;
    name: string;
    email?: string;
    password: string;
}

export interface LoginInput {
    phoneNumber: string;
    password: string;
}

export interface RefreshInput {
    refreshToken: string;
    userId?: string;
}

export interface LogoutInput {
    refreshToken: string;
    userId?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResult {
    user: {
        id: string;
        phoneNumber: string;
        name: string;
        email: string | null;
    };
    tokens: AuthTokens;
}
