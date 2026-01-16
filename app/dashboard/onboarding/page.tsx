/**
 * Onboarding Guide Page
 *
 * Interactive, video-based onboarding for PyME customers.
 *
 * This guide is designed to:
 * - Reduce your manual onboarding workload
 * - Increase activation (connect WhatsApp + add products)
 * - Make setup steps explicit and trackable
 */

'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Bot,
  CheckCircle,
  Copy,
  Database,
  ExternalLink,
  HelpCircle,
  MessageCircle,
  Settings,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

import { VideoEmbed } from '@/components/onboarding/VideoEmbed'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'

export default function OnboardingPage() {
  const [activeStep, setActiveStep] = useState<'step1' | 'step2' | 'step3' | 'step4'>('step1')

  const callbackUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/api/whatsapp/webhook`
  }, [])

  const checklistItems = useMemo(
    () => [
      {
        id: 'supabase_project',
        label: 'Crear proyecto en Supabase',
        description: 'Necesitas Supabase para guardar leads, conversaciones, clientes, etc.',
      },
      {
        id: 'supabase_schema',
        label: 'Ejecutar schema SaaS (multi-tenant)',
        description: 'Ejecuta supabase-schema-saas.sql en el SQL Editor de Supabase.',
      },
      {
        id: 'whatsapp_meta_app',
        label: 'Crear app en Meta Developers + WhatsApp Cloud API',
        description: 'Activa WhatsApp product y obtén tu phone_number_id.',
      },
      {
        id: 'save_phone_number_id',
        label: 'Guardar Phone Number ID en Settings',
        description: 'Esto conecta tu tenant (organización) al webhook automáticamente.',
      },
      {
        id: 'webhook_config',
        label: 'Configurar webhook en Meta Dashboard',
        description: 'Callback URL + Verify token + subscribe a messages.',
      },
      {
        id: 'add_products',
        label: 'Cargar productos',
        description: 'La IA recomienda mejor si tienes catálogo completo.',
      },
      {
        id: 'send_test_message',
        label: 'Enviar mensaje de prueba por WhatsApp',
        description: 'Confirma que se crea customer + conversation + messages en Supabase.',
      },
    ],
    []
  )

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onboarding Guide</h1>
          <p className="text-muted-foreground mt-2">
            Guía paso a paso para conectar WhatsApp + IA y empezar a vender.
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <Link href="/dashboard/settings">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" /> Ir a Settings
            </Button>
          </Link>
          <Link href="/dashboard/products">
            <Button className="gap-2">
              <Wrench className="h-4 w-4" /> Cargar Productos
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Steps */}
        <div className="space-y-6">
          <Tabs value={activeStep} onValueChange={(v) => setActiveStep(v as any)} className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="step1" className="gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden md:inline">Supabase</span>
              </TabsTrigger>
              <TabsTrigger value="step2" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden md:inline">WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger value="step3" className="gap-2">
                <Bot className="h-4 w-4" />
                <span className="hidden md:inline">IA</span>
              </TabsTrigger>
              <TabsTrigger value="step4" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden md:inline">Lanzar</span>
              </TabsTrigger>
            </TabsList>

            {/* STEP 1 */}
            <TabsContent value="step1" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>1) Configura la base de datos (Supabase)</CardTitle>
                  <CardDescription>
                    Aquí se guardarán tus leads, clientes, conversaciones, mensajes, ventas y productos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <VideoEmbed
                    title="Video: Crear proyecto Supabase + ejecutar schema"
                    // Placeholder video (replace later)
                    embedUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  />

                  <Accordion type="single" collapsible>
                    <AccordionItem value="supabase-steps">
                      <AccordionTrigger>Checklist rápido</AccordionTrigger>
                      <AccordionContent>
                        <ol className="list-decimal pl-5 space-y-2 text-sm">
                          <li>
                            Crea un proyecto en{' '}
                            <a className="underline" href="https://supabase.com" target="_blank" rel="noreferrer">
                              supabase.com
                            </a>
                          </li>
                          <li>Ve a SQL Editor y ejecuta <code>supabase-schema-saas.sql</code></li>
                          <li>Copia URL + anon key + service role key a tu <code>.env.local</code></li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="flex justify-end">
                    <Button onClick={() => setActiveStep('step2')} className="gap-2">
                      Siguiente <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* STEP 2 */}
            <TabsContent value="step2" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>2) Conecta WhatsApp Business (Cloud API)</CardTitle>
                  <CardDescription>
                    El webhook recibe mensajes y los enruta automáticamente a tu organización usando el <code>phone_number_id</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <VideoEmbed
                    title="Video: Configurar Meta Developers + Webhook"
                    embedUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  />

                  <Alert className="bg-blue-50 border-blue-200">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                      Guía oficial:{' '}
                      <a
                        className="underline inline-flex items-center gap-1"
                        href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp Cloud API Get Started <ExternalLink className="h-3 w-3" />
                      </a>
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="text-sm font-medium">Webhook Callback URL</div>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono break-all">
                        {callbackUrl || 'Cargando...'}
                      </div>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          if (!callbackUrl) return
                          navigator.clipboard.writeText(callbackUrl)
                          toast.success('Callback URL copiado')
                        }}
                      >
                        <Copy className="h-4 w-4" />
                        Copiar
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Pega esta URL en Meta Dashboard → WhatsApp → Configuration → Webhooks.
                    </div>
                  </div>

                  <Accordion type="single" collapsible>
                    <AccordionItem value="phone-number-id">
                      <AccordionTrigger>¿Dónde encuentro el Phone Number ID?</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p>
                            Meta Developers → Tu App → WhatsApp → <b>API Setup</b> → busca “Phone number ID”.
                          </p>
                          <p>
                            Luego ve a <Link href="/dashboard/settings" className="underline">Settings</Link> y guárdalo.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveStep('step1')}>Atrás</Button>
                    <Button onClick={() => setActiveStep('step3')} className="gap-2">
                      Siguiente <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* STEP 3 */}
            <TabsContent value="step3" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>3) Configura la IA (Gemini)</CardTitle>
                  <CardDescription>
                    La IA responde con lenguaje natural y recomienda productos de tu catálogo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <VideoEmbed
                    title="Video: Configurar Gemini API Key + mejorar respuestas"
                    embedUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  />

                  <div className="space-y-2 text-sm">
                    <p>
                      1) Obtén tu API key en{' '}
                      <a className="underline" href="https://ai.google.dev" target="_blank" rel="noreferrer">
                        ai.google.dev
                      </a>
                    </p>
                    <p>2) Colócala en <code>GEMINI_API_KEY</code> en tu entorno</p>
                    <p>
                      3) Carga tu catálogo en{' '}
                      <Link href="/dashboard/products" className="underline">
                        Products
                      </Link>
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveStep('step2')}>Atrás</Button>
                    <Button onClick={() => setActiveStep('step4')} className="gap-2">
                      Siguiente <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* STEP 4 */}
            <TabsContent value="step4" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>4) Prueba final</CardTitle>
                  <CardDescription>
                    Envía un WhatsApp a tu número y confirma que aparece una conversación.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <VideoEmbed
                    title="Video: Prueba end-to-end (WhatsApp → webhook → Supabase → respuesta IA)"
                    embedUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  />

                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-700" />
                    <AlertDescription className="text-green-900">
                      Si ya guardaste tu <code>phone_number_id</code> en Settings, el webhook asigna automáticamente los mensajes a tu organización.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-wrap gap-2">
                    <Link href="/dashboard/settings"><Button variant="outline" className="gap-2"><Settings className="h-4 w-4" /> Settings</Button></Link>
                    <Link href="/dashboard/conversations"><Button className="gap-2"><MessageCircle className="h-4 w-4" /> Ver Conversations</Button></Link>
                  </div>

                  <div className="flex justify-start">
                    <Button variant="outline" onClick={() => setActiveStep('step3')}>Atrás</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Checklist */}
        <div className="space-y-6">
          <OnboardingChecklist items={checklistItems} />

          <Card>
            <CardHeader>
              <CardTitle>¿Necesitas ayuda?</CardTitle>
              <CardDescription>
                Si tu cliente se traba en algún paso, aquí están los links rápidos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                className="text-sm underline inline-flex items-center gap-1"
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/overview"
                target="_blank"
                rel="noreferrer"
              >
                Documentación Webhooks WhatsApp <ExternalLink className="h-3 w-3" />
              </a>
              <a
                className="text-sm underline inline-flex items-center gap-1"
                href="https://supabase.com/docs"
                target="_blank"
                rel="noreferrer"
              >
                Documentación Supabase <ExternalLink className="h-3 w-3" />
              </a>
              <a
                className="text-sm underline inline-flex items-center gap-1"
                href="https://ai.google.dev"
                target="_blank"
                rel="noreferrer"
              >
                Documentación Gemini <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
