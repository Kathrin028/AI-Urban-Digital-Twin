
import jwt
from datetime import datetime, timedelta, timezone

secret = 'test-secret'
algo = 'HS256'

data = {'sub': '64e9a3a2b4f9d45e12345678'}
expire = datetime.now(timezone.utc) + timedelta(minutes=60)
data.update({'exp': expire})

token = jwt.encode(data, secret, algorithm=algo)
print('Token:', token)

try:
    decoded = jwt.decode(token, secret, algorithms=[algo])
    print('Decoded:', decoded)
except Exception as e:
    print('Error:', e)

