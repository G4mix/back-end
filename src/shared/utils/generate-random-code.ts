export const generateRandomCode = (length: number = 6) => {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
	let result = ''

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length)
		result += characters[randomIndex]
	}

	return result
}