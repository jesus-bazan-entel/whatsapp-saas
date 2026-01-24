/**
 * Sales Analytics API
 *
 * Provides sales metrics and data for charts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface SalesMetrics {
  totalSales: number
  totalRevenue: number
  averageOrderValue: number
  pendingPayments: number
  completedPayments: number
  conversionRate: number
  topProducts: Array<{
    product_name: string
    total_sales: number
    revenue: number
  }>
  salesByDay: Array<{
    date: string
    sales: number
    revenue: number
  }>
  salesByStatus: Array<{
    status: string
    count: number
  }>
  paymentMethods: Array<{
    method: string
    count: number
    revenue: number
  }>
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()

    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const days = parseInt(searchParams.get('days') || '30')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Total sales and revenue
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('total_amount, status, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())

    if (salesError) {
      console.error('Error fetching sales:', salesError)
      return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
    }

    const totalSales = sales?.length || 0
    const completedSales = sales?.filter((s) => s.status === 'completed') || []
    const totalRevenue = completedSales.reduce(
      (sum, s) => sum + parseFloat(String(s.total_amount)),
      0
    )
    const averageOrderValue = totalSales > 0 ? totalRevenue / completedSales.length : 0

    // Payment transactions
    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('status, amount, payment_provider, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())

    const pendingPayments =
      payments?.filter((p) => ['pending', 'processing'].includes(p.status)).length || 0
    const completedPayments =
      payments?.filter((p) => p.status === 'completed').length || 0

    // Conversion rate (conversations to sales)
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())

    const conversionRate =
      conversations && conversations.length > 0
        ? (completedSales.length / conversations.length) * 100
        : 0

    // Top products
    const { data: topProductsData } = await supabase
      .from('sale_items')
      .select(
        `
        product_id,
        quantity,
        total_price,
        products (name)
      `
      )
      .eq('organization_id', organizationId)

    const productSalesMap = new Map<string, { name: string; sales: number; revenue: number }>()

    topProductsData?.forEach((item: {
      product_id: string
      quantity: number
      total_price: number
      products: { name: string } | null
    }) => {
      if (!item.products) return

      const existing = productSalesMap.get(item.product_id) || {
        name: item.products.name,
        sales: 0,
        revenue: 0,
      }

      productSalesMap.set(item.product_id, {
        name: existing.name,
        sales: existing.sales + item.quantity,
        revenue: existing.revenue + parseFloat(String(item.total_price)),
      })
    })

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({
        product_name: p.name,
        total_sales: p.sales,
        revenue: p.revenue,
      }))

    // Sales by day
    const salesByDayMap = new Map<string, { sales: number; revenue: number }>()
    sales?.forEach((sale) => {
      const date = new Date(sale.created_at).toISOString().split('T')[0]
      const existing = salesByDayMap.get(date) || { sales: 0, revenue: 0 }

      salesByDayMap.set(date, {
        sales: existing.sales + 1,
        revenue:
          existing.revenue +
          (sale.status === 'completed' ? parseFloat(String(sale.total_amount)) : 0),
      })
    })

    const salesByDay = Array.from(salesByDayMap.entries())
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        revenue: data.revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Sales by status
    const statusMap = new Map<string, number>()
    sales?.forEach((sale) => {
      statusMap.set(sale.status, (statusMap.get(sale.status) || 0) + 1)
    })

    const salesByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }))

    // Payment methods
    const { data: paymentMethodsData } = await supabase
      .from('payment_transactions')
      .select(
        `
        payment_method_id,
        amount,
        status,
        payment_methods (name)
      `
      )
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())

    const methodsMap = new Map<string, { count: number; revenue: number }>()

    paymentMethodsData?.forEach((item: {
      payment_method_id: string | null
      amount: number
      status: string
      payment_methods: { name: string } | null
    }) => {
      const methodName = item.payment_methods?.name || 'Sin método'
      const existing = methodsMap.get(methodName) || { count: 0, revenue: 0 }

      methodsMap.set(methodName, {
        count: existing.count + 1,
        revenue:
          existing.revenue +
          (item.status === 'completed' ? parseFloat(String(item.amount)) : 0),
      })
    })

    const paymentMethods = Array.from(methodsMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      revenue: data.revenue,
    }))

    const metrics: SalesMetrics = {
      totalSales,
      totalRevenue,
      averageOrderValue,
      pendingPayments,
      completedPayments,
      conversionRate,
      topProducts,
      salesByDay,
      salesByStatus,
      paymentMethods,
    }

    return NextResponse.json({
      success: true,
      metrics,
    })
  } catch (error) {
    console.error('Error in GET /api/analytics/sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
