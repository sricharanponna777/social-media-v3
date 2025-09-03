import { NativeModule, requireNativeModule } from 'expo';

import { LiquidGlassViewModuleEvents } from './LiquidGlassView.types';

declare class LiquidGlassViewModule extends NativeModule<LiquidGlassViewModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<LiquidGlassViewModule>('LiquidGlassView');
