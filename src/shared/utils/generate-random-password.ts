export const generateRandomPassword = (length: number = 256) => {
	// Garante que a senha tenha pelo menos os caracteres obrigatórios
	const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	const digits = '0123456789'
	const special = '$*&@#! '
	
	const additionalChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$*&@#! '
	
	let password = ''
	
	password += uppercase[Math.floor(Math.random() * uppercase.length)]
	password += digits[Math.floor(Math.random() * digits.length)]
	password += special[Math.floor(Math.random() * special.length)]
	
	for (let i = 3; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * additionalChars.length)
		password += additionalChars[randomIndex]
	}
	
	return password.split('').sort(() => Math.random() - 0.5).join('')
}