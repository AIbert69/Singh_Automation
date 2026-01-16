"""
Tests for FastAPI Backend
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock


# Mock database before importing app
@pytest.fixture(autouse=True)
def mock_db():
    """Mock database connection"""
    with patch("src.api.main.get_db") as mock_get_db, \
         patch("src.api.main.get_memory") as mock_get_memory:

        mock_db_instance = MagicMock()
        mock_memory_instance = MagicMock()

        mock_get_db.return_value = mock_db_instance
        mock_get_memory.return_value = mock_memory_instance

        yield mock_db_instance, mock_memory_instance


@pytest.fixture
def client():
    """Create test client"""
    from src.api.main import app
    return TestClient(app)


class TestHealthEndpoints:
    """Tests for health check endpoints"""

    def test_root_endpoint(self, client):
        """Test root endpoint returns status"""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Sam Agent 2.0"
        assert data["status"] == "operational"
        assert "timestamp" in data

    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "checks" in data


class TestOpportunitiesEndpoints:
    """Tests for opportunities endpoints"""

    def test_get_opportunities_empty(self, client, mock_db):
        """Test getting opportunities when none exist"""
        db_instance, _ = mock_db
        db_instance.get_opportunities = AsyncMock(return_value=[])

        response = client.get("/opportunities")

        assert response.status_code == 200
        data = response.json()
        assert "opportunities" in data
        assert data["count"] == 0

    def test_get_opportunities_with_filters(self, client, mock_db):
        """Test getting opportunities with filters"""
        db_instance, _ = mock_db
        sample_opps = [
            {
                "id": "123",
                "title": "Robotics Project",
                "fit_score": 75,
                "strategic_recommendation": "pursue"
            }
        ]
        db_instance.get_opportunities = AsyncMock(return_value=sample_opps)

        response = client.get("/opportunities?min_score=50&status=new")

        assert response.status_code == 200
        data = response.json()
        assert len(data["opportunities"]) == 1
        assert data["filters"]["min_score"] == 50

    def test_get_top_opportunities(self, client, mock_db):
        """Test getting top opportunities"""
        db_instance, _ = mock_db
        db_instance.get_opportunities = AsyncMock(return_value=[
            {"id": "1", "fit_score": 85},
            {"id": "2", "fit_score": 75}
        ])

        response = client.get("/opportunities/top?limit=5")

        assert response.status_code == 200
        data = response.json()
        assert "opportunities" in data

    def test_get_single_opportunity(self, client, mock_db):
        """Test getting a single opportunity"""
        db_instance, _ = mock_db
        sample_opp = {
            "id": "test-123",
            "title": "Test Opportunity",
            "agency": "DoD",
            "fit_score": 80
        }
        db_instance.get_opportunity = AsyncMock(return_value=sample_opp)

        response = client.get("/opportunities/test-123")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "test-123"

    def test_get_nonexistent_opportunity(self, client, mock_db):
        """Test getting opportunity that doesn't exist"""
        db_instance, _ = mock_db
        db_instance.get_opportunity = AsyncMock(return_value=None)

        response = client.get("/opportunities/nonexistent")

        assert response.status_code == 404

    def test_record_action(self, client, mock_db):
        """Test recording an action on an opportunity"""
        db_instance, memory_instance = mock_db
        db_instance.get_opportunity = AsyncMock(return_value={"id": "test-123"})
        db_instance.record_action = AsyncMock(return_value={"id": "action-1"})
        db_instance.update_opportunity = AsyncMock(return_value={"id": "test-123"})
        memory_instance.learn_from_action = AsyncMock()

        response = client.post(
            "/opportunities/test-123/action",
            json={"action_type": "pursued", "notes": "Good fit"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_record_invalid_action(self, client):
        """Test recording an invalid action type"""
        response = client.post(
            "/opportunities/test-123/action",
            json={"action_type": "invalid_action"}
        )

        assert response.status_code == 422  # Validation error


class TestChatEndpoint:
    """Tests for chat endpoint"""

    def test_chat_with_sam(self, client, mock_db):
        """Test chat endpoint"""
        _, memory_instance = mock_db
        memory_instance.get_context = AsyncMock(return_value={})

        with patch("src.api.main.analyzer") as mock_analyzer:
            mock_analyzer.chat = AsyncMock(return_value="Here's my analysis...")

            response = client.post(
                "/chat",
                json={"message": "What opportunities should I pursue?"}
            )

            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            assert "timestamp" in data

    def test_chat_empty_message(self, client):
        """Test chat with empty message"""
        response = client.post("/chat", json={"message": ""})

        assert response.status_code == 422


class TestScanEndpoints:
    """Tests for scan endpoints"""

    def test_trigger_scan(self, client):
        """Test manually triggering a scan"""
        response = client.post("/scan/now")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processing"

    def test_get_scan_status(self, client):
        """Test getting scan status"""
        response = client.get("/scan/status")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data


class TestMemoryEndpoints:
    """Tests for memory endpoints"""

    def test_get_memory_value(self, client, mock_db):
        """Test getting a memory value"""
        _, memory_instance = mock_db
        memory_instance.get = AsyncMock(return_value={"priorities": ["win contracts"]})

        response = client.get("/memory/priorities")

        assert response.status_code == 200
        data = response.json()
        assert data["key"] == "priorities"

    def test_set_memory_value(self, client, mock_db):
        """Test setting a memory value"""
        _, memory_instance = mock_db
        memory_instance.set = AsyncMock()

        response = client.put(
            "/memory",
            json={"key": "test_key", "value": {"data": "test"}}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestStatsEndpoint:
    """Tests for stats endpoint"""

    def test_get_stats(self, client, mock_db):
        """Test getting statistics"""
        db_instance, memory_instance = mock_db
        memory_instance.get_stats = AsyncMock(return_value={
            "total_wins": 5,
            "win_rate": 0.5
        })
        db_instance.get_opportunities = AsyncMock(return_value=[])

        response = client.get("/stats")

        assert response.status_code == 200
        data = response.json()
        assert "memory" in data
        assert "opportunities" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
