import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Admin Login - P1NTO Coffee',
}

export default async function AdminLoginPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // If already logged in, redirect to admin dashboard
  if (session) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 bg-primary/5 pattern-boxes pattern-primary/10 pattern-size-4" />
      
      <Card className="w-full max-w-sm relative z-10 shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center border border-primary/20">
            <span className="font-display font-bold text-2xl text-primary">P</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="font-display text-2xl">P1NTO Admin</CardTitle>
            <CardDescription>Enter your credentials to access operations.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
