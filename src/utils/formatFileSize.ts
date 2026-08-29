export function formatFileSize(bytes?: number | string | null): string {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "-";
  if (n === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  const value = n / Math.pow(1024, exponent);

  return `${exponent === 0 ? value : value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
}

export default formatFileSize;
