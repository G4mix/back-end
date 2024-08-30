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
    verified: boolean;
    loginAttempts: number;
    blockedUntil: Date;
}>