-- Tabla de idiomas disponibles
CREATE TABLE languages (
  id VARCHAR(5) PRIMARY KEY,     -- 'es', 'en', 'ca', etc.
  name VARCHAR(50) NOT NULL,     -- 'Español', 'English', 'Català'
  native_name VARCHAR(50),       -- 'Español', 'English', 'Català'
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de categorías de texto (para organización)
CREATE TABLE text_categories (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,  -- 'header', 'menu', 'footer', etc.
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- Tabla de claves de texto
CREATE TABLE text_keys (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL, -- 'header.title', 'menu.about', etc.
  category_id INTEGER REFERENCES text_categories(id),
  description TEXT,                 -- Descripción para el traductor
  context TEXT,                     -- Contexto donde se usa
  max_length INTEGER,               -- Límite de caracteres (opcional)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de traducciones
CREATE TABLE translations (
  id SERIAL PRIMARY KEY,
  text_key_id INTEGER REFERENCES text_keys(id),
  language_id VARCHAR(5) REFERENCES languages(id),
  translation TEXT NOT NULL,
  is_reviewed BOOLEAN DEFAULT FALSE,
  translator_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(text_key_id, language_id)
);

-- Tabla de configuración del sitio
CREATE TABLE site_config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  value TEXT,
  description TEXT
);