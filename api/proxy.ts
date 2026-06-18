import type { VercelRequest, VercelResponse } from '@vercel/node';

// Allowlist of hostnames that the proxy can access
const ALLOWED_HOSTNAMES = new Set([
  'is.gd',
  '0x0.st',
  'dpaste.org',
  'ix.io',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const targetUrl = req.query.url as string;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  try {
    const url = new URL(targetUrl);
    
    // Check if hostname is in allowlist
    if (!ALLOWED_HOSTNAMES.has(url.hostname)) {
      return res.status(403).json({ error: 'Access to this hostname is not allowed' });
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'User-Agent': 'Vanity-Proxy/1.0',
      },
    };

    if (req.method === 'POST') {
      fetchOptions.body = JSON.stringify(req.body);
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Content-Type': 'application/json',
      };
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type');
    const data = await response.text();

    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // Add CORS headers for Vercel function
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    return res.status(response.status).send(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch the target URL', details: error.message });
  }
}
