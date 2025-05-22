import Feather from 'react-native-vector-icons/Feather';
import { iconWithClassName } from './iconWithClassName';
import React from 'react';

const ChevronDown = (props: { size?: number; color?: string; style?: any }) => {
  return <Feather name="chevron-down" {...props} />;
};

iconWithClassName(ChevronDown);
export { ChevronDown };