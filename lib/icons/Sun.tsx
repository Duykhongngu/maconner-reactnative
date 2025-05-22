import Feather from 'react-native-vector-icons/Feather';
import { iconWithClassName } from './iconWithClassName';
import React from 'react';

const Sun = (props: { size?: number; color?: string; style?: any }) => {
  return <Feather name="sun" {...props} />;
};

iconWithClassName(Sun);
export { Sun };