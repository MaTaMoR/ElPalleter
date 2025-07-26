-- ============================================
-- CONFIGURACIÓN RLS PARA EL PALLETER
-- ============================================

-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE carta_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE carta_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE carta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE rich_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. POLÍTICAS PARA DATOS PÚBLICOS (SOLO LECTURA)
-- ============================================

-- Información del restaurante
CREATE POLICY "restaurant_info_select" ON restaurant_info FOR SELECT USING (true);
CREATE POLICY "contact_info_select" ON contact_info FOR SELECT USING (true);

-- Horarios
CREATE POLICY "schedules_select" ON schedules FOR SELECT USING (true);
CREATE POLICY "schedule_ranges_select" ON schedule_ranges FOR SELECT USING (true);

-- Redes sociales (solo las habilitadas)
CREATE POLICY "social_media_select" ON social_media FOR SELECT USING (enabled = true);

-- Carta y menú (solo items disponibles)
CREATE POLICY "carta_categories_select" ON carta_categories FOR SELECT USING (true);
CREATE POLICY "carta_subcategories_select" ON carta_subcategories FOR SELECT USING (true);
CREATE POLICY "carta_items_select" ON carta_items FOR SELECT USING (available = true);

CREATE POLICY "menu_sections_select" ON menu_sections FOR SELECT USING (true);
CREATE POLICY "menu_items_select" ON menu_items FOR SELECT USING (available = true);
CREATE POLICY "menu_item_allergens_select" ON menu_item_allergens FOR SELECT USING (true);

-- Imágenes y galerías
CREATE POLICY "images_select" ON images FOR SELECT USING (true);
CREATE POLICY "galleries_select" ON galleries FOR SELECT USING (true);
CREATE POLICY "gallery_images_select" ON gallery_images FOR SELECT USING (true);

-- Contenido multiidioma
CREATE POLICY "rich_content_select" ON rich_content FOR SELECT USING (true);
CREATE POLICY "translations_select" ON translations FOR SELECT USING (true);

-- ============================================
-- 3. FUNCIÓN PARA VERIFICAR SI ES ADMIN
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica si el usuario autenticado es un admin activo
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid()::text 
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. POLÍTICAS ADMINISTRATIVAS
-- ============================================

-- Admin users - Solo pueden verse a sí mismos o si son super admin
CREATE POLICY "admin_users_select" ON admin_users 
  FOR SELECT USING (id = auth.uid()::text OR is_admin());

CREATE POLICY "admin_users_update" ON admin_users 
  FOR UPDATE USING (id = auth.uid()::text);

-- Todas las tablas - Los admins pueden hacer todo
CREATE POLICY "restaurant_info_admin" ON restaurant_info 
  FOR ALL USING (is_admin());

CREATE POLICY "contact_info_admin" ON contact_info 
  FOR ALL USING (is_admin());

CREATE POLICY "schedules_admin" ON schedules 
  FOR ALL USING (is_admin());

CREATE POLICY "schedule_ranges_admin" ON schedule_ranges 
  FOR ALL USING (is_admin());

CREATE POLICY "social_media_admin" ON social_media 
  FOR ALL USING (is_admin());

CREATE POLICY "carta_categories_admin" ON carta_categories 
  FOR ALL USING (is_admin());

CREATE POLICY "carta_subcategories_admin" ON carta_subcategories 
  FOR ALL USING (is_admin());

CREATE POLICY "carta_items_admin" ON carta_items 
  FOR ALL USING (is_admin());

CREATE POLICY "menu_sections_admin" ON menu_sections 
  FOR ALL USING (is_admin());

CREATE POLICY "menu_items_admin" ON menu_items 
  FOR ALL USING (is_admin());

CREATE POLICY "menu_item_allergens_admin" ON menu_item_allergens 
  FOR ALL USING (is_admin());

CREATE POLICY "images_admin" ON images 
  FOR ALL USING (is_admin());

CREATE POLICY "galleries_admin" ON galleries 
  FOR ALL USING (is_admin());

CREATE POLICY "gallery_images_admin" ON gallery_images 
  FOR ALL USING (is_admin());

CREATE POLICY "rich_content_admin" ON rich_content 
  FOR ALL USING (is_admin());

CREATE POLICY "translations_admin" ON translations 
  FOR ALL USING (is_admin());