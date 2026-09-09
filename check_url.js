
const https = require('https');
https.get('https://ai-urban-digital-twin.vercel.app/assets/index-BMqVuNpo.js', (res) => {
  let code = '';
  res.on('data', (d) => { code += d; });
  res.on('end', () => {
    const matches = code.match(/https?:\/\/[^\"\'\]+/g) || [];
    console.log([...new Set(matches.filter(m => m.includes('render.com')))]);
  });
});

