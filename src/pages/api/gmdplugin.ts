// pages/gmdplugin.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const GMDPluginRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Google
    router.replace('https://www.google.com');
  }, [router]);

  return null; // Optionally add a loading spinner here if you like
};

export default GMDPluginRedirect;
