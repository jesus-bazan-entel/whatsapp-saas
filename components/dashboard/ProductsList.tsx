/**
 * Products List Component
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Plus, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ProductsList() {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configure Supabase credentials in <code className="bg-muted px-2 py-1 rounded">.env.local</code> to manage products
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Products Catalog</h2>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No products yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add products to your catalog to enable AI recommendations
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Why Add Products?</CardTitle>
          <CardDescription className="text-blue-800">
            Products help the AI make better recommendations to your customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>✓ AI recommends relevant products based on customer needs</p>
          <p>✓ Customers see pricing and descriptions</p>
          <p>✓ Increases conversion rates</p>
          <p>✓ Tracks which products are mentioned in conversations</p>
        </CardContent>
      </Card>
    </div>
  )
}
