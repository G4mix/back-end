import { IocContainer } from '@tsoa/runtime'
import { container } from 'tsyringe'

export const iocContainer: IocContainer = {
	get: <T>(controller: { prototype: T }): T => {
		try {
			console.log('IoC Container - Resolvendo controller:', (controller as any).name || 'Unknown')
			const resolved = container.resolve<T>(controller as never)
			console.log('IoC Container - Controller resolvido com sucesso:', (controller as any).name || 'Unknown')
			return resolved
		} catch (error) {
			console.error('IoC Container - Erro ao resolver controller:', (controller as any).name || 'Unknown', error)
			throw error
		}
	}
}

export { container }