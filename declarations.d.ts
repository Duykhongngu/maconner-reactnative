declare module "*.svg" {
    import React from 'react';
    import { SvgProps } from "react-native-svg";
    const content: React.FC<SvgProps>;
    export default content;
  }
  // declarations.d.ts
declare module "expo-image-picker" {
  namespace ImagePicker {
    enum MediaType {
      image = "image",
      video = "video",
    }
  }
}