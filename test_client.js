setTimeout(() => {
  fetch('http://127.0.0.1:8099/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"file":"abc"}'
  }).then(r => r.json()).then(console.log).catch(console.error);
}, 1000);
