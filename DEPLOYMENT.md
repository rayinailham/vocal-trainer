# Vocal Trainer Deployment Guide

This guide provides instructions for deploying the Vocal Trainer application to production.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## Build for Production

1. Install dependencies:
```bash
npm install
```

2. Build the application:
```bash
npm run build
```

3. Start the production server:
```bash
npm start
```

## Deployment Options

### 1. Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and deploy
4. Configure environment variables if needed

### 2. Netlify

1. Build the application:
```bash
npm run build
```

2. Deploy the `.next` folder to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `.next`

### 3. Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t vocal-trainer .
docker run -p 3000:3000 vocal-trainer
```

### 4. Traditional VPS

1. Clone the repository
2. Install dependencies: `npm install --production`
3. Build: `npm run build`
4. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "vocal-trainer" -- start
```

## Environment Variables

The application doesn't require any mandatory environment variables, but you can configure:

- `NODE_ENV`: Set to `production` for production builds
- `PORT`: Custom port (default: 3000)

## Performance Considerations

1. **HTTPS**: Ensure HTTPS is enabled for microphone access
2. **Compression**: Enable gzip/brotli compression
3. **Caching**: Configure proper caching headers for static assets
4. **CDN**: Use a CDN for static assets in production

## Security Headers

The application includes security headers by default:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin

## Monitoring

Monitor the following metrics in production:
- Page load time
- Audio processing latency
- Memory usage
- Error rates

## Troubleshooting

### Microphone not working
- Ensure HTTPS is enabled
- Check browser permissions
- Verify audio context is supported

### Build errors
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all dependencies are installed

### Performance issues
- Check bundle size with `npm run build`
- Monitor memory usage
- Optimize audio processing frequency

## Browser Support

The application supports:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Updates

To update the application:
1. Pull latest changes
2. Run `npm install`
3. Run `npm run build`
4. Restart the server