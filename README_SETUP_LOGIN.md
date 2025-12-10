# Setup Login & Protection Features

## 🔑 Login Credentials

File setup.html sekarang dilindungi dengan login. Kredensial disimpan di file `config.json`.

### Default Credentials:
- **Username:** `admin`
- **Password:** `admin123`

### Mengubah Credentials:
Edit file `config.json` dan ubah nilai username dan password:
```json
{
  "setupCredentials": {
    "username": "your_username",
    "password": "your_password"
  }
}
```

## 🛡️ Fitur Proteksi

Setup page dilengkapi dengan berbagai proteksi keamanan:

### 1. **Disable Right-Click**
- Klik kanan dinonaktifkan di seluruh halaman
- Mencegah akses context menu

### 2. **Disable Developer Tools**
- F12 dinonaktifkan
- Ctrl+Shift+I (Inspector) dinonaktifkan
- Ctrl+Shift+J (Console) dinonaktifkan
- Ctrl+Shift+C (Inspect Element) dinonaktifkan
- Ctrl+U (View Source) dinonaktifkan
- Shortcut Mac (Cmd+Option+I/J/C) juga dinonaktifkan

### 3. **DevTools Detection**
- Sistem akan mendeteksi jika developer tools terbuka
- Alert otomatis akan muncul

### 4. **Disable Copy & Text Selection**
- Copy text dinonaktifkan
- Text selection dinonaktifkan

### 5. **Console Clearing**
- Console dibersihkan secara periodik setiap 1 detik

## 📋 Cara Menggunakan

1. Buka `setup.html`
2. Masukkan username dan password
3. Klik tombol "Login"
4. Jika berhasil, halaman setup akan ditampilkan
5. Session login disimpan di sessionStorage (hilang saat browser ditutup)

## ⚙️ Technical Details

- Login session menggunakan `sessionStorage` (temporary)
- Credentials disimpan di file `config.json`
- Fallback ke credentials default jika file tidak ditemukan
- Semua proteksi aktif sejak halaman dimuat

## 🔐 Keamanan

> **CATATAN:** Meskipun sudah ada berbagai proteksi, file `config.json` tetap dapat diakses secara langsung via URL. Untuk keamanan maksimal, disarankan untuk:
> - Menggunakan sistem autentikasi server-side
> - Menyimpan credentials di database
> - Menggunakan HTTPS
> - Implementasi rate limiting untuk login attempts

## 📝 Files Modified

1. `setup.html` - Added login form UI
2. `setup.js` - Added login logic and protection features
3. `config.json` - New file for storing credentials

---
**Created:** 2025-12-10  
**Version:** 1.0
