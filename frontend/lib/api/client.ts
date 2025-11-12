import { AppError, ErrorType } from "../utils/error-handler";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface FetchOptions extends RequestInit {
    params?: Record<string, string>;
}

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private async request<T>(
        endpoint: string,
        options: FetchOptions = {}
    ): Promise<T> {
        const { params, ...fetchOptions } = options;

        let url = `${this.baseURL}${endpoint}`;

        // Add query parameters if provided
        if (params) {
            const searchParams = new URLSearchParams(params);
            url += `?${searchParams.toString()}`;
        }

        // Set default headers
        const headers: HeadersInit = {
            "Content-Type": "application/json",
            ...fetchOptions.headers,
        };

        const config: RequestInit = {
            ...fetchOptions,
            headers,
            credentials: "include", // Include cookies for auth
        };

        try {
            const response = await fetch(url, config);

            // Handle non-JSON responses
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                if (!response.ok) {
                    throw new AppError(
                        `HTTP error! status: ${response.status}`,
                        this.getErrorTypeFromStatus(response.status),
                        response.status,
                        undefined,
                        this.isRetryableStatus(response.status)
                    );
                }
                return {} as T;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new AppError(
                    data.message || `HTTP error! status: ${response.status}`,
                    this.getErrorTypeFromStatus(response.status),
                    response.status,
                    data,
                    this.isRetryableStatus(response.status)
                );
            }

            return data;
        } catch (error) {
            // Re-throw AppError instances
            if (error instanceof AppError) {
                throw error;
            }

            // Handle network errors
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new AppError(
                    "Network error. Please check your connection.",
                    ErrorType.NETWORK,
                    undefined,
                    error,
                    true
                );
            }

            // Handle other errors
            if (error instanceof Error) {
                throw new AppError(
                    error.message,
                    ErrorType.UNKNOWN,
                    undefined,
                    error,
                    false
                );
            }

            throw new AppError(
                "An unexpected error occurred",
                ErrorType.UNKNOWN,
                undefined,
                error,
                false
            );
        }
    }

    private getErrorTypeFromStatus(status: number): ErrorType {
        if (status === 400) return ErrorType.VALIDATION;
        if (status === 401) return ErrorType.AUTHENTICATION;
        if (status === 403) return ErrorType.AUTHORIZATION;
        if (status === 404) return ErrorType.NOT_FOUND;
        if (status >= 500) return ErrorType.SERVER;
        return ErrorType.UNKNOWN;
    }

    private isRetryableStatus(status: number): boolean {
        return status >= 500 || status === 408 || status === 429;
    }

    async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: "GET" });
    }

    async post<T>(
        endpoint: string,
        body?: unknown,
        options?: FetchOptions
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async patch<T>(
        endpoint: string,
        body?: unknown,
        options?: FetchOptions
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: "PATCH",
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: "DELETE" });
    }

    async uploadFile<T>(
        endpoint: string,
        file: File,
        fieldName: string = "file"
    ): Promise<T> {
        const formData = new FormData();
        formData.append(fieldName, file);

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: "POST",
            body: formData,
            credentials: "include",
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
