const TARGET = 'https://api.store.friendly-pharmacist.com';
const ALLOWED_ORIGINS = [
  'https://influencer-p68.pages.dev',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
];

function getCorsOrigin(request) {
  const origin = request.headers.get('origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (origin.endsWith('.influencer-p68.pages.dev')) return origin;
  return ALLOWED_ORIGINS[0];
}

export async function onRequest(context) {
  const corsOrigin = getCorsOrigin(context.request);

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(context.request.url);
  const targetUrl = `${TARGET}${url.pathname}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');

  const init = { method: context.request.method, headers };
  if (!['GET', 'HEAD'].includes(context.request.method)) {
    init.body = context.request.body;
  }

  const res = await fetch(targetUrl, init);

  const responseHeaders = new Headers(res.headers);
  responseHeaders.set('Access-Control-Allow-Origin', corsOrigin);

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
}
