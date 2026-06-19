import pytest
from unittest.mock import patch


class TestGetGroqModel:
    """Unit tests for get_groq_model function in app.py."""

    @pytest.fixture(autouse=True)
    def import_fn(self):
        # Import inside the test module to ensure pytest is available
        from app import get_groq_model
        self.get_groq_model = get_groq_model

    def test_returns_default_model_when_none(self):
        result = self.get_groq_model(None)
        assert result == "llama-3.3-70b-versatile"

    def test_returns_default_model_when_empty_string(self):
        result = self.get_groq_model("")
        assert result == "llama-3.3-70b-versatile"

    def test_returns_deepseek_for_deepseek_variants(self):
        assert self.get_groq_model("deepseek-r1") == "deepseek-r1-distill-llama-70b"
        assert self.get_groq_model("deepseek-70b") == "deepseek-r1-distill-llama-70b"

    def test_returns_llama_3_1_for_8b_variant(self):
        assert self.get_groq_model("llama-3.1-8b-instant") == "llama-3.1-8b-instant"
        assert self.get_groq_model("llama-3.1-8b") == "llama-3.1-8b-instant"

    def test_returns_gemma_for_gemma_variant(self):
        assert self.get_groq_model("gemma2-9b-it") == "gemma2-9b-it"
        assert self.get_groq_model("gemma-7b") == "gemma2-9b-it"

    def test_returns_default_for_unknown_model(self):
        assert self.get_groq_model("some-random-model") == "llama-3.3-70b-versatile"
        assert self.get_groq_model("mixtral-8x7b") == "llama-3.3-70b-versatile"

    def test_model_name_is_case_insensitive(self):
        assert self.get_groq_model("DEEPSEEK-R1") == "deepseek-r1-distill-llama-70b"
        assert self.get_groq_model("Llama-3.1-8b-Instant") == "llama-3.1-8b-instant"
        assert self.get_groq_model("GEMMA2-9B-IT") == "gemma2-9b-it"
