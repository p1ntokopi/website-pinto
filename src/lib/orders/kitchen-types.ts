import { OrderStatus } from '@/lib/orders/status-machine'

export type KitchenOrderItemOption = {
  option_value_snapshot: string | null
}

export type KitchenOrderItem = {
  id: string
  quantity: number
  product_name_snapshot: string
  variant_name_snapshot: string | null
  notes: string | null
  options: KitchenOrderItemOption[] | null
}

export type KitchenOrder = {
  id: string
  order_number: string
  status: OrderStatus
  created_at: string
  notes: string | null
  table: { table_number: string } | null
  items: KitchenOrderItem[]
}
