import asyncio
import os
import sys
import unittest
from datetime import datetime, timezone
from bson import ObjectId

backend_path = os.path.abspath("backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.database.connection import connect_to_mongo, close_mongo_connection, db_instance
from app.core.security import hash_password
from app.routes.complaints import (
    create_complaint,
    assign_complaint,
    get_all_complaints,
    get_complaint,
    update_complaint_status,
    get_user_department_identifiers
)
from app.schemas.complaint import ComplaintCreate, ComplaintAssign, ComplaintUpdate, LocationSchema
from fastapi import HTTPException


class TestWasteAssignmentFlow(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        await connect_to_mongo()

        # Ensure Waste Management department exists
        self.wm_dept = await db_instance.db.departments.find_one({"name": "Waste Management"})
        if not self.wm_dept:
            res = await db_instance.db.departments.insert_one({
                "name": "Waste Management",
                "description": "Handles garbage collection and street cleaning.",
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            })
            self.wm_dept = await db_instance.db.departments.find_one({"_id": res.inserted_id})
        self.wm_dept_id = str(self.wm_dept["_id"])

        # Ensure Sanitation department exists
        self.san_dept = await db_instance.db.departments.find_one({"name": "Sanitation"})
        if not self.san_dept:
            res = await db_instance.db.departments.insert_one({
                "name": "Sanitation",
                "description": "Handles drainage and sanitation issues.",
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            })
            self.san_dept = await db_instance.db.departments.find_one({"_id": res.inserted_id})
        self.san_dept_id = str(self.san_dept["_id"])

        # Create test users
        self.admin_user = {
            "id": "6a9a9cbccf3016b07b9f9c01",
            "name": "Admin Official",
            "email": "admin_test@urbanmind.ai",
            "role": "admin"
        }

        self.citizen_user = {
            "id": "6a9a9cbccf3016b07b9f9c02",
            "name": "Citizen One",
            "email": "cit_flow_test@urbanmind.ai",
            "role": "citizen"
        }

        # Waste Management Users (Standard, Short name, Team name, and Inferred from Email)
        self.wm_user_standard = {
            "id": "6a9a9cbccf3016b07b9f9c10",
            "name": "Waste Manager",
            "email": "wm_std@urbanmind.ai",
            "role": "department",
            "department": "Waste Management"
        }

        self.wm_user_short = {
            "id": "6a9a9cbccf3016b07b9f9c11",
            "name": "Waste Officer",
            "email": "wm_short@urbanmind.ai",
            "role": "department",
            "department": "waste"
        }

        self.wm_user_team = {
            "id": "6a9a9cbccf3016b07b9f9c12",
            "name": "Waste Management Team",
            "email": "wm_team@urbanmind.ai",
            "role": "department",
            "department": "Waste Management Team"
        }

        self.wm_user_inferred = {
            "id": "6a9a9cbccf3016b07b9f9c13",
            "name": "Waste Supervisor",
            "email": "waste@urbanmind.ai",
            "role": "department",
            "department": None
        }

        # Sanitation Department User
        self.san_user = {
            "id": "6a9a9cbccf3016b07b9f9c20",
            "name": "Sanitation Officer",
            "email": "san_test@urbanmind.ai",
            "role": "department",
            "department": "Sanitation"
        }

        self.created_complaint_ids = []

    async def asyncTearDown(self):
        if self.created_complaint_ids:
            await db_instance.db.complaints.delete_many({
                "_id": {"$in": [ObjectId(cid) for cid in self.created_complaint_ids]}
            })
        await close_mongo_connection()

    async def test_admin_assign_garbage_and_wm_visibility(self):
        """Test admin assigns a Garbage complaint to Waste Management and WM sees it."""
        # 1. Citizen creates Garbage complaint
        complaint_in = ComplaintCreate(
            category="Garbage",
            description="Severe garbage overflow near bus stand",
            location=LocationSchema(
                latitude=11.0168,
                longitude=76.9558,
                address="Gandhipuram, Coimbatore"
            )
        )
        created = await create_complaint(complaint_in, current_user=self.citizen_user)
        cid = created["id"]
        self.created_complaint_ids.append(cid)
        self.assertEqual(created["category"], "Garbage")
        self.assertEqual(created["status"], "Pending")

        # 2. Admin assigns complaint to Waste Management
        assign_in = ComplaintAssign(department_id=self.wm_dept_id)
        assigned = await assign_complaint(cid, assign_in, current_admin=self.admin_user)
        self.assertEqual(assigned["assigned_department"], self.wm_dept_id)
        self.assertEqual(assigned["assigned_department_name"], "Waste Management")

        # 3. Waste Management department user fetches complaints
        wm_list = await get_all_complaints(current_user=self.wm_user_standard)
        wm_ids = [c["id"] for c in wm_list]
        self.assertIn(cid, wm_ids, "Waste Management user must see the assigned Garbage complaint")

        # 4. Short-name 'waste' department user also sees it
        wm_short_list = await get_all_complaints(current_user=self.wm_user_short)
        self.assertIn(cid, [c["id"] for c in wm_short_list])

        # 5. Team-name 'Waste Management Team' department user also sees it
        wm_team_list = await get_all_complaints(current_user=self.wm_user_team)
        self.assertIn(cid, [c["id"] for c in wm_team_list])

        # 6. User with department=None but email='waste@urbanmind.ai' also sees it
        wm_inf_list = await get_all_complaints(current_user=self.wm_user_inferred)
        self.assertIn(cid, [c["id"] for c in wm_inf_list])

    async def test_cross_department_isolation(self):
        """Test that another department cannot see or update the Waste Management complaint."""
        # 1. Citizen creates Garbage complaint
        complaint_in = ComplaintCreate(
            category="Garbage",
            description="Garbage dump blocking alleyway",
            location=LocationSchema(
                latitude=11.0200,
                longitude=76.9600,
                address="Peelamedu, Coimbatore"
            )
        )
        created = await create_complaint(complaint_in, current_user=self.citizen_user)
        cid = created["id"]
        self.created_complaint_ids.append(cid)

        # 2. Admin assigns to Waste Management
        assign_in = ComplaintAssign(department_id=self.wm_dept_id)
        await assign_complaint(cid, assign_in, current_admin=self.admin_user)

        # 3. Sanitation department fetches complaints -> must NOT contain this complaint
        san_list = await get_all_complaints(current_user=self.san_user)
        san_ids = [c["id"] for c in san_list]
        self.assertNotIn(cid, san_ids, "Sanitation must NOT see Waste Management complaints")

        # 4. Sanitation attempts to view complaint details -> must return 403
        with self.assertRaises(HTTPException) as ctx:
            await get_complaint(cid, current_user=self.san_user)
        self.assertEqual(ctx.exception.status_code, 403)

        # 5. Sanitation attempts to update status -> must return 403
        with self.assertRaises(HTTPException) as ctx:
            await update_complaint_status(cid, ComplaintUpdate(status="In Progress"), current_user=self.san_user)
        self.assertEqual(ctx.exception.status_code, 403)

        # 6. Waste Management user updates status -> must succeed
        updated = await update_complaint_status(cid, ComplaintUpdate(status="In Progress"), current_user=self.wm_user_standard)
        self.assertEqual(updated["status"], "In Progress")

    async def test_duplicate_complaint_visibility_and_assignment(self):
        """Test duplicate complaints assigned to Waste Management are visible and properly authorized."""
        # 1. Create primary Garbage complaint
        primary_in = ComplaintCreate(
            category="Garbage",
            description="Cluster primary: Garbage pile",
            location=LocationSchema(
                latitude=11.0250,
                longitude=76.9700,
                address="Ramanathapuram, Coimbatore"
            )
        )
        primary = await create_complaint(primary_in, current_user=self.citizen_user)
        pid = primary["id"]
        self.created_complaint_ids.append(pid)

        # 2. Admin assigns primary complaint to Waste Management
        await assign_complaint(pid, ComplaintAssign(department_id=self.wm_dept_id), current_admin=self.admin_user)

        # 3. Citizen 2 submits duplicate complaint
        dup_res = await db_instance.db.complaints.insert_one({
            "category": "Garbage",
            "description": "Cluster duplicate report",
            "location": {"latitude": 11.0250, "longitude": 76.9700, "address": "Ramanathapuram, Coimbatore"},
            "user_id": str(self.citizen_user["id"]),
            "status": "In Progress",
            "is_primary": False,
            "is_duplicate": True,
            "duplicate_of": pid,
            "assigned_department": self.wm_dept_id,
            "assigned_department_name": "Waste Management",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })
        did = str(dup_res.inserted_id)
        self.created_complaint_ids.append(did)

        # 4. Waste Management queries all complaints -> duplicate must be visible
        wm_list = await get_all_complaints(current_user=self.wm_user_standard)
        wm_ids = [c["id"] for c in wm_list]
        self.assertIn(did, wm_ids, "Duplicate complaint assigned to Waste Management must be in portal")

        # 5. Waste Management can view duplicate details
        dup_view = await get_complaint(did, current_user=self.wm_user_standard)
        self.assertEqual(dup_view["id"], did)

        # 6. Sanitation cannot view duplicate details
        with self.assertRaises(HTTPException) as ctx:
            await get_complaint(did, current_user=self.san_user)
        self.assertEqual(ctx.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
