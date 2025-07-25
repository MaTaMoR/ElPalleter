#!/usr/bin/env node

/**
 * Script de importación de datos JSON a Supabase
 * Uso: node import-data.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Función auxiliar para leer archivos JSON
async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error leyendo ${filePath}:`, error.message);
    return null;
  }
}

// Función auxiliar para insertar con manejo de errores
async function insertData(table, data, description) {
  console.log(`Insertando ${description}...`);
  
  const { error } = await supabase
    .from(table)
    .insert(data);

  if (error) {
    console.error(`Error insertando ${description}:`, error.message);
    return false;
  }
  
  console.log(`${description} insertado correctamente`);
  return true;
}

// Función auxiliar para upsert (actualizar o insertar)
async function upsertData(table, data, description, conflictColumns = ['id']) {
  console.log(`Actualizando/Insertando ${description}...`);
  
  const { error } = await supabase
    .from(table)
    .upsert(data, { 
      onConflict: conflictColumns.join(','),
      ignoreDuplicates: false 
    });

  if (error) {
    console.error(`Error en upsert ${description}:`, error.message);
    return false;
  }
  
  console.log(`${description} actualizado/insertado correctamente`);
  return true;
}

// 1. IMPORTAR USUARIOS ADMINISTRADORES
async function importAdminUsers() {
  console.log('\nIMPORTANDO USUARIOS ADMINISTRADORES');
  
  const data = await readJsonFile('./src/data/admin-users.json');
  if (!data) return false;

  const users = data.users.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    password: user.password,
    role: user.role,
    active: user.active,
    created_at: user.createdAt
  }));

  return await upsertData('admin_users', users, 'usuarios administradores');
}

// 2. IMPORTAR INFORMACIÓN DEL RESTAURANTE Y CONTACTO
async function importRestaurantInfo() {
  console.log('\nIMPORTANDO INFORMACIÓN DEL RESTAURANTE');
  
  const data = await readJsonFile('./src/data/contact-data.json');
  if (!data) return false;

  // Insertar información básica del restaurante
  const restaurantInfo = {
    id: 1,
    name: data.restaurant.name
  };

  await upsertData('restaurant_info', [restaurantInfo], 'información del restaurante');

  // Insertar información de contacto
  const contactInfo = {
    id: 1,
    restaurant_id: 1,
    street: data.contact.address.street,
    postal_code: data.contact.address.postalCode,
    city: data.contact.address.city,
    province: data.contact.address.province,
    country: data.contact.address.country,
    phone_main: data.contact.phone.main,
    email_main: data.contact.email.main,
    website: data.contact.website
  };

  return await upsertData('contact_info', [contactInfo], 'información de contacto');
}

// 3. IMPORTAR HORARIOS
async function importSchedules() {
  console.log('\nIMPORTANDO HORARIOS');
  
  const data = await readJsonFile('./src/data/contact-data.json');
  if (!data) return false;

  // Primero, eliminar horarios existentes
  await supabase.from('schedule_ranges').delete().neq('id', 0);
  await supabase.from('schedules').delete().neq('id', 0);

  const schedules = [];
  const scheduleRanges = [];
  let scheduleId = 1;
  let rangeId = 1;

  for (const [day, schedule] of Object.entries(data.hours.schedule)) {
    const scheduleData = {
      id: scheduleId,
      restaurant_id: 1,
      day_of_week: day,
      is_open: schedule.open || false
    };
    
    schedules.push(scheduleData);

    if (schedule.ranges) {
      for (const range of schedule.ranges) {
        scheduleRanges.push({
          id: rangeId++,
          schedule_id: scheduleId,
          name_key: range.nameKey,
          start_time: range.start,
          end_time: range.end
        });
      }
    }

    scheduleId++;
  }

  await insertData('schedules', schedules, 'horarios');
  return await insertData('schedule_ranges', scheduleRanges, 'rangos de horarios');
}

// 4. IMPORTAR REDES SOCIALES
async function importSocialMedia() {
  console.log('\nIMPORTANDO REDES SOCIALES');
  
  const data = await readJsonFile('./src/data/contact-data.json');
  if (!data) return false;

  const socialMedia = [];
  let id = 1;

  for (const [platform, info] of Object.entries(data.social)) {
    socialMedia.push({
      id: id++,
      restaurant_id: 1,
      platform: platform,
      enabled: info.enabled,
      url: info.url,
      handle: info.handle,
      icon: info.icon
    });
  }

  return await upsertData('social_media', socialMedia, 'redes sociales');
}

// 5. IMPORTAR CARTA
async function importCarta() {
  console.log('\nIMPORTANDO CARTA');
  
  const data = await readJsonFile('./src/data/carta-data.json');
  if (!data) return false;

  // Limpiar datos existentes
  await supabase.from('carta_items').delete().neq('id', 'dummy');
  await supabase.from('carta_subcategories').delete().neq('id', 'dummy');
  await supabase.from('carta_categories').delete().neq('id', 'dummy');

  const categories = [];
  const subcategories = [];
  const items = [];

  let categoryOrder = 1;
  for (const category of data.categories) {
    categories.push({
      id: category.id,
      name_key: category.nameKey,
      order_index: categoryOrder++
    });

    let subcategoryOrder = 1;
    for (const subcategory of category.subcategories) {
      subcategories.push({
        id: subcategory.id,
        category_id: category.id,
        name_key: subcategory.nameKey,
        order_index: subcategoryOrder++
      });

      let itemOrder = 1;
      for (const item of subcategory.items) {
        items.push({
          id: item.id,
          subcategory_id: subcategory.id,
          name_key: item.nameKey,
          description_key: item.descriptionKey || null,
          price: typeof item.price === 'number' ? item.price : null,
          price_text: typeof item.price === 'string' ? item.price : null,
          available: true,
          order_index: itemOrder++
        });
      }
    }
  }

  await insertData('carta_categories', categories, 'categorías de carta');
  await insertData('carta_subcategories', subcategories, 'subcategorías de carta');
  return await insertData('carta_items', items, 'items de carta');
}

// 6. IMPORTAR MENÚ
async function importMenu() {
  console.log('\n🔹 IMPORTANDO MENÚ');
  
  const data = await readJsonFile('./src/data/menu.json');
  if (!data) return false;

  // Limpiar datos existentes
  await supabase.from('menu_item_allergens').delete().neq('id', 0);
  await supabase.from('menu_items').delete().neq('id', 'dummy');
  await supabase.from('menu_sections').delete().neq('id', 'dummy');

  const sections = [];
  const items = [];
  const allergens = [];

  for (const section of data.sections) {
    sections.push({
      id: section.id,
      name_key: section.nameKey,
      order_index: section.order
    });

    for (const item of section.items) {
      items.push({
        id: item.id,
        section_id: section.id,
        name_key: item.nameKey,
        description_key: item.descriptionKey || null,
        price: item.price,
        available: item.available,
        category: item.category || null,
        servings: item.servings || null,
        order_index: 0
      });

      // Añadir alérgenos si existen
      if (item.allergens && item.allergens.length > 0) {
        for (const allergen of item.allergens) {
          allergens.push({
            menu_item_id: item.id,
            allergen: allergen
          });
        }
      }
    }
  }

  await insertData('menu_sections', sections, 'secciones de menú');
  await insertData('menu_items', items, 'items de menú');
  return await insertData('menu_item_allergens', allergens, 'alérgenos de menú');
}

// 7. IMPORTAR IMÁGENES
async function importImages() {
  console.log('\n🔹 IMPORTANDO IMÁGENES');
  
  const data = await readJsonFile('./src/data/images.json');
  if (!data) return false;

  const images = [];

  for (const [imageId, imageData] of Object.entries(data.images)) {
    images.push({
      id: imageData.id,
      path: imageData.path,
      mobile_path: imageData.responsive?.mobile || null,
      tablet_path: imageData.responsive?.tablet || null,
      desktop_path: imageData.responsive?.desktop || null,
      desktop_xl_path: imageData.responsive?.desktop_xl || null,
      fallback_path: imageData.fallback
    });
  }

  return await upsertData('images', images, 'imágenes');
}

// 8. IMPORTAR GALERÍAS
async function importGalleries() {
  console.log('\n🔹 IMPORTANDO GALERÍAS');
  
  const data = await readJsonFile('./src/data/galleries.json');
  if (!data) return false;

  // Limpiar datos existentes
  await supabase.from('gallery_images').delete().neq('id', 0);
  await supabase.from('galleries').delete().neq('id', 'dummy');

  const galleries = [];
  const galleryImages = [];

  for (const [galleryId, galleryData] of Object.entries(data.galleries)) {
    galleries.push({
      id: galleryId,
      name: galleryId
    });

    for (const image of galleryData.images) {
      galleryImages.push({
        gallery_id: galleryId,
        image_id: image.image,
        name_key: image.name,
        order_index: image.order
      });
    }
  }

  await insertData('galleries', galleries, 'galerías');
  return await insertData('gallery_images', galleryImages, 'imágenes de galería');
}

// 9. IMPORTAR CONTENIDO RICO
async function importRichContent() {
  console.log('\n🔹 IMPORTANDO CONTENIDO RICO');
  
  const data = await readJsonFile('./src/data/rich-content.json');
  if (!data) return false;

  const richContent = [];

  for (const [contentKey, contentData] of Object.entries(data)) {
    richContent.push({
      content_key: contentKey,
      content_es: contentData.es || null,
      content_en: contentData.en || null,
      content_val: contentData.val || null
    });
  }

  return await upsertData('rich_content', richContent, 'contenido rico', ['content_key']);
}

// 10. IMPORTAR TRADUCCIONES
async function importTranslations() {
  console.log('\nIMPORTANDO TRADUCCIONES');
  
  const languages = ['es', 'en', 'val'];
  const translations = [];

  for (const lang of languages) {
    const data = await readJsonFile(`./src/i18n/translations/${lang}.json`);
    if (!data) continue;

    // Función recursiva para procesar objetos anidados
    function processTranslations(obj, prefix = '') {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          processTranslations(value, fullKey);
        } else {
          translations.push({
            language: lang,
            translation_key: fullKey,
            translation_value: value
          });
        }
      }
    }

    processTranslations(data);
  }

  return await upsertData('translations', translations, 'traducciones', ['language', 'translation_key']);
}

// FUNCIÓN PRINCIPAL
async function main() {
  console.log('INICIANDO IMPORTACIÓN DE DATOS A SUPABASE');
  console.log('=' .repeat(50));

  const importFunctions = [
    importAdminUsers,
    importRestaurantInfo,
    importSchedules,
    importSocialMedia,
    importCarta,
    importMenu,
    importImages,
    importGalleries,
    importRichContent,
    importTranslations
  ];

  let successCount = 0;
  
  for (const importFn of importFunctions) {
    try {
      const success = await importFn();
      if (success !== false) successCount++;
    } catch (error) {
      console.error(`❌ Error en ${importFn.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`IMPORTACIÓN COMPLETADA: ${successCount}/${importFunctions.length} exitosas`);
  
  if (successCount === importFunctions.length) {
    console.log('¡Todos los datos se importaron correctamente!');
  } else {
    console.log('Algunas importaciones fallaron. Revisa los errores arriba.');
  }
}

// Ejecutar el script
main().catch(console.error);