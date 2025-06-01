import { getDatabase } from '../../utils/database.js';

export const POST = async ({ request }) => {
  try {
    const { key, category, description, context, maxLength, defaultTranslation } = await request.json();
    
    const db = await getDatabase();
    
    // Verificar si la clave ya existe
    const existingKey = db.prepare('SELECT id FROM text_keys WHERE key = ?').get(key);
    if (existingKey) {
      return new Response(JSON.stringify({ 
        error: 'Text key already exists' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Obtener o crear categoría
    let categoryRecord = db.prepare('SELECT id FROM text_categories WHERE key = ?').get(category);
    if (!categoryRecord) {
      const categoryResult = db.prepare(
        'INSERT INTO text_categories (key, name) VALUES (?, ?)'
      ).run(category, category.charAt(0).toUpperCase() + category.slice(1));
      categoryRecord = { id: categoryResult.lastInsertRowid };
    }
    
    // Insertar nueva clave de texto
    const textKeyResult = db.prepare(`
      INSERT INTO text_keys (key, category_id, description, context, max_length, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(key, categoryRecord.id, description, context, maxLength);
    
    // Añadir traducción por defecto en español
    if (defaultTranslation) {
      db.prepare(`
        INSERT INTO translations (text_key_id, language_id, translation, is_reviewed, created_at, updated_at)
        VALUES (?, 'es', ?, true, datetime('now'), datetime('now'))
      `).run(textKeyResult.lastInsertRowid, defaultTranslation);
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      id: textKeyResult.lastInsertRowid,
      key 
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating text key:', error);
    return new Response(JSON.stringify({ 
      error: 'Error creating text key' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};