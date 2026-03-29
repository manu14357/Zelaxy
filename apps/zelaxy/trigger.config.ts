import { defineConfig } from '@trigger.dev/sdk/v3'

export default defineConfig({
  project: 'proj_zunnejsqpkvkzywyajao',
  runtime: 'node',
  logLevel: 'log',
  maxDuration: 180,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 1,
    },
  },
  dirs: ['./background'],
  build: {
    extensions: [
      {
        name: 'increase-memory',
        onBuildComplete(context) {
          // Increase Node.js heap memory for workers that process
          // file attachments (PDF parsing, DWG parsing, etc.)
          if (context.target === 'dev') {
            process.env.NODE_OPTIONS = '--max-old-space-size=1024'
          }
        },
      },
    ],
  },
})
