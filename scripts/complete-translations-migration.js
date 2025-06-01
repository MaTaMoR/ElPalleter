import { getDatabase } from '../src/utils/database.js';

/**
 * Datos completos de traducciones para El Palleter
 */
const translationsData = [
  // Site General
  {
    key: 'site.title',
    category: 'header',
    description: 'Título principal del sitio',
    context: 'Header y meta title',
    translations: {
      es: 'El Palleter - Restaurante Tradicional',
      en: 'El Palleter - Traditional Restaurant',
      ca: 'El Palleter - Restaurant Tradicional'
    }
  },
  {
    key: 'site.tagline',
    category: 'header',
    description: 'Eslogan del restaurante',
    context: 'Subtítulo descriptivo',
    translations: {
      es: 'Auténtica cocina mediterránea en el corazón de Valencia',
      en: 'Authentic Mediterranean cuisine in the heart of Valencia',
      ca: 'Autèntica cuina mediterrània al cor de València'
    }
  },
  
  // Navigation
  {
    key: 'nav.home',
    category: 'navigation',
    description: 'Enlace de inicio',
    translations: {
      es: 'Inicio',
      en: 'Home',
      ca: 'Inici'
    }
  },
  {
    key: 'nav.menu',
    category: 'navigation',
    description: 'Enlace al menú',
    translations: {
      es: 'Carta',
      en: 'Menu',
      ca: 'Carta'
    }
  },
  {
    key: 'nav.about',
    category: 'navigation',
    description: 'Enlace sobre nosotros',
    translations: {
      es: 'Sobre Nosotros',
      en: 'About Us',
      ca: 'Sobre Nosaltres'
    }
  },
  {
    key: 'nav.contact',
    category: 'navigation',
    description: 'Enlace de contacto',
    translations: {
      es: 'Contacto',
      en: 'Contact',
      ca: 'Contacte'
    }
  },
  {
    key: 'nav.reservations',
    category: 'navigation',
    description: 'Enlace para reservas',
    translations: {
      es: 'Reservas',
      en: 'Reservations',
      ca: 'Reserves'
    }
  },
  
  // Hero Section
  {
    key: 'hero.title',
    category: 'content',
    description: 'Título principal de la página de inicio',
    context: 'Sección hero',
    translations: {
      es: 'Bienvenidos a El Palleter',
      en: 'Welcome to El Palleter',
      ca: 'Benvinguts a El Palleter'
    }
  },
  {
    key: 'hero.subtitle',
    category: 'content',
    description: 'Subtítulo de la sección hero',
    translations: {
      es: 'Donde la tradición culinaria valenciana cobra vida en cada plato',
      en: 'Where Valencian culinary tradition comes alive in every dish',
      ca: 'On la tradició culinària valenciana pren vida en cada plat'
    }
  },
  {
    key: 'hero.cta_button',
    category: 'buttons',
    description: 'Botón de llamada a la acción',
    translations: {
      es: 'Ver Nuestra Carta',
      en: 'View Our Menu',
      ca: 'Veure la Nostra Carta'
    }
  },
  {
    key: 'hero.cta_reservations',
    category: 'buttons',
    description: 'Botón secundario de reservas',
    translations: {
      es: 'Reservar Mesa',
      en: 'Book Table',
      ca: 'Reservar Taula'
    }
  },
  
  // Menu Categories
  {
    key: 'menu.starters',
    category: 'content',
    description: 'Título de entrantes',
    translations: {
      es: 'Entrantes',
      en: 'Starters',
      ca: 'Entrants'
    }
  },
  {
    key: 'menu.mains',
    category: 'content',
    description: 'Título de platos principales',
    translations: {
      es: 'Platos Principales',
      en: 'Main Courses',
      ca: 'Plats Principals'
    }
  },
  {
    key: 'menu.desserts',
    category: 'content',
    description: 'Título de postres',
    translations: {
      es: 'Postres',
      en: 'Desserts',
      ca: 'Postres'
    }
  },
  {
    key: 'menu.drinks',
    category: 'content',
    description: 'Título de bebidas',
    translations: {
      es: 'Bebidas',
      en: 'Drinks',
      ca: 'Begudes'
    }
  },
  
  // Footer
  {
    key: 'footer.address',
    category: 'footer',
    description: 'Dirección del restaurante',
    translations: {
      es: 'Calle Mayor, 123, 46001 Valencia',
      en: 'Calle Mayor, 123, 46001 Valencia',
      ca: 'Carrer Major, 123, 46001 València'
    }
  },
  {
    key: 'footer.phone',
    category: 'footer',
    description: 'Teléfono del restaurante',
    translations: {
      es: '+34 963 123 456',
      en: '+34 963 123 456',
      ca: '+34 963 123 456'
    }
  },
  {
    key: 'footer.email',
    category: 'footer',
    description: 'Email del restaurante',
    translations: {
      es: 'info@elpalleter.com',
      en: 'info@elpalleter.com',
      ca: 'info@elpalleter.com'
    }
  },
  {
    key: 'footer.hours',
    category: 'footer',
    description: 'Horarios de apertura',
    translations: {
      es: 'Lun-Dom: 13:00-16:00, 20:00-24:00',
      en: 'Mon-Sun: 1:00PM-4:00PM, 8:00PM-12:00AM',
      ca: 'Dll-Dg: 13:00-16:00, 20:00-24:00'
    }
  },
  
  // Messages
  {
    key: 'messages.success',
    category: 'messages',
    description: 'Mensaje de éxito',
    translations: {
      es: 'Operación realizada con éxito',
      en: 'Operation completed successfully',
      ca: 'Operació realitzada amb èxit'
    }
  },
  {
    key: 'messages.error',
    category: 'messages',
    description: 'Mensaje de error',
    translations: {
      es: 'Ha ocurrido un error. Por favor, inténtalo de nuevo.',
      en: 'An error occurred. Please try again.',
      ca: 'Ha ocorregut un error. Per favor, intenta-ho de nou.'
    }
  }
  
  // ... (se pueden añadir más traducciones aquí)
];

/**
 * Ejecutar migración completa de traducciones
 */
export async function runCompleteTranslationsMigration() {
  console.log('🌍 Iniciando migración completa de traducciones...\n');
  
  try {
    const db = await getDatabase();
    
    // Iniciar transacción
    const transaction = db.transaction(() => {
      console.log('📝 Insertando categorías...');
      
      // Crear categorías si no existen
      const categories = [...new Set(translationsData.map(item => item.category))];
      const insertCategoryStmt = db.prepare(`
        INSERT OR IGNORE INTO text_categories (key, name, description)
        VALUES (?, ?, ?)
      `);
      
      categories.forEach(category => {
        const categoryNames = {
          header: 'Header',
          navigation: 'Navegación',
          content: 'Contenido',
          buttons: 'Botones',
          forms: 'Formularios',
          footer: 'Footer',
          messages: 'Mensajes',
          meta: 'Meta Tags'
        };
        
        insertCategoryStmt.run(
          category,
          categoryNames[category] || category,
          `Textos de ${category}`
        );
      });
      
      console.log(`✅ ${categories.length} categorías procesadas`);
      console.log('📝 Insertando claves de texto...');
      
      // Insertar claves de texto
      const insertTextKeyStmt = db.prepare(`
        INSERT OR REPLACE INTO text_keys (key, category_id, description, context, max_length, updated_at)
        VALUES (?, (SELECT id FROM text_categories WHERE key = ?), ?, ?, ?, datetime('now'))
      `);
      
      translationsData.forEach(item => {
        insertTextKeyStmt.run(
          item.key,
          item.category,
          item.description,
          item.context || null,
          item.maxLength || null
        );
      });
      
      console.log(`✅ ${translationsData.length} claves de texto procesadas`);
      console.log('🗣️ Insertando traducciones...');
      
      // Insertar traducciones
      const insertTranslationStmt = db.prepare(`
        INSERT OR REPLACE INTO translations (text_key_id, language_id, translation, is_reviewed, updated_at)
        VALUES ((SELECT id FROM text_keys WHERE key = ?), ?, ?, ?, datetime('now'))
      `);
      
      let translationCount = 0;
      const languages = ['es', 'en', 'ca'];
      
      translationsData.forEach(item => {
        languages.forEach(lang => {
          if (item.translations[lang]) {
            insertTranslationStmt.run(
              item.key,
              lang,
              item.translations[lang],
              lang === 'es' ? 1 : 0 // Marcar español como revisado por defecto
            );
            translationCount++;
          }
        });
      });
      
      console.log(`✅ ${translationCount} traducciones insertadas`);
      
      // Activar idiomas
      console.log('🔧 Configurando idiomas...');
      const updateLanguageStmt = db.prepare(`
        UPDATE languages 
        SET is_active = 1 
        WHERE id IN ('es', 'en', 'ca')
      `);
      updateLanguageStmt.run();
      
      console.log('✅ Idiomas activados: Español, Inglés, Catalán');
    });
    
    // Ejecutar transacción
    transaction();
    
    console.log('\n🎉 Migración completa de traducciones finalizada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

// Función principal para ejecutar desde línea de comandos
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'migrate':
        await runCompleteTranslationsMigration();
        break;
      default:
        console.log('Comandos disponibles:');
        console.log('  migrate - Ejecutar migración de traducciones');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}