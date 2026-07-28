import colors from '@/constants/colors';

export type CrowdLevel = 'open' | 'lively' | 'packed';

export function crowdColor(level: string): string {
  switch (level) {
    case 'open':
      return colors.light.success;
    case 'lively':
      return colors.light.secondary;
    case 'packed':
      return colors.light.destructive;
    default:
      return colors.light.mutedForeground;
  }
}

export function trendLabel(trend: string): string {
  switch (trend) {
    case 'rising':
      return 'Rising';
    case 'falling':
      return 'Falling';
    default:
      return 'Steady';
  }
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
