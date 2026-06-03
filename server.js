const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body); } catch (e) {
        res.writeHead(400, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      const data = JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: payload.system,
        messages: payload.messages
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const apiReq = https.request(options, apiRes => {
        let result = '';
        apiRes.on('data', chunk => { result += chunk; });
        apiRes.on('end', () => {
          res.writeHead(apiRes.statusCode, CORS_HEADERS);
          res.end(result);
        });
      });

      apiReq.on('error', err => {
        res.writeHead(500, CORS_HEADERS);
        res.end(JSON.stringify({ error: err.message }));
      });

      apiReq.write(data);
      apiReq.end();
    });
    return;
  }

  res.writeHead(404, CORS_HEADERS);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Clartée backend running on port ${PORT}`);
});
