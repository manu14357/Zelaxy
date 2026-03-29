"""
Tests for the Zelaxy Python SDK
"""

import pytest
from unittest.mock import Mock, patch
from zelaxy import ZelaxyClient, ZelaxyError, WorkflowExecutionResult, WorkflowStatus


def test_zelaxy_client_initialization():
    """Test ZelaxyClient initialization."""
    client = ZelaxyClient(api_key="test-api-key", base_url="https://test.zelaxy.ai")
    assert client.api_key == "test-api-key"
    assert client.base_url == "https://test.zelaxy.ai"


def test_zelaxy_client_default_base_url():
    """Test ZelaxyClient with default base URL."""
    client = ZelaxyClient(api_key="test-api-key")
    assert client.api_key == "test-api-key"
    assert client.base_url == "http://localhost:3000/"


def test_set_api_key():
    """Test setting a new API key."""
    client = ZelaxyClient(api_key="test-api-key")
    client.set_api_key("new-api-key")
    assert client.api_key == "new-api-key"


def test_set_base_url():
    """Test setting a new base URL."""
    client = ZelaxyClient(api_key="test-api-key")
    client.set_base_url("https://new.zelaxy.ai/")
    assert client.base_url == "https://new.zelaxy.ai"


def test_set_base_url_strips_trailing_slash():
    """Test that base URL strips trailing slash."""
    client = ZelaxyClient(api_key="test-api-key")
    client.set_base_url("https://test.zelaxy.ai/")
    assert client.base_url == "https://test.zelaxy.ai"


@patch('zelaxy.requests.Session.get')
def test_validate_workflow_returns_false_on_error(mock_get):
    """Test that validate_workflow returns False when request fails."""
    mock_get.side_effect = ZelaxyError("Network error")
    
    client = ZelaxyClient(api_key="test-api-key")
    result = client.validate_workflow("test-workflow-id")
    
    assert result is False
    mock_get.assert_called_once_with("http://localhost:3000//api/workflows/test-workflow-id/status")


def test_zelaxy_error():
    """Test ZelaxyError creation."""
    error = ZelaxyError("Test error", "TEST_CODE", 400)
    assert str(error) == "Test error"
    assert error.code == "TEST_CODE"
    assert error.status == 400


def test_workflow_execution_result():
    """Test WorkflowExecutionResult data class."""
    result = WorkflowExecutionResult(
        success=True,
        output={"data": "test"},
        metadata={"duration": 1000}
    )
    assert result.success is True
    assert result.output == {"data": "test"}
    assert result.metadata == {"duration": 1000}


def test_workflow_status():
    """Test WorkflowStatus data class."""
    status = WorkflowStatus(
        is_deployed=True,
        deployed_at="2023-01-01T00:00:00Z",
        is_published=False,
        needs_redeployment=False
    )
    assert status.is_deployed is True
    assert status.deployed_at == "2023-01-01T00:00:00Z"
    assert status.is_published is False
    assert status.needs_redeployment is False


@patch('zelaxy.requests.Session.close')
def test_context_manager(mock_close):
    """Test ZelaxyClient as context manager."""
    with ZelaxyClient(api_key="test-api-key") as client:
        assert client.api_key == "test-api-key"
    # Should close without error
    mock_close.assert_called_once() 