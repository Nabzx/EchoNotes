from redis import Redis

import os 
from dotenv import load_dotenv 

load_dotenv()

REDIS_HOST = os.getenv("REDIS_HOST","localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT","6379"))
REDIS_DB = int(os.getenv("REDIS_DB","0"))

redis_client = Redis(host=REDIS_HOST,
                     port=REDIS_PORT,
                     db=REDIS_DB,
                     decode_responses= False, #keep bytes; we'll decode manually
                     ) 
