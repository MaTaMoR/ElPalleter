import { getDatabase } from '../../../utils/database.js';

export const GET = async () => {
  try {
    const db = await getDatabase();
    
    // Obtener todas las traducciones con información relacionada
    const query = `
      SELECT 
        t.id,
        t.translation,
        t.is_reviewed as "isReviewed",
        t.translator_notes as "translatorNotes",
        t.updated_at as "updatedAt",
        tk.key,
        tk.description,
        tk.context,
        tk.max_length as "maxLength",
        tc.key as category,
        l.id as "languageId",
        l.name as "languageName"
      FROM translations t
      JOIN text_keys tk ON t.text_key_id = tk.id
      JOIN text_categories tc ON tk.category_id = tc.id
      JOIN languages l ON t.language_id = l.id
      WHERE l.is_active = true
      ORDER BY tk.key, l.id
    `;
    
    const translations = db.prepare(query).all();
    
    // Obtener idiomas activos
    const languages = db.prepare(`
      SELECT id, name, native_name as "nativeName", is_default as "isDefault", is_active as "isActive"
      FROM languages 
      WHERE is_active = true
      ORDER BY is_default DESC, name
    `).all();
    
    // Obtener todas las claves de texto
    const textKeys = db.prepare(`
      SELECT 
        tk.id,
        tk.key,
        tk.description,
        tk.context,
        tk.max_length as "maxLength",
        tk.created_at as "createdAt",
        tk.updated_at as "updatedAt",
        tc.key as category
      FROM text_keys tk
      JOIN text_categories tc ON tk.category_id = tc.id
      ORDER BY tk.key
    `).all();
    
    return new Response(JSON.stringify({
      translations,
      languages,
      textKeys
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching translations:', error);
    return new Response(JSON.stringify({ 
      error: 'Error loading translations',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};