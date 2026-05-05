'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function CallbackPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        setError(sessionError.message)
        return
      }
      
      if (session) {
        router.push('/tree')
        router.refresh()
      } else {
        router.push('/login')
      }
    }
    
    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D1F0D' }}>
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <a 
            href="/login" 
            className="inline-block px-6 py-2 rounded-full font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #4CAF72, #2E7D32)' }}
          >
            Back to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D1F0D' }}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#81C784' }} />
        <p className="text-white/60">Signing you in...</p>
      </div>
    </div>
  )
}