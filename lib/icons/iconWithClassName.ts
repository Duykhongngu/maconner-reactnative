import type { ComponentType } from 'react';
import { cssInterop } from 'nativewind';

// Define a type for icon components from react-native-vector-icons
export type IconComponent = ComponentType<{
  name: string;
  size?: number;
  color?: string;
  style?: any;
}>;

export function iconWithClassName(icon: IconComponent) {
  cssInterop(icon, {
    className: {
      target: 'style',
    },
  });
}
