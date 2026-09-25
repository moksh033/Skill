# ============================================================
# HOSPITAL SUPPORT REQUEST SYSTEM — MAIN APP
# ============================================================
# There is exactly ONE FastAPI() instance in the whole project.
# The original code created three separate `app = FastAPI(...)`
# objects across the pasted-together files; each reassignment
# effectively orphaned the routes that had already been attached
# to the previous object, so most of the staff/engineer endpoints
# never actually mounted. Every role here is a router included
# into this single app instead.
#
# Run with:  uvicorn main:app --reload

import os
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import admin_routes
import auth_routes
import engineer_routes
import staff_routes
import teamlead_routes
from auth import hash_password
from constants import (
    ROLE_ADMIN,
    ROLE_STAFF,
    ROLE_SUPPORT_ENGINEER,
    ROLE_TEAM_LEAD,
)
from database import category_collection, department_collection, request_collection, user_collection

load_dotenv()

app = FastAPI(
    title="Hospital Support Request System",
    description="Staff -> Support Engineer -> Team Lead -> Admin escalation workflow",
    version="1.0.0",
)

# ---- CORS — reads allowed origins from env, defaults to permissive for dev ----
cors_origins_str = os.getenv("CORS_ORIGINS", "*")
if cors_origins_str == "*":
    cors_origins = ["*"]
else:
    cors_origins = [o.strip() for o in cors_origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Include all routers ----
app.include_router(auth_routes.router)
app.include_router(staff_routes.router)
app.include_router(engineer_routes.router)
app.include_router(teamlead_routes.router)
app.include_router(admin_routes.router)


@app.get("/")
def home():
    return {"message": "Hospital Support Request System", "status": "running"}


# ------------------------------------------------------------
# Sample data
# ------------------------------------------------------------
def initialize_sample_data():
    # Users — now include hashed passwords so JWT login works out of the box.
    # Default password for all seeded users is "password123"
    default_password = hash_password("password123")

    if user_collection.find_one({"user_id": "ENG205"}) is None:
        user_collection.insert_one(
            {
                "user_id": "ENG205",
                "name": "Arun Kumar",
                "username": "arun",
                "password": default_password,
                "role": ROLE_SUPPORT_ENGINEER,
                "department": "Biomedical Engineering",
            }
        )

    if user_collection.find_one({"user_id": "ENG210"}) is None:
        user_collection.insert_one(
            {
                "user_id": "ENG210",
                "name": "Vijay Kumar",
                "username": "vijay",
                "password": default_password,
                "role": ROLE_SUPPORT_ENGINEER,
                "department": "IT Systems",
            }
        )

    if user_collection.find_one({"user_id": "ENG215"}) is None:
        user_collection.insert_one(
            {
                "user_id": "ENG215",
                "name": "Priya Sharma",
                "username": "priya",
                "password": default_password,
                "role": ROLE_SUPPORT_ENGINEER,
                "department": "Facilities & HVAC",
            }
        )

    if user_collection.find_one({"user_id": "TL001"}) is None:
        user_collection.insert_one(
            {
                "user_id": "TL001",
                "name": "Marcus Vance",
                "username": "marcus",
                "password": default_password,
                "role": ROLE_TEAM_LEAD,
                "department": "Hospital Support Desk",
            }
        )

    if user_collection.find_one({"user_id": "ADM001"}) is None:
        user_collection.insert_one(
            {
                "user_id": "ADM001",
                "name": "Dr. Sarah Jenkins",
                "username": "admin",
                "password": default_password,
                "role": ROLE_ADMIN,
                "department": "Hospital Operations",
            }
        )

    if user_collection.find_one({"user_id": "STF101"}) is None:
        user_collection.insert_one(
            {
                "user_id": "STF101",
                "name": "Nurse Elena Rostova",
                "username": "elena",
                "password": default_password,
                "role": ROLE_STAFF,
                "department": "ICU",
            }
        )

    # Departments
    departments_to_seed = [
        {"name": "Nursing", "description": "Inpatient and surgical nursing wards"},
        {"name": "ICU", "description": "Intensive Care Unit & Critical Care monitors"},
        {"name": "Radiology", "description": "MRI, CT Scanner, and Digital X-Ray suites"},
        {"name": "Emergency", "description": "Trauma bays, resuscitation & triage"},
        {"name": "Cardiology", "description": "Cath lab, telemetry, and ECG monitoring"},
        {"name": "Pathology", "description": "Central diagnostics and specimen analysis"},
    ]
    for dept in departments_to_seed:
        if department_collection.find_one({"name": dept["name"]}) is None:
            department_collection.insert_one(
                {"name": dept["name"], "description": dept["description"], "created_at": datetime.utcnow()}
            )

    # Categories
    categories_to_seed = [
        {"name": "EQUIPMENT_ISSUE", "description": "Diagnostic and life-support biomedical hardware defects"},
        {"name": "MAINTENANCE", "description": "Preventive inspection, calibration, and routine service"},
        {"name": "IT_ISSUE", "description": "EMR workstations, PACS imaging network, and clinical software"},
        {"name": "FACILITY_REQUEST", "description": "Medical gases, backup power, sterile HVAC, and lighting"},
    ]
    for cat in categories_to_seed:
        if category_collection.find_one({"name": cat["name"]}) is None:
            category_collection.insert_one(
                {"name": cat["name"], "description": cat["description"], "created_at": datetime.utcnow()}
            )

    if request_collection.find_one({"request_id": "REQ101"}) is None:
        request_collection.insert_one(
            {
                "request_id": "REQ101",
                "title": "Ventilator flow sensor failure",
                "description": "ICU Bay 4 ventilator displaying pressure sensor error code E-42.",
                "category": "EQUIPMENT_ISSUE",
                "department": "ICU",
                "priority": "HIGH",
                "status": "NEW",
                "assigned_to": None,
                "assigned_by": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )

    if request_collection.find_one({"request_id": "REQ102"}) is None:
        request_collection.insert_one(
            {
                "request_id": "REQ102",
                "title": "PACS imaging workstation offline",
                "description": "Terminal 2 unable to pull DICOM scans from CT server.",
                "category": "IT_ISSUE",
                "department": "Radiology",
                "priority": "CRITICAL",
                "status": "ASSIGNED",
                "assigned_to": "ENG210",
                "assigned_by": "TEAM_LEAD",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )

    if request_collection.find_one({"request_id": "REQ103"}) is None:
        request_collection.insert_one(
            {
                "request_id": "REQ103",
                "title": "Defibrillator battery calibration required",
                "description": "Crash cart 3 routine 6-month battery impedance and discharge check.",
                "category": "MAINTENANCE",
                "department": "Emergency",
                "priority": "MEDIUM",
                "status": "IN_PROGRESS",
                "assigned_to": "ENG205",
                "assigned_by": "TEAM_LEAD",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )


@app.on_event("startup")
def on_startup():
    try:
        initialize_sample_data()
        print("Database initialized with sample data successfully.")
    except Exception as e:
        print(f"Warning: Sample data initialization skipped or failed: {e}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
