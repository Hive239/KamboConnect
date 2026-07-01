import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Favorite, Follow } from '@/entities/all';

/**
 * Shared, cached current-user + favorites/follows hooks. react-query dedupes
 * concurrent identical queries, so N cards that each need the viewer no longer
 * fire N `User.me()` / N filter calls — they share one. Fixes the request storm.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => User.me().catch(() => null),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyFavorites() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => (user ? Favorite.filter({ user_id: user.id }) : Promise.resolve([])),
    enabled: !!user,
    staleTime: 60 * 1000,
  });
}

export function useMyFollows() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: ['follows', user?.id],
    queryFn: () => (user ? Follow.filter({ follower_id: user.id }) : Promise.resolve([])),
    enabled: !!user,
    staleTime: 60 * 1000,
  });
}

export function useDataInvalidator() {
  const qc = useQueryClient();
  return (key: 'favorites' | 'follows') => qc.invalidateQueries({ queryKey: [key] });
}
