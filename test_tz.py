
import jwt
from datetime import datetime, timedelta, timezone

secret = 'test'
algo = 'HS256'
expire = datetime.now(timezone.utc) + timedelta(minutes=60)
data = {'sub': '123', 'exp': expire}
token = jwt.encode(data, secret, algorithm=algo)
decoded = jwt.decode(token, secret, algorithms=[algo])
print(decoded)

