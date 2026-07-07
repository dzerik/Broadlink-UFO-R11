import pkg from "../../package.json";

/** Версия приложения из package.json, подставляется на билд-тайме. */
export const APP_VERSION: string = pkg.version;
