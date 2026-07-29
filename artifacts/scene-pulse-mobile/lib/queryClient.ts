import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton QueryClient shared between the React tree and background fetch tasks.
 * Background tasks import this directly to invalidate stale cache entries after
 * a silent background refresh, so the next foreground render shows fresh data.
 */
export const queryClient = new QueryClient();
