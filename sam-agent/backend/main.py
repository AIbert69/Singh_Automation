"""
Sam Agent 2.0 Entry Point
Run with: uvicorn main:app --reload
"""

import uvicorn
from src.api.main import app

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="info"
    )
