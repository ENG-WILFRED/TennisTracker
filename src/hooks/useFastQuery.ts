import { useState, useEffect, useCallback } from 'react'

interface UseFastQueryOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
}

interface UseFastQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Simple in-memory cache
const queryCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useFastQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseFastQueryOptions = {}
): UseFastQueryResult<T> {
  const { enabled = true, refetchOnWindowFocus = true } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    // Check cache first
    const cached = queryCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setData(cached.data)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
      setError(null)

      // Cache the result
      queryCache.set(key, { data: result, timestamp: Date.now() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, enabled])

  const refetch = useCallback(async () => {
    // Clear cache for this key
    queryCache.delete(key)
    await fetchData()
  }, [key, fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (refetchOnWindowFocus) {
      const handleFocus = () => {
        const cached = queryCache.get(key)
        if (cached && Date.now() - cached.timestamp >= CACHE_DURATION) {
          fetchData()
        }
      }

      window.addEventListener('focus', handleFocus)
      return () => window.removeEventListener('focus', handleFocus)
    }
  }, [key, fetchData, refetchOnWindowFocus])

  return { data, loading, error, refetch }
}

// Hook for mutations with optimistic updates
export function useFastMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: Error, variables: TVariables) => void
    invalidateKeys?: string[]
  } = {}
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(async (variables: TVariables) => {
    setLoading(true)
    setError(null)

    try {
      const result = await mutationFn(variables)

      // Invalidate related queries
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          queryCache.delete(key)
        })
      }

      options.onSuccess?.(result, variables)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Mutation failed')
      setError(error)
      options.onError?.(error, variables)
      throw error
    } finally {
      setLoading(false)
    }
  }, [mutationFn, options])

  return { mutate, loading, error }
}