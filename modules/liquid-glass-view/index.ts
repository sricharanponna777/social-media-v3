// Reexport the native module. On web, it will be resolved to LiquidGlassViewModule.web.ts
// and on native platforms to LiquidGlassViewModule.ts
export { default } from './src/LiquidGlassViewModule';
export { default as LiquidGlassView } from './src/LiquidGlassView';
export * from  './src/LiquidGlassView.types';
