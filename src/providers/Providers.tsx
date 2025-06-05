'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { store } from '@/lib/store'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { useState } from 'react'
import type { Session } from 'next-auth'

interface ProvidersProps {
  children: React.ReactNode
  session?: Session | null
}

export function Providers({ children, session }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <SessionProvider session={session}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </Provider>
    </SessionProvider>
  )
}
