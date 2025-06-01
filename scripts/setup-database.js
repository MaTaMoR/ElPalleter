import { getDatabase, DatabaseUtils } from '../src/utils/database.js';

/**
 * Configurar base de datos inicial
 */
export async function setupDatabase() {
  console.log('Iniciando configuración de la base de datos...');
  
  try {
    // Crear directorio de datos si no existe
    const fs = await import('fs/promises');
    const path = await import('path');
    const dataDir = path.join(process.cwd(), 'src', 'data');
    const backupsDir = path.join(dataDir, 'backups');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.mkdir(backupsDir, { recursive: true });
    } catch (error) {
      // Los directorios ya existen
    }
    
    // Inicializar base de datos
    const db = await getDatabase();
    
    console.log('Base de datos configurada exitosamente');
    
    // Validar la base de datos
    const validation = await DatabaseUtils.validateDatabase();
    
    if (validation.isValid) {
      console.log('✅ Base de datos válida');
    } else {
      console.log('❌ Errores en la base de datos:');
      validation.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (validation.warnings.length > 0) {
      console.log('⚠️ Advertencias:');
      validation.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
  } catch (error) {
    console.error('Error configurando la base de datos:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}