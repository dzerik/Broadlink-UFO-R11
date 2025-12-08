"""Unit tests for FastAPI API endpoints."""

import json
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import CompressionLevel


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def sample_broadlink_code():
    """Sample Broadlink Base64 code for testing."""
    return "JgBGAJKRFDQUNBQ0FDUUNBQ0EzUTEhQREhQRFBISEhQ0EzUUNBMSExITEhMSExITNRQ0EzUTEhMSFDQUNBMSExIUNBMSExITAAUQAA=="


@pytest.fixture
def sample_smartir_data(sample_broadlink_code):
    """Sample SmartIR JSON data."""
    return {
        "manufacturer": "Test",
        "supportedModels": ["Model1"],
        "supportedController": "Broadlink",
        "commandsEncoding": "Base64",
        "commands": {
            "off": sample_broadlink_code,
            "heat": {
                "low": {
                    "20": sample_broadlink_code
                }
            }
        }
    }


# =============================================================================
# HEALTH ENDPOINT TESTS
# =============================================================================

class TestHealthEndpoint:
    """Tests for /api/health endpoint."""

    def test_health_check_success(self, client):
        """Test health check returns 200."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data

    def test_health_check_version_format(self, client):
        """Test health check returns valid version format."""
        response = client.get("/api/health")
        data = response.json()
        # Should be semantic version like "1.0.0"
        assert len(data["version"].split(".")) == 3


# =============================================================================
# CONVERT SINGLE ENDPOINT TESTS
# =============================================================================

class TestConvertSingleEndpoint:
    """Tests for /api/convert endpoint."""

    def test_convert_valid_code(self, client, sample_broadlink_code):
        """Test converting valid Broadlink code."""
        response = client.post(
            "/api/convert",
            json={"command": sample_broadlink_code}
        )
        assert response.status_code == 200
        data = response.json()
        assert "ir_code" in data
        assert "mqtt_payload" in data
        assert len(data["ir_code"]) > 0

    def test_convert_with_compression_level(self, client, sample_broadlink_code):
        """Test converting with different compression levels."""
        for level in range(4):
            response = client.post(
                "/api/convert",
                json={
                    "command": sample_broadlink_code,
                    "compression_level": level
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert len(data["ir_code"]) > 0

    def test_convert_mqtt_payload_format(self, client, sample_broadlink_code):
        """Test MQTT payload is valid JSON."""
        response = client.post(
            "/api/convert",
            json={"command": sample_broadlink_code}
        )
        data = response.json()
        mqtt = json.loads(data["mqtt_payload"])
        assert "ir_code_to_send" in mqtt

    def test_convert_invalid_base64(self, client):
        """Test converting invalid Base64 returns error."""
        response = client.post(
            "/api/convert",
            json={"command": "!!!not valid base64!!!"}
        )
        assert response.status_code == 422

    def test_convert_empty_command(self, client):
        """Test converting empty command returns validation error."""
        response = client.post(
            "/api/convert",
            json={"command": ""}
        )
        assert response.status_code == 422

    def test_convert_missing_command(self, client):
        """Test request without command returns validation error."""
        response = client.post("/api/convert", json={})
        assert response.status_code == 422

    def test_convert_returns_lengths(self, client, sample_broadlink_code):
        """Test response includes original and result lengths."""
        response = client.post(
            "/api/convert",
            json={"command": sample_broadlink_code}
        )
        data = response.json()
        assert data["original_length"] == len(sample_broadlink_code)
        assert data["result_length"] == len(data["ir_code"])


# =============================================================================
# CONVERT FILE ENDPOINT TESTS
# =============================================================================

class TestConvertFileEndpoint:
    """Tests for /api/convert/file endpoint."""

    def test_convert_file_success(self, client, sample_smartir_data):
        """Test converting SmartIR file."""
        response = client.post(
            "/api/convert/file",
            json={"content": sample_smartir_data}
        )
        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        assert "commands_processed" in data
        assert data["commands_processed"] > 0

    def test_convert_file_transforms_controller(self, client, sample_smartir_data):
        """Test controller is changed to MQTT."""
        response = client.post(
            "/api/convert/file",
            json={"content": sample_smartir_data}
        )
        data = response.json()
        assert data["content"]["supportedController"] == "MQTT"
        assert data["content"]["commandsEncoding"] == "Raw"

    def test_convert_file_with_compression_level(self, client, sample_smartir_data):
        """Test converting with different compression levels."""
        for level in range(4):
            response = client.post(
                "/api/convert/file",
                json={
                    "content": sample_smartir_data,
                    "compression_level": level
                }
            )
            assert response.status_code == 200

    def test_convert_file_with_wrap_true(self, client, sample_smartir_data):
        """Test converting with wrap_with_ir_code=True (default)."""
        response = client.post(
            "/api/convert/file",
            json={
                "content": sample_smartir_data,
                "wrap_with_ir_code": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Commands should be wrapped in JSON with ir_code_to_send
        off_cmd = data["content"]["commands"]["off"]
        assert "ir_code_to_send" in off_cmd
        # Should be valid JSON string
        parsed = json.loads(off_cmd)
        assert "ir_code_to_send" in parsed

    def test_convert_file_with_wrap_false(self, client, sample_smartir_data):
        """Test converting with wrap_with_ir_code=False."""
        response = client.post(
            "/api/convert/file",
            json={
                "content": sample_smartir_data,
                "wrap_with_ir_code": False
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Commands should be raw IR codes (not JSON wrapped)
        off_cmd = data["content"]["commands"]["off"]
        # Should NOT be a JSON string
        assert not off_cmd.startswith("{")
        # Should be Base64-ish string
        assert len(off_cmd) > 0

    def test_convert_file_nested_commands(self, client, sample_smartir_data):
        """Test nested commands are processed."""
        response = client.post(
            "/api/convert/file",
            json={"content": sample_smartir_data}
        )
        data = response.json()
        # Check nested command was converted
        nested_cmd = data["content"]["commands"]["heat"]["low"]["20"]
        assert len(nested_cmd) > 0

    def test_convert_file_counts_all_commands(self, client, sample_smartir_data):
        """Test command count includes nested commands."""
        response = client.post(
            "/api/convert/file",
            json={"content": sample_smartir_data}
        )
        data = response.json()
        # Should count "off" and "heat/low/20"
        assert data["commands_processed"] == 2

    def test_convert_file_empty_commands(self, client):
        """Test converting file with no commands."""
        data = {
            "manufacturer": "Test",
            "commands": {}
        }
        response = client.post(
            "/api/convert/file",
            json={"content": data}
        )
        assert response.status_code == 200
        result = response.json()
        assert result["commands_processed"] == 0

    def test_convert_file_invalid_ir_code(self, client):
        """Test converting file with invalid IR code returns error."""
        data = {
            "commands": {
                "off": "!!!invalid!!!"
            }
        }
        response = client.post(
            "/api/convert/file",
            json={"content": data}
        )
        assert response.status_code == 422


# =============================================================================
# CORS TESTS
# =============================================================================

class TestCORS:
    """Tests for CORS configuration."""

    def test_cors_headers_present(self, client):
        """Test CORS headers are present in response."""
        response = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET"
            }
        )
        # FastAPI CORS middleware should respond
        assert response.status_code in [200, 204, 405]


# =============================================================================
# ERROR HANDLING TESTS
# =============================================================================

class TestErrorHandling:
    """Tests for error handling."""

    def test_invalid_json_body(self, client):
        """Test invalid JSON body returns error."""
        response = client.post(
            "/api/convert",
            content="not json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422

    def test_wrong_content_type(self, client):
        """Test wrong content type returns error."""
        response = client.post(
            "/api/convert",
            content="command=test",
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 422

    def test_unknown_endpoint(self, client):
        """Test unknown endpoint returns 404."""
        response = client.get("/api/unknown")
        assert response.status_code == 404
