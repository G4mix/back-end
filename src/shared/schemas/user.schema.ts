import { z } from 'zod'

export const passwordValidation = z.string()
	.regex(
		/^(?=.*\d)(?=.*[A-Z])(?=.*[$*&@#! ])[^{}]{6,}$/,
		'INVALID_PASSWORD'
	)

export const userSignUpSchema = z.object({
	username: z.string().regex(/^[^{}]{3,255}$/, 'INVALID_NAME'),
	email: z.string().email('INVALID_EMAIL'),
	password: passwordValidation,
})

export const createUserSchema = userSignUpSchema

export const signinSchema = z.object({
	email: z.string().email('INVALID_EMAIL'),
	password: z.string().min(1, 'PASSWORD_REQUIRED')
})

export const updateUserSchema = z.object({
	username: z.undefined().or(z.string().regex(/^[^{}]{3,255}$/, 'INVALID_NAME')),
	email: z.undefined().or(z.string().email('INVALID_EMAIL')),
	password: z.undefined().or(passwordValidation)
})

export const userChangePasswordSchema = z.object({
	password: passwordValidation
})