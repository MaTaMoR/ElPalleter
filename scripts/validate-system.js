import { getDatabase, DatabaseUtils } from '../src/utils/database.js';
import { TranslationManager } from '../src/utils/translation-utils.js';

/**
 * Validar sistema completo
 */
export async function validateCompleteSystem() {
  console.log('🔍 Ejecutando validación completa del sistema i18n...\n');
  
  let hasErrors = false;
  let hasWarnings = false;

  try {
    // 1. Validación de Base de Datos
    console.log('📄 Validando base de datos...');
    const dbValid = await validateDatabase();
    hasErrors = hasErrors || !dbValid.isValid;
    hasWarnings = hasWarnings || dbValid.warnings.length > 0;

    // 2. Validación de Traducciones
    console.log('🗣️ Validando traducciones...');
    const translationsValid = await validateTranslations();
    hasErrors = hasErrors || !translationsValid.isValid;
    hasWarnings = hasWarnings || translationsValid.warnings.length > 0;

    // 3. Validación de Archivos
    console.log('📁 Validando archivos del sistema...');
    const filesValid = await validateSystemFiles();
    hasErrors = hasErrors || !filesValid.isValid;

    // Resumen final
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE VALIDACIÓN');
    console.log('='.repeat(80));
    
    if (hasErrors) {
      console.log('\n❌ Sistema con errores críticos. Revisar antes de deployment.');
    } else if (hasWarnings) {
      console.log('\n⚠️ Sistema funcional con advertencias. Recomendable revisar.');
    } else {
      console.log('\n🎉 ¡Sistema completamente validado y listo para producción!');
    }

    return !hasErrors;

  } catch (error) {
    console.error('❌ Error durante la validación:', error);
    return false;
  }
}

/**
 * Validar base de datos
 */
async function validateDatabase() {
  const result = { isValid: true, warnings: [] };
  
  try {
    const db = await getDatabase();
    
    // Verificar tablas principales
    const tables = ['languages', 'text_categories', 'text_keys', 'translations'];
    for (const table of tables) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        console.log(`  ✅ Tabla ${table}: ${count.count} registros`);
      } catch (error) {
        console.error(`  ❌ Error en tabla ${table}: ${error.message}`);
        result.isValid = false;
      }
    }

    // Validar integridad referencial
    const validation = await DatabaseUtils.validateDatabase();
    if (!validation.isValid) {
      console.error('  ❌ Problemas de integridad referencial encontrados');
      result.isValid = false;
    }
    
    result.warnings = validation.warnings;

  } catch (error) {
    console.error(`  ❌ No se pudo conectar a la base de datos: ${error.message}`);
    result.isValid = false;
  }

  return result;
}

/**
 * Validar traducciones
 */
async function validateTranslations() {
  const result = { isValid: true, warnings: [] };
  
  try {
    const manager = TranslationManager.getInstance();
    await manager.loadTranslations();
    
    const db = await getDatabase();
    const languages = db.prepare('SELECT * FROM languages WHERE is_active = 1').all();

    // Validar completitud por idioma
    for (const lang of languages) {
      const completeness = manager.getLanguageCompleteness(lang.id);
      const missingKeys = manager.getMissingKeys(lang.id);
      
      if (completeness < 100) {
        if (completeness < 80) {
          console.error(`  ❌ ${lang.name} (${lang.id}): ${completeness}% - Crítico: ${missingKeys.length} claves faltantes`);
          result.isValid = false;
        } else {
          console.warn(`  ⚠️ ${lang.name} (${lang.id}): ${completeness}% - ${missingKeys.length} claves faltantes`);
          result.warnings.push(`${lang.name} incompleto`);
        }
      } else {
        console.log(`  ✅ ${lang.name} (${lang.id}): ${completeness}% completo`);
      }
    }

  } catch (error) {
    console.error(`  ❌ Error cargando traducciones: ${error.message}`);
    result.isValid = false;
  }

  return result;
}

/**
 * Validar archivos del sistema
 */
async function validateSystemFiles() {
  const result = { isValid: true };
  const fs = await import('fs/promises');
  const path = await import('path');

  // Archivos requeridos
  const requiredFiles = [
    'src/components/i18n/Text.astro',
    'src/components/i18n/LanguageSwitcher.astro',
    'src/utils/database.js',
    'src/utils/translation-utils.js',
    'astro.config.mjs'
  ];

  for (const file of requiredFiles) {
    try {
      await fs.access(path.join(process.cwd(), file));
      console.log(`  ✅ ${file} encontrado`);
    } catch (error) {
      console.error(`  ❌ ${file} no encontrado`);
      result.isValid = false;
    }
  }

  return result;
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  validateCompleteSystem().then(success => {
    process.exit(success ? 0 : 1);
  });
}