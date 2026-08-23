from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import pymongo

complaint_indexes = [
    pymongo.IndexModel([("user_id", pymongo.ASCENDING)]),
    pymongo.IndexModel([("status", pymongo.ASCENDING)]),
    pymongo.IndexModel([("created_at", pymongo.DESCENDING)])
]
