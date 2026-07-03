import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Leaf, Home, Search } from '@/lib/icons';
import { GradientMesh } from '@/components/ui/GradientMesh';

export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });

    return (
        <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background p-6 grain">
            <GradientMesh intensity="soft" />
            <div className="relative z-10 w-full max-w-md text-center">
                <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-glow">
                    <Leaf className="h-7 w-7 text-primary" weight="duotone" />
                </span>
                <h1 className="font-display text-display-lg font-semibold text-gradient-brand">404</h1>
                <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">This path leads nowhere</h2>
                <p className="mt-3 text-muted-foreground text-pretty">
                    The page <span className="font-medium text-foreground">"{pageName}"</span> could not be found.
                    Let's guide you back.
                </p>

                {isFetched && authData?.isAuthenticated && authData.user?.role === 'admin' && (
                    <div className="mt-6 rounded-xl border border-border bg-card p-4 text-left shadow-sm">
                        <p className="text-sm font-medium text-foreground">Admin note</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            This route may not be implemented yet.
                        </p>
                    </div>
                )}

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <a
                        href="/"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-primary to-[hsl(var(--primary)/0.9)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-105"
                    >
                        <Home className="h-4 w-4" weight="duotone" /> Go home
                    </a>
                    <a
                        href="/Directory"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
                    >
                        <Search className="h-4 w-4" /> Browse the directory
                    </a>
                </div>
            </div>
        </div>
    );
}
