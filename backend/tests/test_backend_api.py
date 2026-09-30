"""
Integration Tests for FastAPI Backend API Endpoints & Services.
"""
from fastapi.testclient import TestClient
from backend.app.main import app
from database.seed.seed_data import seed_database


def run_all_tests():
    # Explicitly ensure seed data is present for test client
    seed_database()

    with TestClient(app) as client:
        # 1. Test Auth Login
        res = client.post("/api/v1/auth/login", json={"email": "admin@apex.edu", "password": "password123"})
        assert res.status_code == 200, f"Login failed: {res.text}"
        data = res.json()
        assert "access_token" in data
        assert data["role"] == "ADMIN"
        print("[OK] Auth Login Test Passed")

        # 2. Test Data Endpoints
        r_fac = client.get("/api/v1/faculty")
        assert r_fac.status_code == 200
        assert len(r_fac.json()) >= 15
        print("[OK] Faculty Endpoint Test Passed")

        r_courses = client.get("/api/v1/courses")
        assert r_courses.status_code == 200
        assert len(r_courses.json()) >= 25
        print("[OK] Courses Endpoint Test Passed")

        r_sections = client.get("/api/v1/sections")
        assert r_sections.status_code == 200
        assert len(r_sections.json()) >= 8
        print("[OK] Sections Endpoint Test Passed")

        r_rooms = client.get("/api/v1/rooms")
        assert r_rooms.status_code == 200
        assert len(r_rooms.json()) >= 20
        print("[OK] Rooms Endpoint Test Passed")

        # 3. Test Timetable Generation and Validation
        res_gen = client.post("/api/v1/timetables/generate", json={
            "name": "Integration Test Schedule",
            "academic_term": "Fall 2026",
            "time_limit_seconds": 30.0
        })

        assert res_gen.status_code == 200, f"Generate failed: {res_gen.text}"
        gen_data = res_gen.json()
        assert "GENERATED" in str(gen_data["status"]).upper() or "OPTIMAL" in str(gen_data["status"]).upper() or "FEASIBLE" in str(gen_data["status"]).upper(), f"Unexpected status: {gen_data}"

        tt_id = gen_data["id"]
        print("[OK] Timetable Generation Test Passed")

        # Get timetable detail
        r_detail = client.get(f"/api/v1/timetables/{tt_id}")
        assert r_detail.status_code == 200
        assert len(r_detail.json()["entries"]) > 0
        print("[OK] Timetable Detail Endpoint Test Passed")

        # Validate timetable
        r_val = client.post(f"/api/v1/timetables/{tt_id}/validate")
        assert r_val.status_code == 200
        assert r_val.json()["is_valid"] is True
        print("[OK] Timetable Validation Endpoint Test Passed")

        # 4. Test Analytics
        r_dash = client.get("/api/v1/analytics/dashboard")
        assert r_dash.status_code == 200
        assert r_dash.json()["total_faculty"] >= 15
        print("[OK] Analytics Dashboard Endpoint Test Passed")

        # 5. Test Export JSON
        r_exp = client.get(f"/api/v1/export/{tt_id}/json")
        assert r_exp.status_code == 200
        assert "entries" in r_exp.json()
        print("[OK] Export JSON Endpoint Test Passed")

        print("\n==========================================")
        print("ALL BACKEND API INTEGRATION TESTS PASSED SUCCESSFULLY!")
        print("==========================================")


if __name__ == "__main__":
    run_all_tests()
