"""Unit tests for app services."""

import io
import json
import pytest

from app.services import (
    CompressionLevel,
    TuyaCompressor,
    BroadlinkDecoder,
    TuyaEncoder,
    IRConverter,
    BTUError,
    IRCodeError,
)


@pytest.fixture
def sample_broadlink_code():
    """Sample Broadlink Base64 code for testing."""
    return "JgBGAJKRFDQUNBQ0FDUUNBQ0EzUTEhQREhQRFBISEhQ0EzUUNBMSExITEhMSExITNRQ0EzUTEhMSFDQUNBMSExIUNBMSExITAAUQAA=="


@pytest.fixture
def sample_timings():
    """Sample IR timings for testing."""
    return [9000, 4500, 560, 560, 560, 1690, 560, 560, 560, 1690]


# =============================================================================
# COMPRESSION LEVEL TESTS
# =============================================================================

class TestCompressionLevel:
    """Tests for CompressionLevel enum."""

    def test_compression_levels_values(self):
        """Test compression level numeric values."""
        assert CompressionLevel.NONE == 0
        assert CompressionLevel.FAST == 1
        assert CompressionLevel.BALANCED == 2
        assert CompressionLevel.OPTIMAL == 3

    def test_compression_level_from_int(self):
        """Test creating compression level from int."""
        for i in range(4):
            level = CompressionLevel(i)
            assert level.value == i


# =============================================================================
# TUYA COMPRESSOR TESTS
# =============================================================================

class TestTuyaCompressor:
    """Tests for TuyaCompressor class."""

    def test_init_default_level(self):
        """Test default compression level."""
        compressor = TuyaCompressor()
        assert compressor.level == CompressionLevel.BALANCED

    def test_init_custom_level(self):
        """Test custom compression level."""
        compressor = TuyaCompressor(CompressionLevel.FAST)
        assert compressor.level == CompressionLevel.FAST

    def test_compress_empty_data(self):
        """Test compressing empty data."""
        compressor = TuyaCompressor(CompressionLevel.NONE)
        output = io.BytesIO()
        compressor.compress(output, b'')
        assert output.getvalue() == b''

    def test_compress_small_data_no_compression(self):
        """Test compressing small data without compression."""
        compressor = TuyaCompressor(CompressionLevel.NONE)
        data = b'test data'
        output = io.BytesIO()
        compressor.compress(output, data)
        result = output.getvalue()
        # First byte should be length - 1
        assert result[0] == len(data) - 1
        assert result[1:] == data

    def test_compress_levels_produce_output(self):
        """Test all compression levels produce valid output."""
        data = b'AAABBBCCC' * 10
        for level in CompressionLevel:
            compressor = TuyaCompressor(level)
            output = io.BytesIO()
            compressor.compress(output, data)
            assert len(output.getvalue()) > 0

    def test_compress_balanced_compresses_data(self):
        """Test that balanced compression actually compresses repetitive data."""
        compressor = TuyaCompressor(CompressionLevel.BALANCED)
        data = b'A' * 100
        output = io.BytesIO()
        compressor.compress(output, data)
        assert len(output.getvalue()) < len(data)


# =============================================================================
# BROADLINK DECODER TESTS
# =============================================================================

class TestBroadlinkDecoder:
    """Tests for BroadlinkDecoder class."""

    def test_decode_valid_code(self, sample_broadlink_code):
        """Test decoding valid Broadlink code."""
        decoder = BroadlinkDecoder()
        timings = decoder.decode(sample_broadlink_code)
        assert isinstance(timings, list)
        assert len(timings) > 0
        assert all(isinstance(t, int) for t in timings)

    def test_decode_returns_positive_timings(self, sample_broadlink_code):
        """Test that decoded timings are positive."""
        decoder = BroadlinkDecoder()
        timings = decoder.decode(sample_broadlink_code)
        assert all(t > 0 for t in timings)

    def test_decode_invalid_base64(self):
        """Test decoding invalid Base64 raises error."""
        decoder = BroadlinkDecoder()
        with pytest.raises(IRCodeError):
            decoder.decode("not valid base64!!!")

    def test_decode_empty_string(self):
        """Test decoding empty string raises error."""
        decoder = BroadlinkDecoder()
        with pytest.raises(IRCodeError):
            decoder.decode("")


# =============================================================================
# TUYA ENCODER TESTS
# =============================================================================

class TestTuyaEncoder:
    """Tests for TuyaEncoder class."""

    def test_init_default_level(self):
        """Test default compression level."""
        encoder = TuyaEncoder()
        assert encoder.compression_level == CompressionLevel.BALANCED

    def test_encode_returns_base64(self, sample_timings):
        """Test that encode returns Base64 string."""
        encoder = TuyaEncoder()
        result = encoder.encode(sample_timings)
        assert isinstance(result, str)
        import base64
        base64.b64decode(result)  # Should not raise

    def test_encode_different_levels(self, sample_timings):
        """Test encoding with different compression levels."""
        for level in CompressionLevel:
            encoder = TuyaEncoder(level)
            result = encoder.encode(sample_timings)
            assert len(result) > 0


# =============================================================================
# IR CONVERTER TESTS
# =============================================================================

class TestIRConverter:
    """Tests for IRConverter class."""

    def test_init_default_level(self):
        """Test default compression level."""
        converter = IRConverter()
        assert converter.compression_level == CompressionLevel.BALANCED

    def test_convert_valid_code(self, sample_broadlink_code):
        """Test converting valid Broadlink code."""
        converter = IRConverter()
        result = converter.convert(sample_broadlink_code)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_convert_returns_base64(self, sample_broadlink_code):
        """Test conversion result is valid Base64."""
        converter = IRConverter()
        result = converter.convert(sample_broadlink_code)
        import base64
        decoded = base64.b64decode(result)
        assert len(decoded) > 0

    def test_convert_invalid_code_raises(self):
        """Test converting invalid code raises error."""
        converter = IRConverter()
        with pytest.raises(IRCodeError):
            converter.convert("!!!not valid base64!!!")

    def test_convert_to_mqtt_payload(self, sample_broadlink_code):
        """Test converting to MQTT payload."""
        converter = IRConverter()
        result = converter.convert_to_mqtt_payload(sample_broadlink_code)
        data = json.loads(result)
        assert "ir_code_to_send" in data


# =============================================================================
# IR CONVERTER WRAP_WITH_IR_CODE TESTS
# =============================================================================

class TestIRConverterWrapOption:
    """Tests for IRConverter wrap_with_ir_code option."""

    @pytest.fixture
    def smartir_data(self, sample_broadlink_code):
        """Sample SmartIR data."""
        return {
            "manufacturer": "Test",
            "supportedController": "Broadlink",
            "commands": {
                "off": sample_broadlink_code,
                "heat": {
                    "low": {
                        "20": sample_broadlink_code
                    }
                }
            }
        }

    def test_process_smartir_data_wrap_true_default(self, smartir_data):
        """Test process_smartir_data with wrap_with_ir_code=True (default)."""
        converter = IRConverter()
        result = converter.process_smartir_data(smartir_data)

        # Check that commands are wrapped
        off_cmd = result["commands"]["off"]
        assert off_cmd.startswith('{"ir_code_to_send":')
        # Should be valid JSON
        parsed = json.loads(off_cmd)
        assert "ir_code_to_send" in parsed

    def test_process_smartir_data_wrap_true_explicit(self, smartir_data):
        """Test process_smartir_data with explicit wrap_with_ir_code=True."""
        converter = IRConverter()
        result = converter.process_smartir_data(smartir_data, wrap_with_ir_code=True)

        off_cmd = result["commands"]["off"]
        parsed = json.loads(off_cmd)
        assert "ir_code_to_send" in parsed

    def test_process_smartir_data_wrap_false(self, smartir_data):
        """Test process_smartir_data with wrap_with_ir_code=False."""
        converter = IRConverter()
        result = converter.process_smartir_data(smartir_data, wrap_with_ir_code=False)

        # Check that commands are NOT wrapped
        off_cmd = result["commands"]["off"]
        # Should NOT be JSON string with ir_code_to_send
        assert not off_cmd.startswith('{"ir_code_to_send":')
        # Should be raw Base64 IR code
        import base64
        # Should decode without error
        base64.b64decode(off_cmd)

    def test_process_smartir_data_wrap_false_nested(self, smartir_data):
        """Test nested commands with wrap_with_ir_code=False."""
        converter = IRConverter()
        result = converter.process_smartir_data(smartir_data, wrap_with_ir_code=False)

        # Check nested command
        nested_cmd = result["commands"]["heat"]["low"]["20"]
        assert not nested_cmd.startswith('{"ir_code_to_send":')
        import base64
        base64.b64decode(nested_cmd)

    def test_process_smartir_data_wrap_true_nested(self, smartir_data):
        """Test nested commands with wrap_with_ir_code=True."""
        converter = IRConverter()
        result = converter.process_smartir_data(smartir_data, wrap_with_ir_code=True)

        # Check nested command is wrapped
        nested_cmd = result["commands"]["heat"]["low"]["20"]
        parsed = json.loads(nested_cmd)
        assert "ir_code_to_send" in parsed

    def test_process_smartir_data_transforms_metadata(self, smartir_data):
        """Test metadata is transformed regardless of wrap option."""
        converter = IRConverter()

        # Test with wrap=True
        result1 = converter.process_smartir_data(smartir_data, wrap_with_ir_code=True)
        assert result1["supportedController"] == "MQTT"
        assert result1["commandsEncoding"] == "Raw"

        # Test with wrap=False
        result2 = converter.process_smartir_data(smartir_data, wrap_with_ir_code=False)
        assert result2["supportedController"] == "MQTT"
        assert result2["commandsEncoding"] == "Raw"

    def test_process_smartir_data_preserves_non_command_fields(self, smartir_data):
        """Test non-command fields are preserved."""
        converter = IRConverter()
        result = converter.process_smartir_data(smartir_data, wrap_with_ir_code=False)

        assert result["manufacturer"] == "Test"


# =============================================================================
# EXCEPTION TESTS
# =============================================================================

class TestExceptions:
    """Tests for custom exceptions."""

    def test_btu_error_is_exception(self):
        """Test BTUError is an Exception."""
        assert issubclass(BTUError, Exception)

    def test_ir_code_error_inherits_btu(self):
        """Test IRCodeError inherits from BTUError."""
        assert issubclass(IRCodeError, BTUError)

    def test_exception_message(self):
        """Test exception messages are preserved."""
        msg = "test error message"
        err = BTUError(msg)
        assert str(err) == msg
