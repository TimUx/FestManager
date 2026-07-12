export interface DbConnectionConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export function parseDatabaseUrl(url: string): DbConnectionConfig {
  if (!url.trim()) {
    throw new Error('DATABASE_URL fehlt');
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('DATABASE_URL ist ungültig');
  }
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL muss postgresql:// verwenden');
  }
  const database = parsed.pathname.replace(/^\//, '').split('?')[0];
  if (!database) {
    throw new Error('DATABASE_URL enthält keinen Datenbanknamen');
  }
  return {
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    host: parsed.hostname || 'postgres',
    port: parsed.port ? Number(parsed.port) : 5432,
    database,
  };
}
