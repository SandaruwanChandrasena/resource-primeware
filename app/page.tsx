import { db } from "@/lib/db";

export default async function Home() {
  // Quick DB check, replaced in Stage 2.
  const [users, resources] = await Promise.all([db.user.count(), db.resource.count()]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-3xl font-bold">Resource Reservation System</h1>
      <p className="text-gray-600">
        Database connected. Users: {users}, Resources: {resources}
      </p>
    </main>
  );
}