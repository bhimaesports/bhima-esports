import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function SEO() {
  const { settings } = useApp();

  useEffect(() => {
    if (settings?.cms_seo_title) {
      document.title = settings.cms_seo_title;
    }
    
    if (settings?.cms_seo_description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', settings.cms_seo_description);
    }
    
    if (settings?.cms_seo_keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', settings.cms_seo_keywords);
    }
  }, [settings?.cms_seo_title, settings?.cms_seo_description, settings?.cms_seo_keywords]);

  return null; // This component doesn't render anything
}
