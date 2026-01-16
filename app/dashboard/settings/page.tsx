/**
 * Settings Page
 *
 * Allows customers to configure their organization settings, specifically WhatsApp integration.
 *
 * IMPORTANT:
 * - For the SaaS production version, organizationId should come from auth/session.
 * - In this MVP, we ask for organizationId to keep it testable without auth.
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Save, ExternalLink, Copy } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    organizationId: '',
    whatsapp_phone_number_id: '',
    whatsapp_phone_number: '',
  })

  const callbackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp/webhook`
    : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/organization/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const json = await response.json()
      if (!response.ok) throw new Error(json?.error || 'Failed to save settings')

      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configura tu organización e integraciones.
        </p>
      </div>

      <div className="grid gap-6">
        {/* WhatsApp Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-green-500" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.96 1.0-3.648-.235-.381A9.873 9.873 0 012 12.092a9.87 9.87 0 019.876-9.876c2.638 0 5.118 1.027 6.984 2.893a9.835 9.835 0 012.896 6.983c-.003 5.445-4.43 9.872-9.873 9.872" />
              </svg>
              WhatsApp Integration
            </CardTitle>
            <CardDescription>
              Conecta tu WhatsApp Business para empezar a recibir mensajes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Necesitas una app en Meta Developers con WhatsApp Cloud API.
                <a
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                  target="_blank"
                  rel="noreferrer"
                  className="underline ml-1 inline-flex items-center"
                >
                  Leer guía <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <b>MVP:</b> Por ahora debes pegar tu <code>organizationId</code> manualmente.
                En la versión SaaS final, esto vendrá del login automáticamente.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="org_id">Organization ID</Label>
                <Input
                  id="org_id"
                  placeholder="uuid (ej: 550e8400-e29b-41d4-a716-446655440000)"
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Este ID es el de la tabla <code>organizations</code> en Supabase.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone_id">Phone Number ID</Label>
                <Input
                  id="phone_id"
                  placeholder="e.g. 105954558972418"
                  value={formData.whatsapp_phone_number_id}
                  onChange={(e) => setFormData({ ...formData, whatsapp_phone_number_id: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Meta Developers → WhatsApp → API Setup → "Phone number ID"
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone_number">WhatsApp Phone Number (opcional)</Label>
                <Input
                  id="phone_number"
                  placeholder="e.g. +51 999 999 999"
                  value={formData.whatsapp_phone_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_phone_number: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Número visible (display_phone_number).
                </p>
              </div>

              <Button type="submit" disabled={loading} className="gap-2">
                <Save className="h-4 w-4" />
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Webhook Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>
              Configura esta URL en Meta Dashboard para recibir mensajes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Callback URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={callbackUrl} className="bg-muted" />
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(callbackUrl)
                    toast.success('Copiado al portapapeles')
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Verify Token</Label>
              <Input readOnly value="WHATSAPP_VERIFY_TOKEN" className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Debe coincidir con la variable de entorno <code>WHATSAPP_VERIFY_TOKEN</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
