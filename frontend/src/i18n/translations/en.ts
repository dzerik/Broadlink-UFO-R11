export interface TranslationKeys {
  header: {
    title: string;
    subtitle: string;
    connecting: string;
    offline: string;
  };
  main: {
    title: string;
    description: string;
  };
  tabs: {
    editor: string;
    single: string;
    file: string;
  };
  options: {
    compression: string;
    compressionLabel: string;
    level0: string;
    level1: string;
    level2: string;
    level2Recommended: string;
    level3: string;
    wrapWithIrCode: string;
    wrapDescription: string;
    formatJson: string;
    formatDescription: string;
  };
  convertForm: {
    inputLabel: string;
    inputPlaceholder: string;
    convertButton: string;
    converting: string;
    resultTitle: string;
    mqttPayload: string;
    copy: string;
    originalSize: string;
    resultSize: string;
    efficiency: string;
    chars: string;
  };
  fileUpload: {
    dropzone: string;
    clickToSelect: string;
    onlyJson: string;
    selectJsonFile: string;
    invalidJson: string;
    convertFile: string;
    conversionComplete: string;
    commandsProcessed: string;
    downloadJson: string;
    previewTitle: string;
  };
  editor: {
    inputLabel: string;
    outputLabel: string;
    chars: string;
    commands: string;
    convert: string;
    format: string;
    clear: string;
    copyOutput: string;
    download: string;
    sizeRatio: string;
    ofOriginal: string;
    placeholder: string;
    resultPlaceholder: string;
  };
  validation: {
    mustBeObject: string;
    invalidJson: string;
    parseError: string;
    conversionError: string;
    unknownError: string;
  };
  features: {
    editorTitle: string;
    editorFeature1: string;
    editorFeature2: string;
    editorFeature3: string;
    editorFeature4: string;
    compressionTitle: string;
    noCompression: string;
    fast: string;
    optimal: string;
    maximum: string;
    outputTitle: string;
    withWrapper: string;
    withoutWrapper: string;
  };
  footer: {
    compatible: string;
    basedOn: string;
    originalProject: string;
    codesFrom: string;
  };
  errors: {
    error: string;
  };
}

export const en: TranslationKeys = {
  // Header
  header: {
    title: "Broadlink → UFO-R11 Converter",
    subtitle: "IR code converter for SmartIR in Home Assistant",
    connecting: "Connecting...",
    offline: "Offline",
  },

  // Main page
  main: {
    title: "IR Code Conversion",
    description:
      "Convert IR codes from Broadlink Base64 format to UFO-R11 MQTT format for use with MOES devices in Home Assistant.",
  },

  // Tabs
  tabs: {
    editor: "JSON Editor",
    single: "Single Code",
    file: "Upload File",
  },

  // Conversion options
  options: {
    compression: "Compression:",
    compressionLabel: "Compression level",
    level0: "0 - No compression",
    level1: "1 - Fast",
    level2: "2 - Optimal",
    level2Recommended: "2 - Optimal (recommended)",
    level3: "3 - Maximum",
    wrapWithIrCode: "Wrap in",
    wrapDescription: "Adds JSON wrapper for MQTT",
    formatJson: "Format JSON",
    formatDescription: "Pretty output with indentation",
  },

  // Convert form (single code)
  convertForm: {
    inputLabel: "Broadlink IR code (Base64)",
    inputPlaceholder: "JgDKAJKQEzQTERI0EzQTERI0EzQT...",
    convertButton: "Convert",
    converting: "Converting...",
    resultTitle: "UFO-R11 IR code",
    mqttPayload: "MQTT Payload",
    copy: "Copy",
    originalSize: "Original size:",
    resultSize: "Result:",
    efficiency: "Efficiency:",
    chars: "characters",
  },

  // File upload
  fileUpload: {
    dropzone: "Drag SmartIR JSON file here or",
    clickToSelect: "click to select",
    onlyJson: "Only .json files",
    selectJsonFile: "Please select a JSON file",
    invalidJson: "Invalid JSON file",
    convertFile: "Convert file",
    conversionComplete: "Conversion complete",
    commandsProcessed: "Commands processed:",
    downloadJson: "Download JSON",
    previewTitle: "Result preview",
  },

  // Two panel editor
  editor: {
    inputLabel: "Input JSON (Broadlink)",
    outputLabel: "Result (UFO-R11)",
    chars: "characters",
    commands: "commands",
    convert: "Convert",
    format: "Format",
    clear: "Clear",
    copyOutput: "Copy",
    download: "Download",
    sizeRatio: "Size:",
    ofOriginal: "of original",
    placeholder: `{
  "manufacturer": "Example",
  "commands": {
    "on": "JgDKAJKQ...",
    "off": "JgDKAJKQ..."
  }
}`,
    resultPlaceholder: "Conversion result will appear here...",
  },

  // JSON validation
  validation: {
    mustBeObject: "JSON must be an object",
    invalidJson: "Invalid JSON:",
    parseError: "parse error",
    conversionError: "Conversion error",
    unknownError: "Unknown error occurred",
  },

  // Feature cards
  features: {
    editorTitle: "JSON Editor",
    editorFeature1: "Two-panel input/output mode",
    editorFeature2: "JSON syntax highlighting",
    editorFeature3: "ir_code_to_send wrapper option",
    editorFeature4: "Formatting and validation",
    compressionTitle: "Compression Levels",
    noCompression: "Compatibility",
    fast: "Speed",
    optimal: "Recommended",
    maximum: "Min. size",
    outputTitle: "Output Format",
    withWrapper: "With wrapper:",
    withoutWrapper: "Without wrapper:",
  },

  // Footer
  footer: {
    compatible: "Compatible with MOES UFO-R11 devices and SmartIR for Home Assistant",
    basedOn: "Based on",
    originalProject: "original project",
    codesFrom: "IR codes from",
  },

  // Errors
  errors: {
    error: "Error",
  },
};
