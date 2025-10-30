let banubaPromise = null

export function loadBanubaSDK(
  src = 'https://cdn.jsdelivr.net/npm/@banuba/webar/dist/BanubaSDK.browser.js'
) {
  if (typeof window !== 'undefined' && window.BanubaSDK) {
    return Promise.resolve(window.BanubaSDK)
  }
  if (banubaPromise) return banubaPromise

  banubaPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('No document to load Banuba SDK'))
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve(window.BanubaSDK)
    script.onerror = () => reject(new Error('Failed to load Banuba SDK'))
    document.head.appendChild(script)
  })

  return banubaPromise
}

