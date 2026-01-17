"""
Sam Agent 2.0 - Entry Point

Run with: uvicorn main:app --reload --port 8080
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the FastAPI app
from src.api.main import app

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8080"))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
