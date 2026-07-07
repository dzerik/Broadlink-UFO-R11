import { describe, it, expect } from 'vitest';
import {
  IRConverter,
  IRCodeError,
  CompressionLevel,
  isSmartIRData,
  countSmartIRCommands,
  type SmartIRData,
} from '../../lib/converter';
import goldenData from '../fixtures/golden-data.json';

describe('isSmartIRData — runtime guard', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['строка', 'not an object'],
    ['число', 42],
    ['массив', []],
    ['объект с commands = массив', { commands: [1, 2, 3] }],
    ['объект с commands = строка', { commands: 'oops' }],
  ])('отвергает %s', (_desc, value) => {
    expect(isSmartIRData(value)).toBe(false);
  });

  it.each([
    ['plain object', {}],
    ['object с commands = объект', { commands: {} }],
    ['object без commands', { supportedController: 'MQTT' }],
  ])('принимает %s', (_desc, value) => {
    expect(isSmartIRData(value)).toBe(true);
  });
});

describe('countSmartIRCommands', () => {
  it('undefined → 0', () => {
    expect(countSmartIRCommands(undefined)).toBe(0);
  });

  it('плоский объект строк', () => {
    expect(countSmartIRCommands({ a: 'x', b: 'y', c: 'z' })).toBe(3);
  });

  it('рекурсивный обход вложенных объектов', () => {
    expect(
      countSmartIRCommands({
        cool: { auto: { '20': 'code1', '21': 'code2' }, low: 'code3' },
        heat: { auto: { '18': 'code4' } },
      })
    ).toBe(4);
  });

  it('пропускает массивы (SmartIR не хранит команды в массивах)', () => {
    expect(countSmartIRCommands({ a: ['code'], b: 'real' })).toBe(1);
  });
});

describe('IRConverter.processSmartIRData', () => {
  const converter = new IRConverter(CompressionLevel.BALANCED);
  const validCode = goldenData.test_input as string;

  it('устанавливает supportedController и commandsEncoding', () => {
    const result = converter.processSmartIRData({ commands: {} });
    expect(result.supportedController).toBe('MQTT');
    expect(result.commandsEncoding).toBe('Raw');
  });

  it('сохраняет остальные поля исходного объекта', () => {
    const input: SmartIRData = {
      manufacturer: 'TestBrand',
      supportedModels: ['X100'],
      commands: {},
    };
    const result = converter.processSmartIRData(input);
    expect(result.manufacturer).toBe('TestBrand');
    expect(result.supportedModels).toEqual(['X100']);
  });

  it('wrapWithIrCode=true оборачивает код в JSON-строку', () => {
    const result = converter.processSmartIRData(
      { commands: { power: validCode } },
      true
    );
    const commands = result.commands as Record<string, string>;
    expect(commands.power).toMatch(/^\{"ir_code_to_send":\s*".+"\}$/);
  });

  it('wrapWithIrCode=false возвращает голый код', () => {
    const result = converter.processSmartIRData(
      { commands: { power: validCode } },
      false
    );
    const commands = result.commands as Record<string, string>;
    expect(commands.power).not.toContain('ir_code_to_send');
  });

  it('рекурсивно обходит вложенные команды', () => {
    const input: SmartIRData = {
      commands: {
        cool: { auto: { '20': validCode, '21': validCode } },
      },
    };
    const result = converter.processSmartIRData(input, false);
    const cool = (result.commands as Record<string, Record<string, Record<string, string>>>).cool;
    expect(typeof cool.auto['20']).toBe('string');
    expect(cool.auto['20']).not.toBe(validCode); // конвертирован
    expect(cool.auto['20']).toBe(cool.auto['21']); // одинаковый вход → одинаковый выход
  });

  it('prototype pollution через __proto__ не подменяет [[Prototype]]', () => {
    // Payload с ключом "__proto__" на верхнем уровне commands: без защиты
    // processed["__proto__"] = innerObject через нативный setter меняет
    // [[Prototype]] аккумулятора → доступ через prototype-цепочку возвращает
    // "внешние" данные. С Object.create(null) __proto__ становится обычным
    // own-property, и посторонний ключ остаётся невидимым.
    const payload = JSON.parse(
      `{"commands":{"__proto__":{"pwned":${JSON.stringify(validCode)}}}}`
    );
    const result = converter.processSmartIRData(payload);
    // pwned не доступен как свойство результата через prototype-цепочку:
    expect((result.commands as Record<string, unknown>).pwned).toBeUndefined();
    // И Object.prototype глобально не загрязнён:
    expect(({} as Record<string, unknown>).pwned).toBeUndefined();
  });

  it('commands=null не бросает TypeError (валидатор отсеивает раньше)', () => {
    // На нижнем уровне processSmartIRData обрабатывает недопустимый
    // commands безопасно — возвращает пустой словарь команд.
    const result = converter.processSmartIRData({ commands: undefined });
    expect(result.commands).toEqual({});
  });

  it.each([
    ['число как лист', { commands: { heat: { '17': 42 } } }, /number/],
    ['boolean как лист', { commands: { power: true as unknown } }, /boolean/],
    ['null как лист', { commands: { off: null } }, /null/],
    ['массив в команде', { commands: { turn_on: ['some-code'] } }, /array/],
  ])('бросает IRCodeError на %s вместо тихого passthrough', (_desc, input, expected) => {
    expect(() =>
      converter.processSmartIRData(input as SmartIRData)
    ).toThrow(IRCodeError);
    expect(() =>
      converter.processSmartIRData(input as SmartIRData)
    ).toThrow(expected as RegExp);
  });
});
