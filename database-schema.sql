-- ============================================
-- ESTRUCTURA DE BASE DE DATOS - EL PALLETER
-- ============================================

-- 1. USUARIOS ADMINISTRADORES
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. INFORMACIÓN DEL RESTAURANTE
-- ============================================
CREATE TABLE IF NOT EXISTS restaurant_info (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. INFORMACIÓN DE CONTACTO
-- ============================================
CREATE TABLE IF NOT EXISTS contact_info (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurant_info(id),
    street VARCHAR(255),
    postal_code VARCHAR(20),
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100),
    phone_main VARCHAR(50),
    email_main VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. HORARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurant_info(id),
    day_of_week VARCHAR(20) NOT NULL,
    is_open BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedule_ranges (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
    name_key VARCHAR(100),
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. REDES SOCIALES
-- ============================================
CREATE TABLE IF NOT EXISTS social_media (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurant_info(id),
    platform VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    url VARCHAR(500),
    handle VARCHAR(100),
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. CATEGORÍAS DE CARTA
-- ============================================
CREATE TABLE IF NOT EXISTS carta_categories (
    id VARCHAR(50) PRIMARY KEY,
    name_key VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. SUBCATEGORÍAS DE CARTA
-- ============================================
CREATE TABLE IF NOT EXISTS carta_subcategories (
    id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) REFERENCES carta_categories(id) ON DELETE CASCADE,
    name_key VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. ITEMS DE CARTA
-- ============================================
CREATE TABLE IF NOT EXISTS carta_items (
    id VARCHAR(50) PRIMARY KEY,
    subcategory_id VARCHAR(50) REFERENCES carta_subcategories(id) ON DELETE CASCADE,
    name_key VARCHAR(100) NOT NULL,
    description_key VARCHAR(100),
    price DECIMAL(10,2),
    price_text VARCHAR(50),
    available BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. SECCIONES DE MENÚ
-- ============================================
CREATE TABLE IF NOT EXISTS menu_sections (
    id VARCHAR(50) PRIMARY KEY,
    name_key VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. ITEMS DE MENÚ
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(50) PRIMARY KEY,
    section_id VARCHAR(50) REFERENCES menu_sections(id) ON DELETE CASCADE,
    name_key VARCHAR(100) NOT NULL,
    description_key VARCHAR(100),
    price DECIMAL(10,2),
    available BOOLEAN DEFAULT true,
    category VARCHAR(50),
    servings VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. ALÉRGENOS PARA ITEMS DE MENÚ
-- ============================================
CREATE TABLE IF NOT EXISTS menu_item_allergens (
    id SERIAL PRIMARY KEY,
    menu_item_id VARCHAR(50) REFERENCES menu_items(id) ON DELETE CASCADE,
    allergen VARCHAR(50) NOT NULL
);

-- 12. IMÁGENES
-- ============================================
CREATE TABLE IF NOT EXISTS images (
    id VARCHAR(50) PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    mobile_path VARCHAR(500),
    tablet_path VARCHAR(500),
    desktop_path VARCHAR(500),
    desktop_xl_path VARCHAR(500),
    fallback_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. GALERÍAS
-- ============================================
CREATE TABLE IF NOT EXISTS galleries (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery_images (
    id SERIAL PRIMARY KEY,
    gallery_id VARCHAR(50) REFERENCES galleries(id) ON DELETE CASCADE,
    image_id VARCHAR(50) REFERENCES images(id),
    name_key VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. CONTENIDO RICO MULTIIDIOMA
-- ============================================
CREATE TABLE IF NOT EXISTS rich_content (
    id SERIAL PRIMARY KEY,
    content_key VARCHAR(100) UNIQUE NOT NULL,
    content_es TEXT,
    content_en TEXT,
    content_val TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. TRADUCCIONES
-- ============================================
CREATE TABLE IF NOT EXISTS translations (
    id SERIAL PRIMARY KEY,
    language VARCHAR(10) NOT NULL,
    translation_key VARCHAR(200) NOT NULL,
    translation_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(language, translation_key)
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================
CREATE INDEX IF NOT EXISTS idx_carta_items_subcategory ON carta_items(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_carta_subcategories_category ON carta_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_section ON menu_items(section_id);
CREATE INDEX IF NOT EXISTS idx_schedule_ranges_schedule ON schedule_ranges(schedule_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_gallery ON gallery_images(gallery_id);
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language);
CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(translation_key);

-- ============================================
-- FUNCIÓN PARA UPDATED_AT AUTOMÁTICO
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- ============================================
DO $$
BEGIN
    -- Solo crear triggers si no existen
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_admin_users_updated_at') THEN
        CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_restaurant_info_updated_at') THEN
        CREATE TRIGGER update_restaurant_info_updated_at BEFORE UPDATE ON restaurant_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contact_info_updated_at') THEN
        CREATE TRIGGER update_contact_info_updated_at BEFORE UPDATE ON contact_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_schedules_updated_at') THEN
        CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_social_media_updated_at') THEN
        CREATE TRIGGER update_social_media_updated_at BEFORE UPDATE ON social_media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_carta_categories_updated_at') THEN
        CREATE TRIGGER update_carta_categories_updated_at BEFORE UPDATE ON carta_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_carta_subcategories_updated_at') THEN
        CREATE TRIGGER update_carta_subcategories_updated_at BEFORE UPDATE ON carta_subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_carta_items_updated_at') THEN
        CREATE TRIGGER update_carta_items_updated_at BEFORE UPDATE ON carta_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_menu_sections_updated_at') THEN
        CREATE TRIGGER update_menu_sections_updated_at BEFORE UPDATE ON menu_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_menu_items_updated_at') THEN
        CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_images_updated_at') THEN
        CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_galleries_updated_at') THEN
        CREATE TRIGGER update_galleries_updated_at BEFORE UPDATE ON galleries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_rich_content_updated_at') THEN
        CREATE TRIGGER update_rich_content_updated_at BEFORE UPDATE ON rich_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_translations_updated_at') THEN
        CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;