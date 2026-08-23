import urllib.request
import urllib.parse
import json
import time
import subprocess
import os

# Start backend
print("Starting backend...")
proc = subprocess.Popen(["venv\\Scripts\\python.exe", "-m", "uvicorn", "app.main:app", "--port", "8009"], cwd=".")
time.sleep(30)  # Wait for startup with ML models

def req(method, url, token=None, data=None):
    req = urllib.request.Request("http://127.0.0.1:8009" + url, method=method)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if data:
        req.add_header("Content-Type", "application/json")
        req.data = json.dumps(data).encode("utf-8")
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

try:
    print("TEST: Register Citizen")
    st, res = req("POST", "/api/auth/register", data={"name":"Citizen Test","email":"testcit99@u.com","password":"Password123!","phone":"1234567890","city":"City"})
    print(st, res)

    print("TEST: Login Citizen")
    st, res = req("POST", "/api/auth/login", data={"email":"testcit99@u.com","password":"Password123!"})
    if st != 200:
        print("Login failed", res)
        exit(1)
    cit_token = res["access_token"]
    print("Citizen Token obtained")

    print("TEST A: Citizen creates complaint")
    st, res = req("POST", "/api/complaints/", token=cit_token, data={
        "category": "Pothole",
        "description": "Big pothole",
        "location": {"latitude": 11.0, "longitude": 76.0}
    })
    print("Create:", st)
    comp_id = res["id"]

    print("TEST B: Citizen gets own complaints")
    st, res = req("GET", "/api/complaints/my", token=cit_token)
    print("Get My:", st, len(res))

    print("TEST C: Citizen gets specific complaint")
    st, res = req("GET", f"/api/complaints/{comp_id}", token=cit_token)
    print("Get One:", st, res["category"])

    print("TEST: Login Admin")
    # Using the seeded admin from previous step
    st, res = req("POST", "/api/auth/login", data={"email":"admin@urbanmind.ai","password":"admin123"})
    if st == 200:
        admin_token = res["access_token"]
        print("Admin Token obtained")
        
        print("TEST D: Citizen attempts admin list")
        st, _ = req("GET", "/api/complaints/", token=cit_token)
        print("Citizen -> Admin List:", st)

        print("TEST E: Citizen attempts status update")
        st, _ = req("PATCH", f"/api/complaints/{comp_id}/status", token=cit_token, data={"status":"In Progress"})
        print("Citizen -> Status Update:", st)

        print("TEST F: Admin gets all complaints")
        st, res = req("GET", "/api/complaints/", token=admin_token)
        print("Admin List:", st, len(res))

        print("TEST F2: Admin gets filtered complaints")
        st, res = req("GET", "/api/complaints/?status=Pending&category=Pothole", token=admin_token)
        print("Admin Filtered List:", st, len(res))

        print("TEST F3: Admin gets stats")
        st, res = req("GET", "/api/admin/dashboard/stats", token=admin_token)
        print("Admin Stats:", st, res)
        
        print("TEST F4: Citizen attempts stats (Expected 403)")
        st, _ = req("GET", "/api/admin/dashboard/stats", token=cit_token)
        print("Citizen Stats:", st)

        print("TEST G: Admin changes status")
        st, res = req("PATCH", f"/api/complaints/{comp_id}/status", token=admin_token, data={"status":"In Progress"})
        print("Admin Status Update:", st, res["status"])
        
        print("TEST G2: Admin history appended")
        st, res = req("GET", f"/api/complaints/{comp_id}", token=admin_token)
        print("Status History length:", len(res.get("status_history", [])))
        
        print("TEST G3: Invalid transition (Expected 400)")
        st, res = req("PATCH", f"/api/complaints/{comp_id}/status", token=admin_token, data={"status":"Pending"})
        print("Invalid Transition:", st)
    else:
        print("Could not login admin, skipping admin tests")
        
    print("TEST H: Upload Image Valid JPEG")
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        f.write(b"\xff\xd8\xff\xe0" + b"\x00" * 100) # Fake JPEG
        test_img = f.name
    
    # Simple form data uploader using urllib
    import mimetypes
    boundary = "wL36Yn8afVp8Ag7AmP8qZ0SA4n1v9T"
    body = (
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"file\"; filename=\"test.jpg\"\r\n"
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode()
    with open(test_img, "rb") as f:
        body += f.read()
    body += f"\r\n--{boundary}--\r\n".encode()

    req_img = urllib.request.Request(f"http://127.0.0.1:8005/api/complaints/{comp_id}/image", method="POST", data=body)
    req_img.add_header("Authorization", f"Bearer {cit_token}")
    req_img.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req_img.add_header("Content-Length", len(body))
    
    try:
        with urllib.request.urlopen(req_img) as response:
            res_img = json.loads(response.read().decode())
            print("Upload JPG:", response.status, res_img.get("image_url"))
    except urllib.error.HTTPError as e:
        print("Upload JPG Failed:", e.code, e.read().decode())
        
    print("TEST I: Get Stored Image Static Route")
    try:
        req_static = urllib.request.Request("http://127.0.0.1:8005" + res_img["image_url"], method="GET")
        with urllib.request.urlopen(req_static) as response:
            print("Static Get:", response.status)
    except Exception as e:
        print("Static Get Failed:", e)

    print("TEST J: Invalid Type Upload")
    body_txt = (
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r\n"
        f"Content-Type: text/plain\r\n\r\n"
        "hello"
        f"\r\n--{boundary}--\r\n"
    ).encode()
    req_txt = urllib.request.Request(f"http://127.0.0.1:8005/api/complaints/{comp_id}/image", method="POST", data=body_txt)
    req_txt.add_header("Authorization", f"Bearer {cit_token}")
    req_txt.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    try:
        urllib.request.urlopen(req_txt)
    except urllib.error.HTTPError as e:
        print("Upload TXT (Expected 400):", e.code)

        
finally:
    proc.terminate()
    proc.wait()
