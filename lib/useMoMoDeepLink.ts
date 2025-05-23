import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { setupMoMoDeepLinking } from '~/service/momo';

/**
 * Hook để thiết lập và quản lý DeepLinks của MoMo
 */
export const useMoMoDeepLink = () => {
  const [isSetup, setIsSetup] = useState(false);
  const [lastDeepLink, setLastDeepLink] = useState<string | null>(null);

  // Thiết lập DeepLink khi component mount
  useEffect(() => {
    // Đảm bảo chỉ setup một lần
    if (isSetup) return;

    console.log('Setting up MoMo DeepLink handling...');
    
    // Thiết lập deep linking cho MoMo
    setupMoMoDeepLinking();
    
    // Lắng nghe các sự kiện deep link
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Received URL in hook:', url);
      setLastDeepLink(url);
    });

    // Kiểm tra URL ban đầu
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('Initial URL in hook:', url);
        setLastDeepLink(url);
      }
    });

    setIsSetup(true);

    // Dọn dẹp khi component unmount
    return () => {
      subscription.remove();
    };
  }, [isSetup]);

  return {
    lastDeepLink,
    isSetup
  };
};

export default useMoMoDeepLink; 