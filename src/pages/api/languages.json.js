import { getDatabase } from '../../utils/database.js';

export const GET = async () => {
  try {
    const db = await getDatabase();
    
    const languages = db.prepare(`
      SELECT 
        l.id,
        l.name,
        l.native_name as "nativeName",
        l.is_default as "isDefault",
        l.is_active as "isActive",
        COUNT(tk.id) as totalKeys,
        COUNT(CASE WHEN t.translation IS NOT NULL AND t.translation != '' THEN 1 END) as translatedKeys
      FROM languages l
      CROSS JOIN text_keys tk
      LEFT JOIN translations t ON tk.id = t.text_key_id AND t.language_id = l.id
      GROUP BY l.id, l.name, l.native_name, l.is_default, l.is_active
      ORDER BY l.is_default DESC, l.name
    `).all();
    
    // Calcular porcentaje de completitud
    const languagesWithCompletion = languages.map(lang => ({
      ...lang,
      completionPercentage: lang.totalKeys > 0 ? Math.round((lang.translatedKeys / lang.totalKeys) * 100) : 0
    }));
    
    return new Response(JSON.stringify(languagesWithCompletion), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return new Response(JSON.stringify({ 
      error: 'Error loading languages' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
