#!/usr/bin/env node

/**
 * Script para crear las tablas de la base de datos
 * Uso: node setup-database.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Faltan variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Leer el archivo SQL
async function readSqlSchema() {
  try {
    const schemaPath = path.resolve('./database-schema.sql');
    const sqlContent = await fs.readFile(schemaPath, 'utf-8');
    return sqlContent;
  } catch (error) {
    console.error('Error leyendo database-schema.sql:', error.message);
    console.log('Asegurate de que el archivo database-schema.sql existe en el directorio actual');
    process.exit(1);
  }
}

async function setupDatabase() {
  console.log('CREANDO ESTRUCTURA DE BASE DE DATOS');
  console.log('=' .repeat(50));

  try {
    console.log('Leyendo schema SQL...');
    const sqlSchema = await readSqlSchema();
    
    console.log('Ejecutando schema SQL...');
    
    const { error } = await supabase.rpc('exec_sql', { 
      sql: sqlSchema 
    });

    if (error) {
      // Si la función exec_sql no existe, mostrar instrucciones manuales
      console.log('Funcion exec_sql no disponible, se requiere ejecucion manual');
      console.log('');
      console.log('SOLUCION MANUAL:');
      console.log('1. Ve a tu dashboard de Supabase');
      console.log('2. Navega a SQL Editor');
      console.log('3. Copia y pega el contenido del archivo database-schema.sql');
      console.log('4. Haz clic en "Run"');
      console.log('5. Luego ejecuta: npm run db:import');
      return;
    } else {
      console.log('Base de datos configurada correctamente');
      console.log('');
      console.log('Ahora puedes ejecutar la importacion:');
      console.log('   npm run db:import');
    }

  } catch (error) {
    console.error('Error configurando la base de datos:', error.message);
    console.log('');
    console.log('SOLUCION MANUAL:');
    console.log('1. Ve a tu dashboard de Supabase');
    console.log('2. Navega a SQL Editor');
    console.log('3. Copia y pega el contenido del archivo database-schema.sql');
    console.log('4. Haz clic en "Run"');
    console.log('5. Luego ejecuta: npm run db:import');
  }
}

// Ejecutar el script
setupDatabase().catch(console.error);