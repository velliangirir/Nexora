export function cryptoNativeRandomUUID(): string {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}
