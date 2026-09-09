const formData = new FormData();
formData.append('test', '123');

fetch('http://localhost:8000/api', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: formData
}).catch(e => console.error(e));
