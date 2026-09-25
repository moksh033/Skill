# ============================================================
# SINGLE SHARED MONGODB CONNECTION
# ============================================================
# Every role (staff / engineer / team lead / admin) reads and writes
# the SAME collections in the SAME database. In the original code,
# the "Team Lead" file connected to a totally different database
# ("MyDB" + "service_requests") than everyone else ("hospital_support"
# + "requests") — so requests created by staff were invisible to the
# team lead, and anything the team lead did was invisible to admin.
# That is fixed by having exactly one connection module, imported
# everywhere.
#
# The MONGO_URL is read from environment variables so it works both
# locally (mongodb://localhost:27017/) and in production on Render
# with MongoDB Atlas (mongodb+srv://...).

import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")

client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
db = client["hospital_support"]

user_collection = db["users"]
department_collection = db["departments"]
category_collection = db["categories"]
request_collection = db["requests"]
comments_collection = db["comments"]
audit_collection = db["audit_logs"]
