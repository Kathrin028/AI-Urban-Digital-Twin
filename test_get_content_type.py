
import urllib.request
req = urllib.request.Request('https://ai-urban-digital-twin-backend.onrender.com/api/auth/me', headers={'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTlmOWE5MDdjNTdkYWVmNjE5MzU0NGIiLCJleHAiOjE3ODg4NjUzMjN9.iMmjAYCiwBbrfjN9PPPN0A-xMGwSaWJKr6tYByyWSHI', 'Content-Type': 'application/json'})
try:
    print(urllib.request.urlopen(req).read().decode())
except Exception as e:
    print('Error:', e)

