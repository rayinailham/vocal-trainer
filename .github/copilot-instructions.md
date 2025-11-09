# Next.js Starter - Instruksi Agen AI

## Gambaran Arsitektur
- **Framework**: Next.js 15 dengan App Router (bukan Pages Router)
- **Bahasa**: TypeScript dengan mode strict diaktifkan
- **Styling**: Tailwind CSS dengan properti CSS kustom untuk tema
- **Linting**: ESLint dengan konfigurasi standar Next.js dan beberapa aturan khusus
- **Build Tool**: Turbopack untuk development, build standar Next.js untuk production

## Alias Path (Kritis)
Selalu gunakan alias ini untuk import - mereka dikonfigurasi di `tsconfig.json` dan `next.config.js`:

```typescript
import { util } from '@/lib/utils'              // ./src/lib/
import styles from '@/styles/globals.css'       // ./src/styles/
import type User from '@/types/user'            // ./src/types/
import { hook } from '@/hooks/useHook'          // ./src/hooks/
```

## Pola Styling
- Gunakan kelas utilitas Tailwind terutama
- Variabel CSS kustom didefinisikan di `:root` untuk warna tema
- Dukungan dark mode melalui media query `prefers-color-scheme`
- Properti CSS kustom: `--background`, `--foreground`

## Arsitektur Komponen
- **Modul Global**: Untuk utils, service, hooks, store, dan modul lainnya, tetap gunakan yang global dan diimpor dari folder yang sesuai (misalnya `@/lib/utils`, `@/hooks/useHook`).

