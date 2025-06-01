import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;

/**
 * Obtener instancia de base de datos
 * @returns {Database} Instancia de SQLite
 */
export async function getDatabase() {
  if (!db) {
    const dbPath = join(__dirname, '../../data/translations.db');
    db = new Database(dbPath);
    
    // Configurar base de datos
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    // Ejecutar migraciones si es necesario
    await runMigrations(db);
  }
  
  return db;
}

/**
 * Ejecutar migraciones de base de datos
 * @param {Database} database - Instancia de base de datos
 */
async function runMigrations(database) {
  // Crear tabla de versiones de migración si no existe
  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  const migrations = [
    {
      version: '001_initial_schema',
      sql: `
        -- Tabla de idiomas
        CREATE TABLE IF NOT EXISTS languages (
          id VARCHAR(5) PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          native_name VARCHAR(50),
          is_default BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Tabla de categorías de texto
        CREATE TABLE IF NOT EXISTS text_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT
        );
        
        -- Tabla de claves de texto
        CREATE TABLE IF NOT EXISTS text_keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key VARCHAR(100) UNIQUE NOT NULL,
          category_id INTEGER REFERENCES text_categories(id) ON DELETE SET NULL,
          description TEXT,
          context TEXT,
          max_length INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Tabla de traducciones
        CREATE TABLE IF NOT EXISTS translations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text_key_id INTEGER REFERENCES text_keys(id) ON DELETE CASCADE,
          language_id VARCHAR(5) REFERENCES languages(id) ON DELETE CASCADE,
          translation TEXT NOT NULL,
          is_reviewed BOOLEAN DEFAULT FALSE,
          translator_notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(text_key_id, language_id)
        );
        
        -- Tabla de configuración del sitio
        CREATE TABLE IF NOT EXISTS site_config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key VARCHAR(50) UNIQUE NOT NULL,
          value TEXT,
          description TEXT
        );
        
        -- Índices para mejorar rendimiento
        CREATE INDEX IF NOT EXISTS idx_text_keys_category ON text_keys(category_id);
        CREATE INDEX IF NOT EXISTS idx_text_keys_key ON text_keys(key);
        CREATE INDEX IF NOT EXISTS idx_translations_text_key ON translations(text_key_id);
        CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language_id);
        CREATE INDEX IF NOT EXISTS idx_translations_composite ON translations(text_key_id, language_id);
      `
    },
    {
      version: '002_initial_data',
      sql: `
        -- Insertar idiomas iniciales
        INSERT OR IGNORE INTO languages (id, name, native_name, is_default, is_active) VALUES
        ('es', 'Español', 'Español', true, true),
        ('en', 'Inglés', 'English', false, false),
        ('ca', 'Catalán', 'Català', false, false),
        ('fr', 'Francés', 'Français', false, false);
        
        -- Insertar categorías iniciales
        INSERT OR IGNORE INTO text_categories (key, name, description) VALUES
        ('header', 'Header', 'Textos del encabezado de la página'),
        ('navigation', 'Navegación', 'Enlaces y elementos de navegación'),
        ('content', 'Contenido', 'Textos del contenido principal'),
        ('footer', 'Footer', 'Textos del pie de página'),
        ('forms', 'Formularios', 'Etiquetas y mensajes de formularios'),
        ('buttons', 'Botones', 'Textos de botones y acciones'),
        ('messages', 'Mensajes', 'Mensajes de error, éxito, etc.'),
        ('meta', 'Meta', 'Títulos de página, descripciones SEO, etc.');
      `
    }
  ];
  
  // Ejecutar migraciones pendientes
  for (const migration of migrations) {
    const existing = database.prepare('SELECT version FROM migrations WHERE version = ?').get(migration.version);
    
    if (!existing) {
      console.log(`Ejecutando migración: ${migration.version}`);
      
      // Ejecutar la migración en una transacción
      const transaction = database.transaction(() => {
        database.exec(migration.sql);
        database.prepare('INSERT INTO migrations (version) VALUES (?)').run(migration.version);
      });
      
      try {
        transaction();
        console.log(`Migración ${migration.version} completada exitosamente`);
      } catch (error) {
        console.error(`Error ejecutando migración ${migration.version}:`, error);
        throw error;
      }
    }
  }
}

/**
 * Utilidades para operaciones de base de datos
 */
export class DatabaseUtils {
  /**
   * Crear backup de la base de datos
   * @returns {Promise<string>} Ruta del backup creado
   */
  static async createBackup() {
    const db = await getDatabase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(__dirname, `../../data/backups/translations_${timestamp}.db`);
    
    await db.backup(backupPath);
    return backupPath;
  }
  
  /**
   * Validar integridad de la base de datos
   * @returns {Promise<Object>} Resultado de la validación
   */
  static async validateDatabase() {
    const db = await getDatabase();
    const errors = [];
    const warnings = [];
    
    // Verificar integridad referencial
    const orphanedTranslations = db.prepare(`
      SELECT COUNT(*) as count
      FROM translations t
      LEFT JOIN text_keys tk ON t.text_key_id = tk.id
      WHERE tk.id IS NULL
    `).get();
    
    if (orphanedTranslations.count > 0) {
      errors.push(`${orphanedTranslations.count} traducciones huérfanas encontradas`);
    }
    
    // Verificar idiomas sin traducciones
    const languagesWithoutTranslations = db.prepare(`
      SELECT l.id, l.name
      FROM languages l
      LEFT JOIN translations t ON l.id = t.language_id
      WHERE l.is_active = true AND t.language_id IS NULL
    `).all();
    
    if (languagesWithoutTranslations.length > 0) {
      warnings.push(`Idiomas activos sin traducciones: ${languagesWithoutTranslations.map(l => l.name).join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}