from fastapi import FastAPI, File, UploadFile
import uvicorn

app = FastAPI()

@app.post("/analyze-image")
async def analyze(file: UploadFile = File(...)):
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8099)
