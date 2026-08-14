import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  
  // Test connection to Supabase categories table
  const { data: categories, error } = await supabase.from("categories").select("*");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8 font-sans">
      <h1 className="text-4xl font-display text-primary">P1NTO Coffee</h1>
      <p className="text-lg text-muted-foreground">Digital Coffee Shop Platform</p>
      
      <div className="p-6 border border-border rounded-xl bg-card w-full max-w-md shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">Database Status</h2>
        {error ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
            <p className="font-bold">Connection Error</p>
            <p>{error.message}</p>
            <p className="mt-2 text-xs">Pastikan .env.local sudah diisi dan migration sudah di-push.</p>
          </div>
        ) : (
          <div className="p-4 bg-success/10 text-success rounded-md text-sm">
            <p className="font-bold">Connection Successful</p>
            <p>Categories found: {categories?.length || 0}</p>
          </div>
        )}
      </div>
    </div>
  );
}
