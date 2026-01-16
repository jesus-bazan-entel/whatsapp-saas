/**
 * OnboardingChecklist
 *
 * Interactive checklist saved locally (client-side) so users can track progress.
 * In the SaaS version, you can persist this in Supabase per organization.
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

export type ChecklistItem = {
  id: string
  label: string
  description?: string
}

const STORAGE_KEY = 'onboarding_checklist_v1'

export function OnboardingChecklist({ items }: { items: ChecklistItem[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Record<string, boolean>
      setChecked(parsed)
    } catch {
      // ignore
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked))
    } catch {
      // ignore
    }
  }, [checked])

  const completedCount = useMemo(
    () => items.filter((i) => checked[i.id]).length,
    [items, checked]
  )

  const pct = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Checklist de Onboarding</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setChecked({})}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reiniciar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <Progress value={pct} />
          <div className="text-xs text-muted-foreground">
            {completedCount} de {items.length} completados
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                checked={!!checked[item.id]}
                onCheckedChange={(v) =>
                  setChecked((prev) => ({ ...prev, [item.id]: Boolean(v) }))
                }
                className="mt-1"
              />
              <div className="space-y-1">
                <div className="text-sm font-medium">{item.label}</div>
                {item.description ? (
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
