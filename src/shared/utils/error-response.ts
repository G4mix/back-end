/**
 * Interface para respostas de erro padronizadas
 */
export interface ErrorResponse {
	message: string
	code: number
}

/**
 * Tipos de erro comuns para facilitar o uso
 * Reutiliza as constantes já definidas em messages
 * Cada erro já retorna automaticamente no formato { message: 'ERROR_CODE' }
 */
export const CommonErrors: Record<string, ErrorResponse> = {
	// Autenticação e Autorização
	get UNAUTHORIZED() { return { message: 'UNAUTHORIZED', code: 401 } },
	get TOKEN_NOT_FOUND() { return { message: 'TOKEN_NOT_FOUND', code: 401 } },
	get INVALID_TOKEN() { return { message: 'INVALID_TOKEN', code: 400 } },
	get EMAIL_NOT_VERIFIED() { return { message: 'EMAIL_NOT_VERIFIED', code: 403 } },
	get EXCESSIVE_LOGIN_ATTEMPTS() { return { message: 'EXCESSIVE_LOGIN_ATTEMPTS', code: 429 } },
	get YOU_ARE_NOT_THE_AUTHOR() { return { message: 'YOU_ARE_NOT_THE_AUTHOR', code: 403 } },

	// Usuários
	get USER_NOT_FOUND() { return { message: 'USER_NOT_FOUND', code: 404 } },
	get USER_ALREADY_EXISTS() { return { message: 'USER_ALREADY_EXISTS', code: 409 } },
	get INVALID_USER_ID() { return { message: 'INVALID_USER_ID', code: 400 } },
	get INVALID_NAME() { return { message: 'INVALID_NAME', code: 400 } },

	// Senhas
	get INVALID_PASSWORD() { return { message: 'INVALID_PASSWORD', code: 400 } },
	get PASSWORD_REQUIRED() { return { message: 'PASSWORD_REQUIRED', code: 400 } },
	get WRONG_PASSWORD_ONCE() { return { message: 'WRONG_PASSWORD_ONCE', code: 400 } },
	get WRONG_PASSWORD_TWICE() { return { message: 'WRONG_PASSWORD_TWICE', code: 400 } },
	get WRONG_PASSWORD_THREE_TIMES() { return { message: 'WRONG_PASSWORD_THREE_TIMES', code: 400 } },
	get WRONG_PASSWORD_FOUR_TIMES() { return { message: 'WRONG_PASSWORD_FOUR_TIMES', code: 400 } },
	get WRONG_PASSWORD_FIVE_TIMES() { return { message: 'WRONG_PASSWORD_FIVE_TIMES', code: 400 } },

	// Email
	get INVALID_EMAIL() { return { message: 'INVALID_EMAIL', code: 400 } },
	get ERROR_WHILE_CHECKING_EMAIL() { return { message: 'ERROR_WHILE_CHECKING_EMAIL', code: 500 } },
	get ERROR_WHILE_SENDING_EMAIL() { return { message: 'ERROR_WHILE_SENDING_EMAIL', code: 500 } },
	get ERROR_WHILE_VERIFYING_EMAIL() { return { message: 'ERROR_WHILE_VERIFYING_EMAIL', code: 500 } },
	get ERROR_WHILE_CHECKING_EMAIL_STATUS() { return { message: 'ERROR_WHILE_CHECKING_EMAIL_STATUS', code: 500 } },

	// Ideias
	get IDEA_NOT_FOUND() { return { message: 'NOT_FOUNDED_DATA', code: 404 } },
	get INVALID_IDEA_ID() { return { message: 'INVALID_IDEA_ID', code: 400 } },
	get IDEAS_REQUIRED() { return { message: 'IDEAS_REQUIRED', code: 400 } },
	get TOO_MANY_IDEAS() { return { message: 'TOO_MANY_IDEAS', code: 400 } },
	get IDEA_OR_COMMENT_REQUIRED() { return { message: 'IDEA_OR_COMMENT_REQUIRED', code: 400 } },

	// Comentários
	get COMMENT_NOT_FOUND() { return { message: 'NOT_FOUNDED_DATA', code: 404 } },
	get INVALID_COMMENT_ID() { return { message: 'INVALID_COMMENT_ID', code: 400 } },
	get INVALID_PARENT_COMMENT_ID() { return { message: 'INVALID_PARENT_COMMENT_ID', code: 400 } },

	// Conteúdo e Validação
	get INVALID_CONTENT() { return { message: 'INVALID_CONTENT', code: 400 } },
	get CONTENT_REQUIRED() { return { message: 'CONTENT_REQUIRED', code: 400 } },
	get CONTENT_TOO_LONG() { return { message: 'CONTENT_TOO_LONG', code: 400 } },
	get COMPLETELY_EMPTY_POST() { return { message: 'COMPLETELY_EMPTY_POST', code: 400 } },

	// Títulos
	get INVALID_TITLE() { return { message: 'INVALID_TITLE', code: 400 } },
	get TITLE_TOO_SHORT() { return { message: 'TITLE_TOO_SHORT', code: 400 } },
	get TITLE_TOO_LONG() { return { message: 'TITLE_TOO_LONG', code: 400 } },

	// Descrições
	get DESCRIPTION_TOO_SHORT() { return { message: 'DESCRIPTION_TOO_SHORT', code: 400 } },
	get DESCRIPTION_TOO_LONG() { return { message: 'DESCRIPTION_TOO_LONG', code: 400 } },

	// Tags
	get INVALID_TAGS() { return { message: 'INVALID_TAGS', code: 400 } },
	get TOO_MANY_TAGS() { return { message: 'TOO_MANY_TAGS', code: 400 } },
	get TAG_EMPTY() { return { message: 'TAG_EMPTY', code: 400 } },
	get TAG_TOO_LONG() { return { message: 'TAG_TOO_LONG', code: 400 } },

	// Links
	get INVALID_LINKS() { return { message: 'INVALID_LINKS', code: 400 } },
	get TOO_MANY_LINKS() { return { message: 'TOO_MANY_LINKS', code: 400 } },
	get INVALID_LINK_URL() { return { message: 'INVALID_LINK_URL', code: 400 } },
	get LINK_URL_TOO_LONG() { return { message: 'LINK_URL_TOO_LONG', code: 400 } },
	get INVALID_URL() { return { message: 'INVALID_URL', code: 400 } },
	get URL_TOO_LONG() { return { message: 'URL_TOO_LONG', code: 400 } },
	get URL_MUST_START_WITH_HTTP() { return { message: 'URL_MUST_START_WITH_HTTP', code: 400 } },

	// Imagens
	get INVALID_IMAGE_FORMAT() { return { message: 'INVALID_IMAGE_FORMAT', code: 400 } },
	get TOO_MANY_IMAGES() { return { message: 'TOO_MANY_IMAGES', code: 400 } },
	get INVALID_IMAGE_URL() { return { message: 'INVALID_IMAGE_URL', code: 400 } },
	get IMAGE_URL_TOO_LONG() { return { message: 'IMAGE_URL_TOO_LONG', code: 400 } },
	get ALT_TEXT_REQUIRED() { return { message: 'ALT_TEXT_REQUIRED', code: 400 } },
	get ALT_TEXT_TOO_LONG() { return { message: 'ALT_TEXT_TOO_LONG', code: 400 } },
	get PICTURE_UPDATE_FAIL() { return { message: 'PICTURE_UPDATE_FAIL', code: 400 } },
	get EXCEEDED_MAX_SIZE() { return { message: 'EXCEEDED_MAX_SIZE', code: 400 } },

	// Dimensões
	get INVALID_WIDTH() { return { message: 'INVALID_WIDTH', code: 400 } },
	get WIDTH_TOO_LARGE() { return { message: 'WIDTH_TOO_LARGE', code: 400 } },
	get INVALID_HEIGHT() { return { message: 'INVALID_HEIGHT', code: 400 } },
	get HEIGHT_TOO_LARGE() { return { message: 'HEIGHT_TOO_LARGE', code: 400 } },

	// Paginação
	get INVALID_PAGE() { return { message: 'INVALID_PAGE', code: 400 } },
	get INVALID_LIMIT() { return { message: 'INVALID_LIMIT', code: 400 } },
	get LIMIT_TOO_LARGE() { return { message: 'LIMIT_TOO_LARGE', code: 400 } },

	// Outros recursos
	get PROVIDER_NOT_FOUND() { return { message: 'PROVIDER_NOT_FOUND', code: 404 } },
	get NOT_FOUNDED_DATA() { return { message: 'NOT_FOUNDED_DATA', code: 404 } },

	// Follow/Unfollow
	get CANNOT_FOLLOW_SELF() { return { message: 'CANNOT_FOLLOW_SELF', code: 400 } },
	get FOLLOW_NOT_FOUND() { return { message: 'FOLLOW_NOT_FOUND', code: 404 } },

	// Códigos de verificação
	get CODE_EXPIRED() { return { message: 'CODE_EXPIRED', code: 400 } },
	get CODE_NOT_EQUALS() { return { message: 'CODE_NOT_EQUALS', code: 400 } },

	// Aliases para compatibilidade
	get FORBIDDEN() { return { message: 'YOU_ARE_NOT_THE_AUTHOR', code: 403 } },
	get DATABASE_ERROR() { return { message: 'ERROR_WHILE_CHECKING_EMAIL', code: 500 } },
	get VALIDATION_ERROR() { return { message: 'INVALID_CONTENT', code: 400 } },
	get INTERNAL_ERROR() { return { message: 'ERROR_WHILE_SENDING_EMAIL', code: 500 } }
}
