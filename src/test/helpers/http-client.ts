import axios, { AxiosInstance, AxiosResponse } from 'axios'

export class HttpClient {
	private client: AxiosInstance
	private baseUrl: string
	private authToken: string | null = null

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl
		this.client = axios.create({
			baseURL: baseUrl,
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json'
			}
		})

		// Interceptor para adicionar token de autenticação automaticamente
		this.client.interceptors.request.use((config) => {
			if (this.authToken) {
				config.headers.Authorization = `Bearer ${this.authToken}`
			}
			return config
		})

		// Interceptor para log de requests
		this.client.interceptors.request.use((config) => {
			console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`)
			return config
		})

		// Interceptor para log de responses
		this.client.interceptors.response.use(
			(response) => {
				console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
				return response
			},
			(error) => {
				console.log(`❌ ${error.response?.status || 'ERROR'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
				// Se for um erro de conexão, retorna um erro mais específico
				if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
					const connectionError = new Error('Connection refused')
					connectionError.name = 'ConnectionError'
					return Promise.reject(connectionError)
				}
				return Promise.reject(error)
			}
		)
	}

	/**
	 * Define o token de autenticação
	 */
	setAuthToken(token: string): void {
		this.authToken = token
	}

	/**
	 * Remove o token de autenticação
	 */
	clearAuthToken(): void {
		this.authToken = null
	}

	/**
	 * Faz uma requisição GET
	 */
	async get<T = any>(url: string, params?: any): Promise<AxiosResponse<T>> {
		return this.client.get(url, { params })
	}

	/**
	 * Faz uma requisição POST
	 */
	async post<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
		return this.client.post(url, data)
	}

	/**
	 * Faz uma requisição PUT
	 */
	async put<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
		return this.client.put(url, data)
	}

	/**
	 * Faz uma requisição PATCH
	 */
	async patch<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
		return this.client.patch(url, data)
	}

	/**
	 * Faz uma requisição DELETE
	 */
	async delete<T = any>(url: string): Promise<AxiosResponse<T>> {
		return this.client.delete(url)
	}

	/**
	 * Faz upload de arquivo
	 */
	async uploadFile<T = any>(url: string, file: any, additionalData?: any): Promise<AxiosResponse<T>> {
		const formData = new FormData()
		formData.append('file', file)
		
		if (additionalData) {
			Object.keys(additionalData).forEach(key => {
				formData.append(key, additionalData[key])
			})
		}

		return this.client.post(url, formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		})
	}

	/**
	 * Obtém a URL base
	 */
	getBaseUrl(): string {
		return this.baseUrl
	}
}
