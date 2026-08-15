import { createClient } from '@/lib/supabase/server'
import { getSessionToken } from '@/lib/ordering/session'
import { redirect } from 'next/navigation'
import { CartClient } from '@/components/ordering/cart-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Review Pesanan - P1NTO',
}

export default async function CartPage({ params }: { params: { slug: string } }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const sessionToken = await getSessionToken()

  // Verify Table & Session
  const { data: table } = await supabase
    .from('tables')
    .select('id, is_active')
    .eq('slug', resolvedParams.slug)
    .single()

  if (!table || !table.is_active || !sessionToken) {
    redirect(`/t/${resolvedParams.slug}`)
  }

  // Check if session is valid
  const { data: session } = await supabase.rpc('validate_dining_session', {
    p_table_slug: resolvedParams.slug,
    p_session_token: sessionToken,
  })

  if (!session || !session.success) {
    redirect(`/t/${resolvedParams.slug}`)
  }

  return <CartClient tableSlug={resolvedParams.slug} />
}
