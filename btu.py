"""
Broadlink to UFO-R11 IR Code Converter.

CLI tool for converting IR codes from Broadlink Base64 format to MQTT UFO-R11
format for MOES UFO-R11 devices used with SmartIR in Home Assistant.

This module uses the app.services package for core conversion logic.
"""

import json
import logging
import sys
import time
from pathlib import Path
from typing import Iterator

# Import from app.services
from app.services import (
    BTUError,
    FileValidationError,
    JSONValidationError,
    IRCodeError,
    CompressionLevel,
    IRConverter,
)
from app.services.constants import MAX_FILE_SIZE, SUPPORTED_EXTENSIONS


# =============================================================================
# LOGGING SETUP
# =============================================================================

logger = logging.getLogger(__name__)


def setup_logging(verbose: bool = False, quiet: bool = False) -> None:
    """Configure logging.

    Args:
        verbose: Enable DEBUG level.
        quiet: Disable all logs except errors.
    """
    if quiet:
        level = logging.ERROR
    elif verbose:
        level = logging.DEBUG
    else:
        level = logging.INFO

    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    ))
    logger.addHandler(handler)
    logger.setLevel(level)


# =============================================================================
# SMARTIR FILE PROCESSOR
# =============================================================================

class SmartIRFileProcessor:
    """Processor for SmartIR JSON files for Home Assistant.

    Reads SmartIR JSON files with IR codes in Broadlink format and
    converts them to MQTT UFO-R11 format.

    Attributes:
        converter: IR code converter.

    Example:
        >>> processor = SmartIRFileProcessor()
        >>> result = processor.process("1740.json")
        >>> with open("1740_converted.json", "w") as f:
        ...     f.write(result)
    """

    def __init__(self, compression_level: CompressionLevel = CompressionLevel.BALANCED):
        """Initialize processor."""
        self._converter = IRConverter(compression_level)
        self._commands_processed = 0
        logger.debug(f"SmartIRFileProcessor initialized with compression_level={compression_level.name}")

    def process(self, filename: str) -> str:
        """Process SmartIR file."""
        logger.info(f"Processing file: {filename}")
        start_time = time.perf_counter()
        self._commands_processed = 0

        path = self._validate_file(filename)
        data = self._load_json(path)
        self._validate_structure(data)

        logger.info(f"File loaded: {path.stat().st_size / 1024:.1f} KB")
        logger.debug(f"Manufacturer: {data.get('manufacturer', 'unknown')}")
        logger.debug(f"Supported models: {data.get('supportedModels', [])}")

        data['commands'] = self._process_commands(data.get('commands', {}))
        data['supportedController'] = 'MQTT'
        data['commandsEncoding'] = 'Raw'

        result = json.dumps(data, indent=2)

        elapsed = time.perf_counter() - start_time
        logger.info(
            f"Conversion completed: {self._commands_processed} commands "
            f"processed in {elapsed:.2f}s"
        )
        logger.info(f"Output size: {len(result) / 1024:.1f} KB")

        return result

    def validate(self, filename: str) -> bool:
        """Validate SmartIR file without conversion.

        Performs all checks: file existence, JSON format,
        SmartIR structure. Does not convert IR codes.

        Args:
            filename: Path to SmartIR JSON file.

        Returns:
            True if file is valid.

        Raises:
            FileValidationError: If file does not exist or is inaccessible.
            JSONValidationError: If JSON is invalid or structure is wrong.
        """
        logger.info(f"Validating file: {filename}")

        path = self._validate_file(filename)
        data = self._load_json(path)
        self._validate_structure(data)

        logger.debug(f"File size: {path.stat().st_size / 1024:.1f} KB")
        logger.debug(f"Manufacturer: {data.get('manufacturer', 'unknown')}")
        logger.debug(f"Supported models: {data.get('supportedModels', [])}")

        commands_count = sum(
            1 for _ in self._iterate_commands(data.get('commands', {}))
        )
        logger.debug(f"Total commands found: {commands_count}")

        return True

    def _iterate_commands(self, commands: dict) -> Iterator[tuple[str, str]]:
        """Iterator over all commands in structure.

        Recursively traverses nested SmartIR command structure.

        Args:
            commands: Commands dictionary.

        Yields:
            Tuples (path, value) for each command.
        """
        for key, value in commands.items():
            if isinstance(value, dict):
                yield from self._iterate_commands(value)
            elif isinstance(value, str) and value:
                yield key, value

    def _validate_file(self, filepath: str) -> Path:
        """Validate file path."""
        logger.debug(f"Validating file path: {filepath}")
        path = Path(filepath)

        if not path.exists():
            raise FileValidationError(f"File not found: {filepath}")

        if not path.is_file():
            raise FileValidationError(f"Path is not a file: {filepath}")

        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            raise FileValidationError(
                f"Unsupported extension: {path.suffix}"
            )

        file_size = path.stat().st_size
        if file_size > MAX_FILE_SIZE:
            raise FileValidationError(
                f"File too large: {file_size / 1024 / 1024:.1f} MB"
            )

        logger.debug(f"File validation passed: size={file_size} bytes")
        return path

    def _load_json(self, path: Path) -> dict:
        """Load JSON file."""
        logger.debug(f"Loading JSON from: {path}")
        try:
            with open(path, 'r', encoding='utf-8') as file:
                return json.load(file)
        except json.JSONDecodeError as e:
            raise JSONValidationError(f"Invalid JSON: {e}")
        except IOError as e:
            raise FileValidationError(f"Error reading file: {e}")

    def _validate_structure(self, data: dict) -> None:
        """Validate SmartIR JSON structure."""
        logger.debug("Validating SmartIR JSON structure")
        if not isinstance(data, dict):
            raise JSONValidationError("JSON must be an object")

        if 'commands' not in data:
            raise JSONValidationError("Missing 'commands' field")

        if not isinstance(data['commands'], dict):
            raise JSONValidationError("'commands' field must be an object")

        logger.debug("JSON structure validation passed")

    def _process_commands(self, commands: dict, path: str = "") -> dict:
        """Recursively process commands."""
        processed = {}
        for key, value in commands.items():
            current_path = f"{path}/{key}" if path else key

            if isinstance(value, str):
                logger.debug(f"Processing command: {current_path}")
                ir_code = self._converter.convert(value)
                processed[key] = f'{{"ir_code_to_send": "{ir_code}"}}'
                self._commands_processed += 1
            elif isinstance(value, list):
                # Preserve lists as-is (operationModes, fanModes, etc.)
                logger.debug(f"Preserving list: {current_path}")
                processed[key] = value
            elif isinstance(value, dict):
                logger.debug(f"Processing group: {current_path}")
                processed[key] = self._process_commands(value, current_path)
            else:
                processed[key] = value

        return processed


# =============================================================================
# LEGACY API (backward compatibility)
# =============================================================================

def encode_ir(command: str) -> str:
    """Convert IR code from Broadlink to UFO-R11 format.

    Legacy function for backward compatibility.
    Recommended to use IRConverter class directly.

    Args:
        command: IR code in Broadlink Base64 format.

    Returns:
        IR code in UFO-R11 Base64 format.

    Example:
        >>> result = encode_ir("JgDKAJKQEzQT...")
        >>> print(result)
        'DF8RIhFDAjAG...'
    """
    converter = IRConverter()
    return converter.convert(command)


def process_commands(filename: str) -> str:
    """Process SmartIR JSON file.

    Legacy function for backward compatibility.
    Recommended to use SmartIRFileProcessor class directly.

    Args:
        filename: Path to SmartIR JSON file.

    Returns:
        JSON string with converted IR codes.

    Example:
        >>> result = process_commands("1740.json")
        >>> with open("output.json", "w") as f:
        ...     f.write(result)
    """
    processor = SmartIRFileProcessor()
    return processor.process(filename)


# =============================================================================
# CLI
# =============================================================================

def main() -> int:
    """CLI entry point.

    Supports operation modes:
    - Conversion with output to stdout or file
    - Validation without conversion (--validate-only)
    - Various compression levels (--compression)
    - Verbose logging (--verbose)

    Returns:
        0 on success, 1 on error.
    """
    import argparse

    parser = argparse.ArgumentParser(
        description='Broadlink to UFO-R11 IR code converter',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python btu.py input.json > output.json
  python btu.py input.json -o output.json
  python btu.py -v input.json -o output.json  # with verbose logging
  python btu.py --validate-only input.json    # validation only
        '''
    )
    parser.add_argument('input', help='Input SmartIR JSON file')
    parser.add_argument('-o', '--output', help='Output file (default: stdout)')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='Verbose logging (DEBUG)')
    parser.add_argument('-q', '--quiet', action='store_true',
                        help='Quiet mode (errors only)')
    parser.add_argument('-c', '--compression', type=int, choices=[0, 1, 2, 3],
                        default=2, help='Compression level (0-3, default: 2)')
    parser.add_argument('--validate-only', action='store_true',
                        help='Only validate input file without conversion')

    args = parser.parse_args()

    setup_logging(verbose=args.verbose, quiet=args.quiet)

    try:
        processor = SmartIRFileProcessor(CompressionLevel(args.compression))

        if args.validate_only:
            processor.validate(args.input)
            logger.info("Validation passed: file is valid SmartIR JSON")
            return 0

        result = processor.process(args.input)

        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(result)
            logger.info(f"Output written to: {args.output}")
        else:
            print(result)

        return 0
    except BTUError as e:
        logger.error(str(e))
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
