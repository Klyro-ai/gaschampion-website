export async function logError(
  db: D1Database,
  worker: string,
  errorType: string,
  message: string,
  clientId?: string
): Promise<void> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      'INSERT INTO error_log (id, client_id, worker, error_type, message) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, clientId ?? null, worker, errorType, message)
    .run();
}
