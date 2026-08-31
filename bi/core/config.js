window.SintropiaConfig = Object.freeze({
  appName: 'BASE Sintropia BI',
  version: '0.3.0-crud',
  mode: 'demo-local',
  supabase: {
    enabled: false,
    url: '',
    anonKey: ''
  },
  security: {
    requireMfaForCriticalRoles: true,
    sessionMinutes: 60,
    exportSoftLimit: 500,
    exportHardLimit: 5000
  },
  data: {
    namespace: 'base-sintropia-bi',
    schemaVersion: 3
  }
});
