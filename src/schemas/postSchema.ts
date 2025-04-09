import { z } from 'zod'

export const postSchema = z.object({
	title: z.undefined().or(z.string().regex(/^[^{}]{3,70}$/, 'INVALID_TITLE')),
	content: z.undefined().or(z.string().regex(/^[^{}]{3,700}$/, 'INVALID_CONTENT')),
	links: z
		.union([
			z.undefined(),
			z
				.string()
				.transform((val) => {
					try {
						return JSON.parse(val)
					} catch {
						return []
					}
				})
				.pipe(z.array(z.string().url()).max(5, 'TOO_MANY_LINKS')),
		]),
	tags: z
		.union([
			z.undefined(),
			z
				.string()
				.transform((val) => {
					try {
						return JSON.parse(val)
					} catch {
						return []
					}
				})
				.pipe(z.array(z.string()).max(10, 'TOO_MANY_TAGS')),
		]),
	images: z
		.union([
			z.undefined(),
			z
				.string()
				.transform((val) => {
					try {
						return JSON.parse(val)
					} catch {
						return []
					}
				})
				.pipe(z.array(z.string().url()).max(8, 'TOO_MANY_IMAGES')),
		])
})