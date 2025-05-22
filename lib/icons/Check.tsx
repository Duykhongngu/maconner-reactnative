import Feather from 'react-native-vector-icons/Feather';
import { iconWithClassName } from './iconWithClassName';
import React from 'react';

const Check = (props: { size?: number; color?: string; style?: any }) => {
  return <Feather name="check" {...props} />;
};

iconWithClassName(Check);
export { Check };