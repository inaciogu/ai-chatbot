import axios, { AxiosError, AxiosInstance } from 'axios'

type AxiosClientProps = {
  baseUrl: string
  headers?: Record<string, string>
}

type RequestInput = {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, any>
  headers?: Record<string, string>
}

type RequestOutput<T> = {
  data: T
}

export class AxiosClient {
  private readonly instance: AxiosInstance

  constructor(options: AxiosClientProps) {
    this.instance = axios.create({
      baseURL: options.baseUrl,
      headers: options.headers,
    })
  }

  public async request<T = any>({
    url,
    method,
    data,
    headers,
  }: RequestInput): Promise<RequestOutput<T>> {
    try {
      const response = await this.instance.request<T>({
        url,
        method,
        data,
        headers,
      })

      return { data: response.data }
    } catch (error: any) {
      console.error('Error:', error.response?.data)
      throw error
    }
  }
}
