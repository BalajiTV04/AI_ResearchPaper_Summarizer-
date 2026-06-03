import motor.motor_asyncio
import os
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DATABASE = os.getenv("MONGO_DATABASE", "research_summarizer")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DATABASE]

def get_db():
    return db

def str_to_id(id_str):
    return ObjectId(id_str)

def id_to_str(obj_id):
    return str(obj_id)