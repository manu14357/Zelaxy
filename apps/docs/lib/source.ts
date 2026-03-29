import { docs } from 'collections/server'
import { loader } from 'fumadocs-core/source'
import { coloredIconsPlugin } from './colored-icons'

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [coloredIconsPlugin()],
})
