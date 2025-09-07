import { injectable, singleton } from 'tsyringe'
import { Logger } from './logger'

export interface RouteInfo {
	method: string
	path: string
	controller: string
	action: string
	tags?: string[]
	security?: string[]
}

@injectable()
@singleton()
export class RouteLister {
	constructor(private logger: Logger) {}

	public listRoutes(routes: RouteInfo[]): void {
		this.logger.info('=== REGISTERED ROUTES ===')
		
		// Agrupar rotas por tag
		const routesByTag = routes.reduce((acc, route) => {
			const tag = route.tags?.[0] || 'Other'
			if (!acc[tag]) acc[tag] = []
			acc[tag].push(route)
			return acc
		}, {} as Record<string, RouteInfo[]>)

		// Listar rotas agrupadas por tag
		Object.entries(routesByTag).forEach(([tag, tagRoutes]) => {
			this.logger.info(`\n📁 ${tag.toUpperCase()}`)
			tagRoutes.forEach(route => {
				const method = route.method.padEnd(6)
				const security = route.security?.length ? ' [🔒]' : ''
				this.logger.info(`  ${method} ${route.path}${security}`)
			})
		})

		this.logger.info(`\n📊 Total: ${routes.length} routes registered`)
		this.logger.info('========================')
	}

	public getRouteSummary(routes: RouteInfo[]): {
		total: number
		byMethod: Record<string, number>
		byTag: Record<string, number>
		secured: number
	} {
		const byMethod = routes.reduce((acc, route) => {
			acc[route.method] = (acc[route.method] || 0) + 1
			return acc
		}, {} as Record<string, number>)

		const byTag = routes.reduce((acc, route) => {
			const tag = route.tags?.[0] || 'Other'
			acc[tag] = (acc[tag] || 0) + 1
			return acc
		}, {} as Record<string, number>)

		const secured = routes.filter(route => route.security?.length).length

		return {
			total: routes.length,
			byMethod,
			byTag,
			secured
		}
	}
}
