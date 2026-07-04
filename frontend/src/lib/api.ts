import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — attach access token ──────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Track if we're already refreshing to avoid infinite loop ──
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject:  (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

// ── Response interceptor — auto refresh on 401 ────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only handle 401s — and skip if this is already a retry
    // or if it came from the auth endpoints themselves
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/')
    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Another request already triggered a refresh — queue this one
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      }).catch(err => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = localStorage.getItem('refresh_token')

    if (!refreshToken) {
      // No refresh token — clear everything and go to login
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      // Call refresh endpoint directly with axios (not api instance)
      // to avoid triggering this interceptor again
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'}/auth/token/refresh/`,
        { refresh: refreshToken }
      )

      const newAccessToken = res.data.access
      localStorage.setItem('access_token', newAccessToken)

      // Retry all queued requests with new token
      processQueue(null, newAccessToken)

      // Retry the original request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalRequest)

    } catch (refreshError) {
      // Refresh token also expired — force logout
      processQueue(refreshError, null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api