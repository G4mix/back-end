import { Id } from './general'

export type AuthInput = {
    email: string;
    password: string;
    username: string;
}

export type UpdateInput = Id & Partial<{
    username: string;
    email: string;
    password: string;
    displayName: string;
    autobiography: string;
    verified: boolean;
    loginAttempts: number;
    blockedUntil: Date | null;
    links: string[];
    icon?: Express.Multer.File | string;
    backgroundImage?: Express.Multer.File | string;
    code?: string;
}>