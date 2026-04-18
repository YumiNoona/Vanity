/**
 * Safe dynamic import wrapper for large chunks
 */
export async function safeImport<T>(loader: () => Promise<T>, label: string): Promise<T> {
  try {
    return await loader();
  } catch (e) {
    console.error(`Failed to load ${label}`, e);
    throw new Error(`Couldn't load ${label}. Check your connection and try again.`);
  }
}
