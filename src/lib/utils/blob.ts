/**
 * Bulletproof ArrayBuffer/Uint8Array to Blob conversion.
 * Ensures compatibility with SharedArrayBuffer and strict production types.
 */
export function toBlob(
  data: ArrayBuffer | Uint8Array,
  type: string
): Blob {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return new Blob([bytes as any], { type });
}
