import { requireNativeView } from 'expo';
import * as React from 'react';

import { LiquidGlassViewProps } from './LiquidGlassView.types';

const NativeView: React.ComponentType<LiquidGlassViewProps> =
  requireNativeView('LiquidGlassViewModule', 'LiquidGlassView');

export default function LiquidGlassView(props: LiquidGlassViewProps) {
  return <NativeView {...props}>{props.children}</NativeView>;
}
