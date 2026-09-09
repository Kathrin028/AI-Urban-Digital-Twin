
import urllib.request, json
req_login = urllib.request.Request('https://ai-urban-digital-twin-backend.onrender.com/api/auth/login', data=json.dumps({'email':'admin@urbanmind.ai','password':'AdminSecurePassword123!'}).encode(), headers={'Content-Type': 'application/json'})
res_login = urllib.request.urlopen(req_login)
data = json.loads(res_login.read().decode())
token = data['access_token']
print('Token:', token)

req_me = urllib.request.Request('https://ai-urban-digital-twin-backend.onrender.com/api/auth/me', headers={'Authorization': 'Bearer ' + token})
try:
    res_me = urllib.request.urlopen(req_me)
    print('Me:', res_me.read().decode())
except Exception as e:
    print('Error:', e)

