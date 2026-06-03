const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.MISTRAL_API_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const server = http.createServer((req, res) => {
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

      const messages = [
        { role: 'system', content: payload.system },
        ...payload.messages
      ];

      const data = JSON.stringify({
        model: 'mistral-small-latest',
        max_tokens: 1000,
        messages: messages
      });

      const options = {
        hostname: 'api.mistral.ai',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const apiReq = https.request(options, apiRes => {
        let result = '';
        apiRes.on('data', chunk => { result += chunk; });
        apiRes.on('end', () => {
          try {
            const parsed = JSON.parse(result);
            // Vérification défensive de la structure
            if (!parsed.choices || !parsed.choices[0] || !parsed.choices[0].message) {
              res.writeHead(500, CORS_HEADERS);
              res.end(JSON.stringify({ error: 'Unexpected Mistral response', raw: result }));
              return;
            }
            const text = parsed.choices[0].message.content;
            // Retourner au format attendu par le frontend
            res.writeHead(200, CORS_HEADERS);
            res.end(JSON.stringify({ content: [{ text: text }] }));
          } catch(e) {
            res.writeHead(500, CORS_HEADERS);
            res.end(JSON.stringify({ error: 'Parse error: ' + e.message, raw: result.substring(0, 500) }));
          }
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
  console.log(`Clartée backend (Mistral) running on port ${PORT}`);
});
