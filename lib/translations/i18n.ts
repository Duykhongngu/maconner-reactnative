import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import vi from './vi';


i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      vi: {
        translation: vi,
      },
    },
    lng: 'vi', // ngôn ngữ mặc định
    fallbackLng: 'en', // ngôn ngữ dự phòng nếu ngôn ngữ hiện tại không có bản dịch
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;