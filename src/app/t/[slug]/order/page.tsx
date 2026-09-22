import { createClient } from "@/lib/supabase/server";
import { getSessionToken } from "@/lib/ordering/session";
import { redirect, notFound } from "next/navigation";

export default async function TableOrderIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();

  // 1. Verify table exists
  const { data: table } = await supabase
    .from("tables")
    .select("id, slug, table_number")
    .eq("slug", resolvedParams.slug)
    .single();

  if (!table) {
    notFound();
  }

  // 2. Check if table has an active session
  const { data: statusData } = await supabase.rpc("get_table_session_status", {
    p_table_slug: table.slug,
  });
  const status = statusData as { success?: boolean; has_active_session?: boolean } | null;
  const hasActiveSession = status?.success === true && status.has_active_session === true;

  if (!hasActiveSession) {
    // No active session opened by cashier yet, send to table landing page
    redirect(`/t/${table.slug}`);
  }

  // 3. Check customer session token
  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    // Session is open on table but device does not have token yet
    redirect(`/t/${table.slug}`);
  }

  // 4. Fetch session summary to get orders
  const { data: summaryData } = await supabase.rpc("get_dining_session_summary", {
    p_table_slug: table.slug,
    p_session_token: sessionToken,
  });

  const orders = (
    summaryData as { orders?: Array<{ order_number?: string }> } | null
  )?.orders;

  if (orders && orders.length > 0) {
    // Redirect to the latest order tracking page
    const latestOrder = orders[orders.length - 1];
    if (latestOrder?.order_number) {
      redirect(`/t/${table.slug}/order/${latestOrder.order_number}`);
    }
  }

  // Session is active but no orders placed yet -> redirect to menu
  redirect(`/t/${table.slug}/menu`);
}
