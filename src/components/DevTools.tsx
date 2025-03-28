'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { scan } from 'react-scan'

const reactScanFixScript = /* javascript */ `
  // Hack: override Reflect.has to avoid the error in reactive components
  (function() {
    console.log('🥷 [DevTools] applying hack fix')
    Reflect.has = function(target, prop) {
      try { return Reflect.has(target, prop) } catch { return false }
    };
    
    // filter out annoying logs
    const originalConsoleLog = console.log;
    
    console.log = function(...args) {
      const message = args.join(' ');
      if (
        message.includes('[Fast Refresh]') ||
        message.includes('React Scan')
      ) {
        return; // Don't log these logs
      }
      originalConsoleLog(...args); // Show the rest of the logs
    };
  })();
`

export function DevTools() {
    useEffect(() => {
        scan({
            showToolbar: false,
            enabled: false,
            log: false,
        })
    }, [])

    return (
        <Script
            id='react-scan-fix'
            strategy='afterInteractive'
            dangerouslySetInnerHTML={{
                __html: reactScanFixScript,
            }}
        />
    )
}
