
const https = require('https');
https.get('https://ai-urban-digital-twin.vercel.app/', (res) => {
  let html = '';
  res.on('data', (d) => { html += d; });
  res.on('end', () => {
    const scripts = html.match(/src=\"\/assets\/[^\"]+\"/g) || [];
    scripts.forEach((s) => {
      const src = s.replace(/src=\"|\"/g, '');
      https.get('https://ai-urban-digital-twin.vercel.app' + src, (res2) => {
        let code = '';
        res2.on('data', (d) => { code += d; });
        res2.on('end', () => {
          if (code.includes('urbanmind_token')) {
            console.log('\n--- FOUND IN', src, '---');
            const idx = code.indexOf('urbanmind_token');
            console.log(code.substring(Math.max(0, idx - 150), idx + 150));
          }
          if (code.includes('clearToken')) {
            console.log('\n--- clearToken FOUND IN', src, '---');
            const idx = code.indexOf('clearToken');
            console.log(code.substring(Math.max(0, idx - 150), idx + 250));
          }
        });
      });
    });
  });
});

