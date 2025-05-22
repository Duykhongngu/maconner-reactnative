import Feather from 'react-native-vector-icons/Feather';
import { iconWithClassName } from './iconWithClassName';
import React from 'react';

const ChevronUp = (props: { size?: number; color?: string; style?: any }) => {
  return <Feather name="chevron-up" {...props} />;
};

iconWithClassName(ChevronUp);
export { ChevronUp };