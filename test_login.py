
import urllib.request, json
req = urllib.request.Request('https://ai-urban-digital-twin-backend.onrender.com/api/auth/login', 
    data=json.dumps({'email':'admin@urbanmind.ai', 'password':'AdminSecurePassword123!'}).encode(),
    headers={'Content-Type': 'application/json'}
)
res = urllib.request.urlopen(req)
data = json.loads(res.read().decode())
print(json.dumps(data, indent=2))

