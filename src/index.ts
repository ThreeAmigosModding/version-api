interface Env {
    GITHUB_TOKEN: string;
}

interface GitHubRelease {
    tag_name: string;
    html_url: string;
    published_at: string;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        const segments = url.pathname.split('/').filter(Boolean);

        if (segments[0] !== "versions" || !segments[1]) {
            return new Response(JSON.stringify({
                error: 'Invalid route. Use /versions/:resource-name'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const resourceName = segments[1];
        const githubRepo = `threeamigosmodding/${resourceName}`;
        const githubApiUrl = `https://api.github.com/repos/${githubRepo}/releases/latest`;

        const cacheKey = new Request(request.url, request);
        const cache = caches.default;
        const cached = await cache.match(cacheKey);
        if (cached) return cached;

        try {
            const ghRes = await fetch(githubApiUrl, {
                headers: {
                    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
                    'User-Agent': 'ThreeAmigosVersionChecker',
                    'Accept': 'application/vnd.github+json'
                }
            });

            if (ghRes.status === 404) {
                return new Response(JSON.stringify({
                    error: 'Repository or release not found. Check that the resource exists and has at least one GitHub release.',
                    resource: resourceName
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (!ghRes.ok) {
                return new Response(JSON.stringify({
                    error: 'Failed to fetch release info from GitHub.',
                    status: ghRes.status
                }), {
                    status: ghRes.status,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const data = await ghRes.json() as GitHubRelease;

            const response = new Response(JSON.stringify({
                resource: resourceName,
                latestVersion: data.tag_name,
                releaseUrl: data.html_url,
                publishedAt: data.published_at
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 's-maxage=3600'
                }
            });

            ctx.waitUntil(cache.put(cacheKey, response.clone()));
                return response;
        } catch (err: any) {
            return new Response(JSON.stringify({
                error: 'Unexpected error occurred',
                message: err.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};
