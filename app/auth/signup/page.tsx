'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createSupabaseBrowserClient()

      // 1) Create auth user
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error

      // 2) Create organization + team member record via API (service role)
      const res = await fetch('/api/onboarding/create-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          email,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'No se pudo crear la organización')

      toast.success('Cuenta creada. Bienvenido!')
      router.push('/dashboard/onboarding')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Empieza a vender por WhatsApp con IA en minutos</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando…' : 'Crear cuenta'}
            </Button>
            <div className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link className="underline" href="/auth/login">
                Iniciar sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
