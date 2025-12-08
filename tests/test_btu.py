"""Unit tests for btu.py converter."""

import io
import json
import os
import sys
import tempfile
from pathlib import Path

import pytest

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import from app.services (core classes and constants)
from app.services import (
    BTUError,
    FileValidationError,
    JSONValidationError,
    IRCodeError,
    CompressionError,
    CompressionLevel,
    TuyaCompressor,
    BroadlinkDecoder,
    TuyaEncoder,
    IRConverter,
    BRDLNK_UNIT,
    MAX_SIGNAL_VALUE,
)
from app.services.constants import MAX_FILE_SIZE, SUPPORTED_EXTENSIONS

# Import from btu (CLI and file processor)
from btu import SmartIRFileProcessor, setup_logging, main


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def sample_broadlink_code():
    """Sample Broadlink Base64 code for testing."""
    # Short valid Broadlink code
    return "JgBGAJKRFDQUNBQ0FDUUNBQ0EzUTEhQREhQRFBISEhQ0EzUUNBMSExITEhMSExITNRQ0EzUTEhMSFDQUNBMSExIUNBMSExITAAUQAA=="


@pytest.fixture
def sample_timings():
    """Sample IR timings for testing."""
    return [9000, 4500, 560, 560, 560, 1690, 560, 560, 560, 1690]


@pytest.fixture
def temp_json_file():
    """Create a temporary valid SmartIR JSON file."""
    data = {
        "manufacturer": "Test",
        "supportedModels": ["Model1"],
        "supportedController": "Broadlink",
        "commandsEncoding": "Base64",
        "commands": {
            "off": "JgBGAJKRFDQUNBQ0FDUUNBQ0EzUTEhQREhQRFBISEhQ0EzUUNBMSExITEhMSExITNRQ0EzUTEhMSFDQUNBMSExIUNBMSExITAAUQAA=="
        }
    }
    with tempfile.NamedTemporaryFile(
        mode='w', suffix='.json', delete=False, encoding='utf-8'
    ) as f:
        json.dump(data, f)
        f.flush()
        yield f.name
    os.unlink(f.name)


@pytest.fixture
def temp_invalid_json_file():
    """Create a temporary invalid JSON file."""
    with tempfile.NamedTemporaryFile(
        mode='w', suffix='.json', delete=False, encoding='utf-8'
    ) as f:
        f.write("{ invalid json }")
        f.flush()
        yield f.name
    os.unlink(f.name)


@pytest.fixture
def temp_missing_fields_json():
    """Create a JSON file missing required fields."""
    data = {"some_field": "value"}
    with tempfile.NamedTemporaryFile(
        mode='w', suffix='.json', delete=False, encoding='utf-8'
    ) as f:
        json.dump(data, f)
        f.flush()
        yield f.name
    os.unlink(f.name)


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
        data = b'AAABBBCCC' * 10  # Repetitive data for compression
        for level in CompressionLevel:
            compressor = TuyaCompressor(level)
            output = io.BytesIO()
            compressor.compress(output, data)
            assert len(output.getvalue()) > 0

    def test_compress_balanced_compresses_data(self):
        """Test that balanced compression actually compresses repetitive data."""
        compressor = TuyaCompressor(CompressionLevel.BALANCED)
        # Highly repetitive data should compress well
        data = b'A' * 100
        output = io.BytesIO()
        compressor.compress(output, data)
        # Compressed should be smaller than original
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
        # Should be valid Base64
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
            # Use invalid Base64 characters
            converter.convert("!!!not valid base64!!!")


# =============================================================================
# SMARTIR FILE PROCESSOR TESTS
# =============================================================================

class TestSmartIRFileProcessor:
    """Tests for SmartIRFileProcessor class."""

    def test_init_default_level(self):
        """Test default compression level."""
        processor = SmartIRFileProcessor()
        # Just verify it initializes without error
        assert processor is not None

    def test_process_valid_file(self, temp_json_file):
        """Test processing valid SmartIR file."""
        processor = SmartIRFileProcessor()
        result = processor.process(temp_json_file)
        assert isinstance(result, str)
        # Result should be valid JSON
        data = json.loads(result)
        assert data['supportedController'] == 'MQTT'
        assert data['commandsEncoding'] == 'Raw'

    def test_process_nonexistent_file(self):
        """Test processing nonexistent file raises error."""
        processor = SmartIRFileProcessor()
        with pytest.raises(FileValidationError):
            processor.process("/nonexistent/file.json")

    def test_process_invalid_json(self, temp_invalid_json_file):
        """Test processing invalid JSON raises error."""
        processor = SmartIRFileProcessor()
        with pytest.raises(JSONValidationError):
            processor.process(temp_invalid_json_file)

    def test_process_missing_fields(self, temp_missing_fields_json):
        """Test processing JSON missing required fields raises error."""
        processor = SmartIRFileProcessor()
        with pytest.raises(JSONValidationError):
            processor.process(temp_missing_fields_json)

    def test_validate_valid_file(self, temp_json_file):
        """Test validating valid file."""
        processor = SmartIRFileProcessor()
        result = processor.validate(temp_json_file)
        assert result is True

    def test_validate_nonexistent_file(self):
        """Test validating nonexistent file raises error."""
        processor = SmartIRFileProcessor()
        with pytest.raises(FileValidationError):
            processor.validate("/nonexistent/file.json")


# =============================================================================
# EXCEPTION TESTS
# =============================================================================

class TestExceptions:
    """Tests for custom exceptions."""

    def test_btu_error_is_exception(self):
        """Test BTUError is an Exception."""
        assert issubclass(BTUError, Exception)

    def test_file_validation_error_inherits_btu(self):
        """Test FileValidationError inherits from BTUError."""
        assert issubclass(FileValidationError, BTUError)

    def test_json_validation_error_inherits_btu(self):
        """Test JSONValidationError inherits from BTUError."""
        assert issubclass(JSONValidationError, BTUError)

    def test_ir_code_error_inherits_btu(self):
        """Test IRCodeError inherits from BTUError."""
        assert issubclass(IRCodeError, BTUError)

    def test_compression_error_inherits_btu(self):
        """Test CompressionError inherits from BTUError."""
        assert issubclass(CompressionError, BTUError)

    def test_exception_message(self):
        """Test exception messages are preserved."""
        msg = "test error message"
        err = BTUError(msg)
        assert str(err) == msg


# =============================================================================
# CONSTANTS TESTS
# =============================================================================

class TestConstants:
    """Tests for module constants."""

    def test_brdlnk_unit_positive(self):
        """Test BRDLNK_UNIT is positive."""
        assert BRDLNK_UNIT > 0

    def test_max_file_size_reasonable(self):
        """Test MAX_FILE_SIZE is reasonable (at least 1MB)."""
        assert MAX_FILE_SIZE >= 1024 * 1024

    def test_supported_extensions_contains_json(self):
        """Test SUPPORTED_EXTENSIONS contains .json."""
        assert '.json' in SUPPORTED_EXTENSIONS


# =============================================================================
# INTEGRATION TESTS
# =============================================================================

class TestIntegration:
    """Integration tests using real files."""

    @pytest.fixture
    def real_test_file(self):
        """Get path to real test file if exists."""
        test_file = Path(__file__).parent.parent / "1740.json"
        if test_file.exists():
            return str(test_file)
        pytest.skip("Real test file 1740.json not found")

    def test_full_conversion_real_file(self, real_test_file):
        """Test full conversion with real SmartIR file."""
        processor = SmartIRFileProcessor()
        result = processor.process(real_test_file)

        # Verify output is valid JSON
        data = json.loads(result)

        # Verify required transformations
        assert data['supportedController'] == 'MQTT'
        assert data['commandsEncoding'] == 'Raw'

        # Verify commands were processed
        assert 'commands' in data
        assert len(data['commands']) > 0

    def test_validate_real_file(self, real_test_file):
        """Test validation with real SmartIR file."""
        processor = SmartIRFileProcessor()
        assert processor.validate(real_test_file) is True

    def test_different_compression_levels_real_file(self, real_test_file):
        """Test different compression levels produce valid output."""
        for level in CompressionLevel:
            processor = SmartIRFileProcessor(level)
            result = processor.process(real_test_file)
            # Should produce valid JSON
            json.loads(result)


# =============================================================================
# SETUP LOGGING TESTS
# =============================================================================

class TestSetupLogging:
    """Tests for setup_logging function."""

    def test_setup_logging_default(self):
        """Test default logging setup (INFO level)."""
        import logging
        import btu
        # Reset logger
        btu.logger.handlers.clear()
        setup_logging(verbose=False, quiet=False)
        assert btu.logger.level == logging.INFO
        btu.logger.handlers.clear()

    def test_setup_logging_verbose(self):
        """Test verbose logging setup (DEBUG level)."""
        import logging
        import btu
        btu.logger.handlers.clear()
        setup_logging(verbose=True, quiet=False)
        assert btu.logger.level == logging.DEBUG
        btu.logger.handlers.clear()

    def test_setup_logging_quiet(self):
        """Test quiet logging setup (ERROR level)."""
        import logging
        import btu
        btu.logger.handlers.clear()
        setup_logging(verbose=False, quiet=True)
        assert btu.logger.level == logging.ERROR
        btu.logger.handlers.clear()

    def test_setup_logging_quiet_overrides_verbose(self):
        """Test quiet mode takes precedence over verbose."""
        import logging
        import btu
        btu.logger.handlers.clear()
        setup_logging(verbose=True, quiet=True)
        assert btu.logger.level == logging.ERROR
        btu.logger.handlers.clear()


# =============================================================================
# CLI MAIN TESTS
# =============================================================================

class TestCLIMain:
    """Tests for CLI main function."""

    def test_main_basic_conversion(self, temp_json_file):
        """Test basic conversion through main."""
        sys.argv = ['btu.py', temp_json_file]
        result = main()
        assert result == 0

    def test_main_with_output_file(self, temp_json_file):
        """Test main with output file argument."""
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False
        ) as out:
            output_path = out.name

        try:
            sys.argv = ['btu.py', temp_json_file, '-o', output_path]
            result = main()
            assert result == 0
            # Verify output file was created
            assert os.path.exists(output_path)
            with open(output_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            assert data['supportedController'] == 'MQTT'
        finally:
            if os.path.exists(output_path):
                os.unlink(output_path)

    def test_main_validate_only(self, temp_json_file):
        """Test main with --validate-only flag."""
        sys.argv = ['btu.py', '--validate-only', temp_json_file]
        result = main()
        assert result == 0

    def test_main_with_compression_level(self, temp_json_file):
        """Test main with custom compression level."""
        for level in range(4):
            sys.argv = ['btu.py', '-c', str(level), temp_json_file]
            result = main()
            assert result == 0

    def test_main_nonexistent_file(self):
        """Test main with nonexistent file returns error."""
        sys.argv = ['btu.py', '/nonexistent/file.json']
        result = main()
        assert result == 1

    def test_main_invalid_json_file(self, temp_invalid_json_file):
        """Test main with invalid JSON file returns error."""
        sys.argv = ['btu.py', temp_invalid_json_file]
        result = main()
        assert result == 1

    def test_main_verbose_mode(self, temp_json_file):
        """Test main with verbose mode."""
        sys.argv = ['btu.py', '-v', temp_json_file]
        result = main()
        assert result == 0

    def test_main_quiet_mode(self, temp_json_file):
        """Test main with quiet mode."""
        sys.argv = ['btu.py', '-q', temp_json_file]
        result = main()
        assert result == 0


# =============================================================================
# BROADLINK DECODER EDGE CASES
# =============================================================================

class TestBroadlinkDecoderEdgeCases:
    """Edge case tests for BroadlinkDecoder."""

    def test_decode_short_data(self):
        """Test decoding data that's too short."""
        decoder = BroadlinkDecoder()
        import base64
        # Very short data (less than 8 hex chars after decode)
        short_data = base64.b64encode(b'\x26\x00').decode()
        with pytest.raises(IRCodeError, match="слишком короткие"):
            decoder.decode(short_data)

    def test_decode_with_minimal_valid_data(self):
        """Test decoding minimal valid Broadlink data."""
        decoder = BroadlinkDecoder()
        import base64
        # Minimal valid Broadlink header (26 00 LL LL where LL is length)
        # This creates valid but minimal data
        minimal = base64.b64encode(b'\x26\x00\x04\x00\x10\x20\x30\x40').decode()
        timings = decoder.decode(minimal)
        assert isinstance(timings, list)


# =============================================================================
# TUYA ENCODER EDGE CASES
# =============================================================================

class TestTuyaEncoderEdgeCases:
    """Edge case tests for TuyaEncoder."""

    def test_encode_empty_timings_raises(self):
        """Test encoding empty timings raises error."""
        encoder = TuyaEncoder()
        with pytest.raises(IRCodeError, match="Пустой список"):
            encoder.encode([])

    def test_encode_all_timings_filtered_raises(self):
        """Test encoding when all timings exceed MAX_SIGNAL_VALUE raises error."""
        encoder = TuyaEncoder()
        # All values exceed MAX_SIGNAL_VALUE
        huge_timings = [MAX_SIGNAL_VALUE + 1] * 10
        with pytest.raises(IRCodeError, match="Все тайминги отфильтрованы"):
            encoder.encode(huge_timings)

    def test_encode_partial_filtering(self):
        """Test encoding with some timings filtered out."""
        encoder = TuyaEncoder()
        # Mix of valid and too-large values
        timings = [100, 200, MAX_SIGNAL_VALUE + 1, 300]
        result = encoder.encode(timings)
        assert len(result) > 0

    def test_encode_large_timings(self):
        """Test encoding large but valid timings."""
        encoder = TuyaEncoder()
        # Values just under MAX_SIGNAL_VALUE
        timings = [MAX_SIGNAL_VALUE - 1] * 5
        result = encoder.encode(timings)
        assert len(result) > 0


# =============================================================================
# TUYA COMPRESSOR EDGE CASES
# =============================================================================

class TestTuyaCompressorEdgeCases:
    """Edge case tests for TuyaCompressor."""

    def test_compress_medium_data_balanced(self):
        """Test compressing medium-sized data with balanced level."""
        compressor = TuyaCompressor(CompressionLevel.BALANCED)
        # Medium-sized repetitive data (within window size)
        data = (b'ABCD' * 500)  # 2000 bytes
        output = io.BytesIO()
        compressor.compress(output, data)
        assert len(output.getvalue()) > 0
        # Should compress well due to repetition
        assert len(output.getvalue()) < len(data)

    def test_compress_medium_data_optimal(self):
        """Test compressing medium-sized data with optimal level."""
        compressor = TuyaCompressor(CompressionLevel.OPTIMAL)
        # Medium-sized repetitive data
        data = (b'XYZ' * 600)  # 1800 bytes
        output = io.BytesIO()
        compressor.compress(output, data)
        assert len(output.getvalue()) > 0
        # Should compress well due to repetition
        assert len(output.getvalue()) < len(data)

    def test_compress_fast_level(self):
        """Test fast compression level."""
        compressor = TuyaCompressor(CompressionLevel.FAST)
        data = b'AAABBBCCCDDDEEE' * 20
        output = io.BytesIO()
        compressor.compress(output, data)
        assert len(output.getvalue()) > 0

    def test_compress_non_repetitive_data(self):
        """Test compressing non-repetitive data."""
        compressor = TuyaCompressor(CompressionLevel.BALANCED)
        # Random-ish data that won't compress well
        data = bytes(range(256)) * 2
        output = io.BytesIO()
        compressor.compress(output, data)
        assert len(output.getvalue()) > 0


# =============================================================================
# SMARTIR FILE PROCESSOR EDGE CASES
# =============================================================================

class TestSmartIRFileProcessorEdgeCases:
    """Edge case tests for SmartIRFileProcessor."""

    def test_process_nested_commands(self):
        """Test processing file with deeply nested commands."""
        data = {
            "manufacturer": "Test",
            "supportedModels": ["Model1"],
            "supportedController": "Broadlink",
            "commandsEncoding": "Base64",
            "commands": {
                "heat": {
                    "low": {
                        "20": "JgBGAJKRFDQUNBQ0FDUUNBQ0EzUTEhQREhQRFBISEhQ0EzUUNBMSExITEhMSExITNRQ0EzUTEhMSFDQUNBMSExIUNBMSExITAAUQAA=="
                    }
                }
            }
        }
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False, encoding='utf-8'
        ) as f:
            json.dump(data, f)
            f.flush()
            path = f.name

        try:
            processor = SmartIRFileProcessor()
            result = processor.process(path)
            parsed = json.loads(result)
            assert parsed['commands']['heat']['low']['20'] is not None
        finally:
            os.unlink(path)

    def test_process_wrong_extension(self):
        """Test processing file with wrong extension."""
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.txt', delete=False, encoding='utf-8'
        ) as f:
            f.write('{}')
            f.flush()
            path = f.name

        try:
            processor = SmartIRFileProcessor()
            with pytest.raises(FileValidationError, match="Unsupported extension"):
                processor.process(path)
        finally:
            os.unlink(path)

    def test_process_oversized_file(self):
        """Test processing file that's too large (simulated)."""
        # This would need mocking MAX_FILE_SIZE, skip for now
        pass


# =============================================================================
# IR CONVERTER EDGE CASES
# =============================================================================

class TestIRConverterEdgeCases:
    """Edge case tests for IRConverter."""

    def test_convert_different_compression_levels(self, sample_broadlink_code):
        """Test converting with all compression levels."""
        for level in CompressionLevel:
            converter = IRConverter(level)
            result = converter.convert(sample_broadlink_code)
            assert len(result) > 0
            # Verify it's valid Base64
            import base64
            base64.b64decode(result)
