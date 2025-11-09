# Next.js Starter Template

Template Next.js modern dengan TypeScript dan Tailwind CSS.

## Struktur Folder

```
nextjs-starter/
├── src/
│   ├── app/           # Halaman Next.js dengan App Router
│   │   ├── layout.tsx # Root layout
│   │   └── page.tsx   # Halaman utama
│   ├── styles/        # File CSS global
│   ├── lib/           # Utilitas dan helper functions
│   ├── hooks/         # Custom React hooks (opsional)
│   └── types/         # TypeScript type definitions (opsional)
├── public/            # Asset statis
├── tailwind.config.js # Konfigurasi Tailwind CSS
├── next.config.js     # Konfigurasi Next.js
├── eslint.config.mjs  # Konfigurasi ESLint
└── tsconfig.json      # Konfigurasi TypeScript
```

## Fitur

- ✅ Next.js 15 dengan App Router
- ✅ TypeScript dengan mode strict
- ✅ Tailwind CSS
- ✅ Turbopack untuk development yang cepat
- ✅ Custom path aliases
- ✅ ESLint dengan konfigurasi optimal
- ✅ Arsitektur komponen page yang tidak modular
- ✅ Utility functions dengan clsx dan tailwind-merge
- ✅ Type definitions lengkap

## Teknologi Utama

- **Framework**: Next.js 15.5.5
- **Bahasa**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.6
- **Linting**: ESLint 9
- **Build Tool**: Turbopack (dev), Next.js build (prod)

## Quick Start

```bash
# Clone repository
git clone <repository-url>
cd nextjs-starter

# Install dependencies
npm install

# Jalankan development server
npm run dev

# Buka http://localhost:3000 di browser
```

## Scripts

- `npm run dev` - Menjalankan development server dengan Turbopack
- `npm run build` - Build aplikasi untuk production
- `npm run start` - Menjalankan production server
- `npm run lint` - Menjalankan ESLint
- `npm run type-check` - Cek TypeScript errors

## Path Aliases

Template ini menggunakan path aliases untuk import yang lebih bersih:

```typescript
import { cn } from '@/lib/utils'
import type { User } from '@/types'
import styles from '@/styles/globals.css'
import { useCustomHook } from '@/hooks/useCustomHook'
```

Available aliases:
- `@/*` → `./src/*`
- `@/app/*` → `./src/app/*`
- `@/lib/*` → `./src/lib/*`
- `@/utils/*` → `./src/utils/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/types/*` → `./src/types/*`
- `@/styles/*` → `./src/styles/*`
- `@/public/*` → `./public/*`

## Customization

Template ini dirancang untuk dikustomisasi sesuai kebutuhan project Anda:

1. **Komponen Page**: Semua komponen yang dibutuhkan oleh suatu page harus didefinisikan langsung di dalam file page tersebut, bukan diimpor dari folder components.

2. **Modul Global**: Untuk utils, service, hooks, store, dan modul lainnya, tetap gunakan yang global dan diimpor dari folder yang sesuai (misalnya `@/lib/utils`, `@/hooks/useHook`).

3. **Styling**: Gunakan Tailwind CSS classes terutama. Variabel CSS kustom sudah didefinisikan di `:root` untuk tema.

4. **Dark Mode**: Mendukung dark mode melalui `prefers-color-scheme` media query.

## Dokumentasi Tambahan

Lihat file-file di src/ untuk contoh implementasi.

## Lisensi

Template ini dibuat untuk keperluan development dan dapat dimodifikasi sesuai kebutuhan.