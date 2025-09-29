'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Skip service worker in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Skipping service worker registration');
      
      // Clean up any existing service workers in development
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          if (registrations.length > 0) {
            console.log('Development mode: Cleaning up existing service workers');
            registrations.forEach(registration => {
              registration.unregister();
            });
          }
        });
        
        // Clear all caches in development
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            if (cacheNames.length > 0) {
              console.log('Development mode: Clearing all caches');
              cacheNames.forEach(cacheName => {
                caches.delete(cacheName);
              });
            }
          });
        }
      }
      return;
    }

    // Only register service worker in production
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available, reloading...');
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}