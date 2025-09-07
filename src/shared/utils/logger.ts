import { injectable, singleton } from 'tsyringe'

export enum LogLevel {
	ERROR = 'error',
	WARN = 'warn',
	INFO = 'info',
	DEBUG = 'debug'
}

@injectable()
@singleton()
export class Logger {
	private getTimestamp(): string {
		return new Date().toISOString()
	}

	private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
		const timestamp = this.getTimestamp()
		const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : ''
		return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`
	}

	public error(message: string, error?: unknown): void {
		const formattedMessage = this.formatMessage(LogLevel.ERROR, message, error)
		console.error(formattedMessage)
	}

	public warn(message: string, ...args: unknown[]): void {
		const formattedMessage = this.formatMessage(LogLevel.WARN, message, ...args)
		console.warn(formattedMessage)
	}

	public info(message: string, ...args: unknown[]): void {
		const formattedMessage = this.formatMessage(LogLevel.INFO, message, ...args)
		console.info(formattedMessage)
	}

	public debug(message: string, ...args: unknown[]): void {
		const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, ...args)
		console.debug(formattedMessage)
	}

	public log(message: string, ...args: unknown[]): void {
		this.info(message, ...args)
	}
}
