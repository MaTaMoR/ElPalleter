import { getDatabase } from '../../../utils/database.js';

export const GET = async ({ params, url }) => {
  try {
    const { key } = params;
    const language = url.searchParams.get('lang') || 'es';
    
    const db = await getDatabase();
    
    const query = `
      SELECT 
        t.translation,
        t.is_reviewed as "isReviewed",
        t.translator_notes as "translatorNotes"
      FROM translations t
      JOIN text_keys tk ON t.text_key_id = tk.id
      WHERE tk.key = ? AND t.language_id = ?
    `;
    
    const translation = db.prepare(query).get(key, language);
    
    if (!translation) {
      return new Response(JSON.stringify({ 
        translation: null,
        key,
        language 
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    return new Response(JSON.stringify({
      translation: translation.translation,
      isReviewed: translation.isReviewed,
      translatorNotes: translation.translatorNotes
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching translation:', error);
    return new Response(JSON.stringify({ 
      error: 'Error loading translation' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const PUT = async ({ params, request }) => {
  try {
    const { key } = params;
    const { languageId, translation, isReviewed, translatorNotes } = await request.json();
    
    const db = await getDatabase();
    
    // Obtener el ID de la clave de texto
    const textKey = db.prepare('SELECT id FROM text_keys WHERE key = ?').get(key);
    if (!textKey) {
      return new Response(JSON.stringify({ 
        error: 'Text key not found' 
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Insertar o actualizar la traducción
    const upsertQuery = `
      INSERT INTO translations (text_key_id, language_id, translation, is_reviewed, translator_notes, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(text_key_id, language_id) 
      DO UPDATE SET 
        translation = excluded.translation,
        is_reviewed = excluded.is_reviewed,
        translator_notes = excluded.translator_notes,
        updated_at = excluded.updated_at
    `;
    
    db.prepare(upsertQuery).run(
      textKey.id,
      languageId,
      translation,
      isReviewed ? 1 : 0,
      translatorNotes
    );
    
    return new Response(JSON.stringify({ 
      success: true,
      key,
      languageId,
      translation 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error updating translation:', error);
    return new Response(JSON.stringify({ 
      error: 'Error updating translation' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};