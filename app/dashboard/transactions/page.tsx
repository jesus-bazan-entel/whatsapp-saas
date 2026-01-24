'use client'

/**
 * Transactions Dashboard
 *
 * Real-time view of payment transactions with status updates
 */

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/browser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle, XCircle, Clock, Eye, Download } from 'lucide-react'

interface PaymentTransaction {
  id: string
  sale_id: string
  customer_id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  payment_provider: string
  created_at: string
  paid_at: string | null
  customers: {
    name: string
    phone_number: string
  }
  payment_methods: {
    name: string
  } | null
  payment_receipts: Array<{
    id: string
    image_url: string
    ai_confidence: number
    extracted_amount: number | null
    is_verified: boolean
  }>
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-800', icon: Clock },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: XCircle },
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const supabase = createBrowserClient()

  // Get organization
  useEffect(() => {
    const getOrganization = async () => {
      try {
        const response = await fetch('/api/organization/me')
        if (response.ok) {
          const data = await response.json()
          setOrganizationId(data.organization?.id)
        }
      } catch (error) {
        console.error('Error fetching organization:', error)
      }
    }

    getOrganization()
  }, [])

  // Fetch transactions
  useEffect(() => {
    if (!organizationId) return

    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(
          `
          *,
          customers (name, phone_number),
          payment_methods (name),
          payment_receipts (id, image_url, ai_confidence, extracted_amount, is_verified)
        `
        )
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching transactions:', error)
      } else {
        setTransactions(data as unknown as PaymentTransaction[])
      }

      setLoading(false)
    }

    fetchTransactions()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('payment_transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_transactions',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          console.log('Transaction updated:', payload)

          if (payload.eventType === 'INSERT') {
            // Fetch the full transaction with relations
            fetchTransactions()
          } else if (payload.eventType === 'UPDATE') {
            setTransactions((prev) =>
              prev.map((t) =>
                t.id === payload.new.id
                  ? { ...t, ...(payload.new as Partial<PaymentTransaction>) }
                  : t
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTransactions((prev) => prev.filter((t) => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId, supabase])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleVerifyPayment = async (transactionId: string, receiptId: string) => {
    try {
      const response = await fetch('/api/payments/process-receipt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId,
          isVerified: true,
          verificationNotes: 'Verificado manualmente desde el dashboard',
        }),
      })

      if (response.ok) {
        // Refresh transactions
        const { data } = await supabase
          .from('payment_transactions')
          .select(
            `
            *,
            customers (name, phone_number),
            payment_methods (name),
            payment_receipts (id, image_url, ai_confidence, extracted_amount, is_verified)
          `
          )
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(50)

        setTransactions(data as unknown as PaymentTransaction[])
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando transacciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transacciones</h1>
          <p className="text-gray-500">Monitor de pagos en tiempo real</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm text-gray-600">En vivo</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = transactions.filter((t) => t.status === status).length
          const total = transactions
            .filter((t) => t.status === status)
            .reduce((sum, t) => sum + t.amount, 0)

          return (
            <Card key={status}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                <config.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">{formatCurrency(total)}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
          <CardDescription>
            Últimas 50 transacciones • Actualización automática
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Comprobante</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const statusInfo = statusConfig[transaction.status]
                const Icon = statusInfo.icon

                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.customers.name}</div>
                        <div className="text-sm text-gray-500">
                          {transaction.customers.phone_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      {transaction.payment_methods?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.payment_receipts.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            {transaction.payment_receipts[0].is_verified
                              ? 'Verificado'
                              : `${Math.round(transaction.payment_receipts[0].ai_confidence * 100)}% confianza`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin comprobante</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransaction(transaction)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog
        open={selectedTransaction !== null}
        onOpenChange={() => setSelectedTransaction(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Transacción</DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Cliente</label>
                  <p className="text-lg">{selectedTransaction.customers.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedTransaction.customers.phone_number}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Monto</label>
                  <p className="text-lg font-bold">
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Método de Pago</label>
                  <p className="text-lg">
                    {selectedTransaction.payment_methods?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <div className="mt-1">
                    <Badge className={statusConfig[selectedTransaction.status].color}>
                      {statusConfig[selectedTransaction.status].label}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedTransaction.payment_receipts.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Comprobantes de Pago</h3>
                  {selectedTransaction.payment_receipts.map((receipt) => (
                    <div key={receipt.id} className="flex items-start gap-4 mb-4">
                      <img
                        src={receipt.image_url}
                        alt="Comprobante"
                        className="w-32 h-32 object-cover rounded border"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {receipt.is_verified ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendiente de verificación
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">Monto detectado:</span>{' '}
                            {receipt.extracted_amount
                              ? formatCurrency(receipt.extracted_amount)
                              : 'N/A'}
                          </p>
                          <p>
                            <span className="font-medium">Confianza IA:</span>{' '}
                            {Math.round(receipt.ai_confidence * 100)}%
                          </p>
                        </div>
                        {!receipt.is_verified && (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              handleVerifyPayment(selectedTransaction.id, receipt.id)
                            }
                          >
                            Verificar Pago
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
