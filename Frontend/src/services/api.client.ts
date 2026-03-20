/**
 * API Client with automatic token refresh
 *
 * This module provides a fetch wrapper that:
 * 1. Automatically adds authorization headers
 * 2. Intercepts 401 responses
 * 3. Refreshes tokens automatically
 * 4. Retries failed requests with new tokens
 * 5. Prevents infinite refresh loops
 */

const apiBase = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000';

// Token storage keys
const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Queue of failed requests to retry after refresh
let failedRequestsQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

// ── Token Management ────────────────────────────────────

export const getAccessToken = (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string, expiresIn?: number): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    if (expiresIn) {
        const expiry = Date.now() + expiresIn * 1000;
        localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
    }
};

export const clearTokens = (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

export const isTokenExpired = (): boolean => {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return false;

    // Add 60 second buffer to refresh before actual expiry
    return Date.now() > parseInt(expiry) - 60000;
};

// ── Token Refresh ───────────────────────────────────────

const refreshTokens = async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await fetch(`${apiBase}/api/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));

            // If refresh token is also expired, user must login again
            if (response.status === 401) {
                clearTokens();
                throw new Error(error.code === 'REFRESH_TOKEN_EXPIRED'
                    ? 'Session expired. Please login again.'
                    : 'Authentication failed');
            }

            throw new Error(error.error || 'Failed to refresh token');
        }

        const data = await response.json();

        // Store new tokens
        setTokens(
            data.access_token || data.token,
            data.refresh_token,
            data.expires_in
        );

        return data.access_token || data.token;
    } catch (error) {
        clearTokens();
        throw error;
    }
};

const handleTokenRefresh = async (): Promise<string | null> => {
    // If already refreshing, wait for that request
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;

    refreshPromise = refreshTokens()
        .then((newToken) => {
            // Process queued requests
            failedRequestsQueue.forEach((req) => {
                if (newToken) {
                    req.resolve(newToken);
                } else {
                    req.reject(new Error('Failed to refresh token'));
                }
            });
            failedRequestsQueue = [];
            return newToken;
        })
        .catch((error) => {
            // Reject all queued requests
            failedRequestsQueue.forEach((req) => req.reject(error));
            failedRequestsQueue = [];
            throw error;
        })
        .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
        });

    return refreshPromise;
};

// ── API Request ─────────────────────────────────────────

interface RequestOptions extends RequestInit {
    skipAuth?: boolean;
    retryOnUnauthorized?: boolean;
}

export const apiRequest = async <T = any>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> => {
    const { skipAuth = false, retryOnUnauthorized = true, ...fetchOptions } = options;

    // Build URL
    const url = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint}`;

    // Add authorization header
    const headers = new Headers(fetchOptions.headers);

    if (!skipAuth) {
        const token = getAccessToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        // Check if token is about to expire and proactively refresh
        if (token && isTokenExpired() && !isRefreshing) {
            try {
                const newToken = await handleTokenRefresh();
                if (newToken) {
                    headers.set('Authorization', `Bearer ${newToken}`);
                }
            } catch (error) {
                // Continue with old token, will handle 401 below
            }
        }
    }

    // Make request
    const response = await fetch(url, {
        ...fetchOptions,
        headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401 && retryOnUnauthorized && !skipAuth) {
        try {
            // Wait for token refresh (or if already refreshing, wait for that)
            const newToken = await new Promise<string>((resolve, reject) => {
                if (isRefreshing) {
                    // Queue this request
                    failedRequestsQueue.push({ resolve, reject });
                } else {
                    // Start refresh
                    handleTokenRefresh()
                        .then((token) => {
                            if (token) {
                                resolve(token);
                            } else {
                                reject(new Error('No token after refresh'));
                            }
                        })
                        .catch(reject);
                }
            });

            // Retry request with new token
            headers.set('Authorization', `Bearer ${newToken}`);
            const retryResponse = await fetch(url, {
                ...fetchOptions,
                headers,
            });

            if (!retryResponse.ok) {
                const error = await retryResponse.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.message || error.error || 'Request failed');
            }

            return retryResponse.json();
        } catch (refreshError: any) {
            // Refresh failed - redirect to login
            window.dispatchEvent(new CustomEvent('auth:logout', {
                detail: { reason: refreshError.message }
            }));
            throw refreshError;
        }
    }

    // Handle other errors
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || error.error || error.detail || 'Request failed');
    }

    // Return response
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return response.json();
    }

    return response.text() as any;
};

// ── Convenience Methods ─────────────────────────────────

export const api = {
    get: <T = any>(endpoint: string, options?: RequestOptions) =>
        apiRequest<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(options?.headers as Record<string, string>),
            },
            body: body ? JSON.stringify(body) : undefined,
        }),

    put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(options?.headers as Record<string, string>),
            },
            body: body ? JSON.stringify(body) : undefined,
        }),

    delete: <T = any>(endpoint: string, options?: RequestOptions) =>
        apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
