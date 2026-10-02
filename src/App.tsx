import { RouterProvider } from 'react-router'
import { ClerkProvider } from '@clerk/clerk-react'
import { AuthProvider } from './context/AuthContext'
import { router } from './routes'

const clerkPubKey =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim() ||
  (import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim() ||
  'pk_test_dmFsaWQtZ29vc2UtMjQwMy5jbGVyay5hY2NvdW50cy5kZXYk'

export default function App() {
  if (!clerkPubKey) {
    return (
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ClerkProvider>
  )
}
