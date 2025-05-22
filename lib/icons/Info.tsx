import Feather from 'react-native-vector-icons/Feather';
import { iconWithClassName } from './iconWithClassName';
import React from 'react';

const Info = (props: { size?: number; color?: string; style?: any }) => {
  return <Feather name="info" {...props} />;
};

iconWithClassName(Info);
export { Info };