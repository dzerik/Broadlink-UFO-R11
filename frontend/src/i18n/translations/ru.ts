import type { TranslationKeys } from "./en";

export const ru: TranslationKeys = {
  // Header
  header: {
    title: "Broadlink → UFO-R11 Конвертер",
    subtitle: "Конвертер IR кодов для SmartIR в Home Assistant",
    connecting: "Подключение...",
    offline: "Не в сети",
  },

  // Main page
  main: {
    title: "Конвертация IR кодов",
    description:
      "Преобразуйте IR коды из формата Broadlink Base64 в формат UFO-R11 MQTT для использования с устройствами MOES в Home Assistant.",
  },

  // Tabs
  tabs: {
    editor: "JSON Редактор",
    single: "Один код",
    file: "Загрузить файл",
  },

  // Conversion options
  options: {
    compression: "Сжатие:",
    compressionLabel: "Уровень сжатия",
    level0: "0 - Без сжатия",
    level1: "1 - Быстрое",
    level2: "2 - Оптимальное",
    level2Recommended: "2 - Оптимальное (рекомендуется)",
    level3: "3 - Максимальное",
    wrapWithIrCode: "Обернуть в",
    wrapDescription: "Добавляет JSON обёртку для MQTT",
    formatJson: "Форматировать JSON",
    formatDescription: "Красивый вывод с отступами",
  },

  // Convert form (single code)
  convertForm: {
    inputLabel: "IR код Broadlink (Base64)",
    inputPlaceholder: "JgDKAJKQEzQTERI0EzQTERI0EzQT...",
    convertButton: "Конвертировать",
    converting: "Конвертация...",
    resultTitle: "UFO-R11 IR код",
    mqttPayload: "MQTT Payload",
    copy: "Копировать",
    originalSize: "Исходный размер:",
    resultSize: "Результат:",
    efficiency: "Эффективность:",
    chars: "символов",
  },

  // File upload
  fileUpload: {
    dropzone: "Перетащите SmartIR JSON файл сюда или",
    clickToSelect: "нажмите для выбора",
    onlyJson: "Только .json файлы",
    selectJsonFile: "Пожалуйста, выберите JSON файл",
    invalidJson: "Невалидный JSON файл",
    convertFile: "Конвертировать файл",
    conversionComplete: "Конвертация завершена",
    commandsProcessed: "Обработано команд:",
    downloadJson: "Скачать JSON",
    previewTitle: "Превью результата",
  },

  // Two panel editor
  editor: {
    inputLabel: "Входной JSON (Broadlink)",
    outputLabel: "Результат (UFO-R11)",
    chars: "символов",
    commands: "команд",
    convert: "Конвертировать",
    format: "Форматировать",
    clear: "Очистить",
    copyOutput: "Копировать",
    download: "Скачать",
    sizeRatio: "Размер:",
    ofOriginal: "от оригинала",
    placeholder: `{
  "manufacturer": "Example",
  "commands": {
    "on": "JgDKAJKQ...",
    "off": "JgDKAJKQ..."
  }
}`,
    resultPlaceholder: "Результат конвертации появится здесь...",
  },

  // JSON validation
  validation: {
    mustBeObject: "JSON должен быть объектом",
    invalidJson: "Невалидный JSON:",
    parseError: "ошибка парсинга",
    conversionError: "Ошибка конвертации",
    unknownError: "Произошла неизвестная ошибка",
  },

  // Feature cards
  features: {
    editorTitle: "JSON Редактор",
    editorFeature1: "Двухпанельный режим input/output",
    editorFeature2: "Подсветка синтаксиса JSON",
    editorFeature3: "Опция обёртки ir_code_to_send",
    editorFeature4: "Форматирование и валидация",
    compressionTitle: "Уровни сжатия",
    noCompression: "Совместимость",
    fast: "Скорость",
    optimal: "Рекомендуется",
    maximum: "Мин. размер",
    outputTitle: "Формат вывода",
    withWrapper: "С обёрткой:",
    withoutWrapper: "Без обёртки:",
  },

  // Footer
  footer: {
    compatible: "Совместимо с устройствами MOES UFO-R11 и SmartIR для Home Assistant",
    basedOn: "Основан на",
    originalProject: "оригинальном проекте",
    codesFrom: "IR коды из",
  },

  // Errors
  errors: {
    error: "Ошибка",
  },
};
