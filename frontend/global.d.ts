// Ambient-декларация для side-effect импортов CSS (например, import "./globals.css").
// Начиная с TypeScript 6, для импортов не-кода требуется явное объявление модуля,
// иначе сборка падает с ошибкой "Cannot find module ... for side-effect import".
declare module "*.css";
