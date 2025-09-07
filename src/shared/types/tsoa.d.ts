import { type Request } from 'express'
import { Claims } from '@shared/utils'

export interface TsoaRequest extends Request {
	user: Claims;
}

// Tipos para TSOA baseados nos schemas Zod
export interface UpdateUserInput {
	username?: string;
	email?: string;
	password?: string;
	displayName?: string;
	autobiography?: string;
	links?: string[];
	icon?: Express.Multer.File;
	backgroundImage?: Express.Multer.File;
}

export interface CreateUserInput {
	username: string;
	email: string;
	password: string;
}

export interface SigninInput {
	email: string;
	password: string;
}

export interface UpdateUserOutput {
	user: {
		id: string;
		username: string;
		email: string;
		verified: boolean;
		userProfile: {
			id: string;
			displayName: string | null;
			autobiography: string | null;
			icon: string | null;
			backgroundImage: string | null;
			links: Array<{ id: string; url: string }>;
			followingCount: number;
			followersCount: number;
		} | null;
		created_at: string;
		updated_at: string;
	};
}

export interface CreateUserOutput {
	id: string;
	username: string;
	email: string;
	created_at: Date;
}

export interface SigninOutput {
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		username: string;
		email: string;
		verified: boolean;
		userProfile: {
			id: string;
			displayName: string | null;
			autobiography: string | null;
			icon: string | null;
			backgroundImage: string | null;
			links: Array<{ id: string; url: string }>;
			followingCount: number;
			followersCount: number;
		} | null;
		created_at: string;
		updated_at: string;
	};
}