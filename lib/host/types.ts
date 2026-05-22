export type HostMode = 'hub' | 'showcase'

export interface HostResolution {
  mode:            HostMode
  slug:            string | null
  defaultLocale:   'de' | 'en'
  useLocalePrefix: boolean
}
