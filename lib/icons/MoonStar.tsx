import Feather from 'react-native-vector-icons/Feather';
import { iconWithClassName } from './iconWithClassName';
import React from 'react';

const MoonStar = (props: { size?: number; color?: string; style?: any }) => {
  return <Feather name="moon" {...props} />;
};

iconWithClassName(MoonStar);
export { MoonStar };