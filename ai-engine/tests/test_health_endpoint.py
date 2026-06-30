"""
Unit tests for the /health GET endpoint in app.py.

conftest.py stubs sentence_transformers and sets _fallback_active = True,
so the endpoint returns 'deterministic_fallback' for embedding_model in tests.
"""
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


class TestHealthEndpoint:

    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_json(self):
        response = client.get("/health")
        assert response.headers["content-type"] == "application/json"

    def test_health_status_field_is_ok(self):
        response = client.get("/health")
        data = response.json()
        assert "status" in data
        assert data["status"] == "ok"

    def test_health_embedding_model_field_present(self):
        response = client.get("/health")
        data = response.json()
        assert "embedding_model" in data
        assert isinstance(data["embedding_model"], str)

    def test_health_embedding_model_is_deterministic_fallback_in_stubbed_env(self):
        """conftest.py stubs sentence_transformers and sets _fallback_active = True."""
        response = client.get("/health")
        data = response.json()
        assert data["embedding_model"] == "deterministic_fallback"

    def test_health_response_is_dict(self):
        response = client.get("/health")
        data = response.json()
        assert isinstance(data, dict)

    def test_health_status_field_is_string(self):
        response = client.get("/health")
        data = response.json()
        assert isinstance(data["status"], str)

    def test_health_embedding_model_field_is_string(self):
        response = client.get("/health")
        data = response.json()
        assert isinstance(data["embedding_model"], str)

    def test_health_requires_no_authentication(self):
        """The /health endpoint should not require x-api-key header."""
        # Send request without any authentication headers
        response = client.get("/health")
        # Should succeed without needing authentication
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_health_does_not_return_error_with_accept_header(self):
        """Should work with standard accept headers."""
        response = client.get("/health", headers={"Accept": "application/json"})
        assert response.status_code == 200

    def test_health_response_contains_only_expected_keys(self):
        """Health endpoint returns a minimal, well-defined response shape."""
        response = client.get("/health")
        data = response.json()
        keys = set(data.keys())
        assert keys == {"status", "embedding_model"}, f"Expected only status and embedding_model, got {keys}"
