/**
 * Payment Receipt Processing API
 *
 * Processes payment receipt images uploaded by customers
 * Uses Gemini Vision to extract payment information
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { analyzePaymentReceipt } from '@/lib/gemini/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ProcessReceiptRequest {
  paymentTransactionId: string
  imageUrl: string
  expectedAmount?: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()

    // Get request body
    const body: ProcessReceiptRequest = await request.json()
    const { paymentTransactionId, imageUrl, expectedAmount } = body

    if (!paymentTransactionId || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentTransactionId, imageUrl' },
        { status: 400 }
      )
    }

    // Get payment transaction to verify it exists and get organization_id
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*, sale_id, organization_id')
      .eq('id', paymentTransactionId)
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Payment transaction not found' },
        { status: 404 }
      )
    }

    // Analyze the receipt image using Gemini Vision
    console.log('Analyzing payment receipt with Gemini Vision...')
    const analysis = await analyzePaymentReceipt(
      imageUrl,
      expectedAmount || transaction.amount
    )

    console.log('Receipt analysis complete:', {
      isValid: analysis.isValid,
      confidence: analysis.confidence,
      extractedAmount: analysis.extractedAmount,
    })

    // Determine image type based on payment method
    let imageType: 'bank_transfer' | 'qr_payment' | 'receipt' | 'other' = 'other'
    if (analysis.paymentMethod === 'bank_transfer') {
      imageType = 'bank_transfer'
    } else if (analysis.paymentMethod === 'qr_payment') {
      imageType = 'qr_payment'
    } else if (analysis.isValid) {
      imageType = 'receipt'
    }

    // Store receipt in database
    const { data: receipt, error: receiptError } = await supabase
      .from('payment_receipts')
      .insert({
        organization_id: transaction.organization_id,
        payment_transaction_id: paymentTransactionId,
        image_url: imageUrl,
        image_type: imageType,
        ai_analysis: analysis as unknown as Record<string, unknown>,
        ai_confidence: analysis.confidence,
        extracted_amount: analysis.extractedAmount,
        extracted_date: analysis.extractedDate,
        extracted_reference: analysis.extractedReference,
        is_verified: false, // Manual verification required
      })
      .select()
      .single()

    if (receiptError) {
      console.error('Error storing receipt:', receiptError)
      return NextResponse.json(
        { error: 'Failed to store receipt' },
        { status: 500 }
      )
    }

    // Update payment transaction status based on analysis
    if (analysis.isValid && analysis.confidence >= 0.7) {
      // High confidence - mark as processing
      await supabase
        .from('payment_transactions')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentTransactionId)
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      organization_id: transaction.organization_id,
      entity_type: 'payment_receipt',
      entity_id: receipt.id,
      action: 'created',
      changes: {
        confidence: analysis.confidence,
        extractedAmount: analysis.extractedAmount,
        isValid: analysis.isValid,
      },
    })

    return NextResponse.json({
      success: true,
      receipt,
      analysis: {
        isValid: analysis.isValid,
        confidence: analysis.confidence,
        extractedAmount: analysis.extractedAmount,
        extractedDate: analysis.extractedDate,
        extractedReference: analysis.extractedReference,
        warnings: analysis.warnings,
        requiresManualReview: analysis.confidence < 0.7 || !analysis.isValid,
      },
    })
  } catch (error) {
    console.error('Error processing receipt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Verify a payment receipt manually
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()

    const body = await request.json()
    const { receiptId, isVerified, verificationNotes } = body

    if (!receiptId || typeof isVerified !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: receiptId, isVerified' },
        { status: 400 }
      )
    }

    // Get current user (assuming they're authenticated)
    // In a real app, you'd get this from the session
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    // Update receipt verification status
    const { data: receipt, error } = await supabase
      .from('payment_receipts')
      .update({
        is_verified: isVerified,
        verified_at: new Date().toISOString(),
        verification_notes: verificationNotes,
      })
      .eq('id', receiptId)
      .select('*, payment_transaction_id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 })
    }

    // If verified successfully, update payment transaction to completed
    if (isVerified) {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', receipt.payment_transaction_id)

      // Also update the sale status
      const { data: transaction } = await supabase
        .from('payment_transactions')
        .select('sale_id')
        .eq('id', receipt.payment_transaction_id)
        .single()

      if (transaction?.sale_id) {
        await supabase
          .from('sales')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.sale_id)
      }
    }

    return NextResponse.json({
      success: true,
      receipt,
    })
  } catch (error) {
    console.error('Error verifying receipt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
