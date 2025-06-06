export type ApiMessage = keyof typeof messages
export const messages = {
	INVALID_TOKEN: 400,
	WRONG_PASSWORD_ONCE: 400,
	WRONG_PASSWORD_TWICE: 400,
	WRONG_PASSWORD_THREE_TIMES: 400,
	WRONG_PASSWORD_FOUR_TIMES: 400,
	WRONG_PASSWORD_FIVE_TIMES: 400,
	INVALID_NAME: 400,
	INVALID_EMAIL: 400,
	INVALID_PASSWORD: 400,
	INVALID_CONTENT: 400,
	INVALID_TITLE: 400,
	INVALID_IMAGE_FORMAT: 400,
	PICTURE_UPDATE_FAIL: 400,
	EXCEEDED_MAX_SIZE: 400,
	COMPLETELY_EMPTY_POST: 400,
	TOO_MANY_LINKS: 400,
	TOO_MANY_TAGS: 400,
	TOO_MANY_IMAGES: 400,
	INVALID_LINKS: 400,
	INVALID_TAGS: 400,
	YOU_ARE_NOT_THE_AUTHOR: 400,
	EXCESSIVE_LOGIN_ATTEMPTS: 400,
	TOKEN_NOT_FOUND: 401,
	UNAUTHORIZED: 401,
	EMAIL_NOT_VERIFIED: 403,
	PROVIDER_NOT_FOUND: 404,
	USER_NOT_FOUND: 404,
	NOT_FOUNDED_DATA: 404,
	USER_ALREADY_EXISTS: 409,
	ERROR_WHILE_CHECKING_EMAIL: 500,
	ERROR_WHILE_SENDING_EMAIL: 500
}