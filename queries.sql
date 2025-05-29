-- Crear tablas necesarias
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE TABLE page_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section VARCHAR(50) UNIQUE NOT NULL,
  content JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id),
  version INTEGER DEFAULT 1
);

CREATE TABLE content_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  version INTEGER NOT NULL
);

-- Tabla para gestión de medios/imágenes
CREATE TABLE media_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  alt_text VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID REFERENCES admin_users(id)
);

-- Índices para mejor rendimiento
CREATE INDEX idx_media_files_filename ON media_files(filename);
CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);

-- Actualizar contenido inicial con estructura completa
DELETE FROM page_content WHERE section IN ('homepage', 'carta', 'contact', 'historia', 'footer', 'settings');

-- Crear un usuario administrador inicial
INSERT INTO admin_users (email, password_hash, name) VALUES 
('admin@elpalleter.es', 'HAS_GENERADO' 'Administrador El Palleter');

-- Insertar contenido completo expandido
INSERT INTO page_content (section, content) VALUES 

-- 🏠 HOMEPAGE - Página principal
('homepage', '{
  "hero": {
    "title": "El Palleter",
    "subtitle": "Auténtica cocina mediterránea desde 1985",
    "background_image": "/assets/fondo.jpg",
    "background_image_mobile": "/assets/fondo-mobile.jpg",
    "logo_image": "/assets/logo-blanco.svg",
    "cta_button": {
      "text": "Ver Carta",
      "link": "#carta"
    }
  },
  "seo": {
    "title": "El Palleter - Restaurante en Benissa",
    "description": "Auténtica cocina mediterránea desde 1985 en el corazón de Benissa. Especialistas en carnes a la parrilla y cocina tradicional.",
    "keywords": "restaurante benissa, cocina mediterránea, parrilla, valencia"
  }
}'),

-- 📖 HISTORIA - Sección completa de historia
('historia', '{
  "title": "Nuestra Historia",
  "subtitle": "Desde 1985 en el corazón de Benissa",
  "content": [
    "Lo que comenzó como un pequeño restaurante familiar se ha convertido en un referente de la cocina mediterránea en Benissa. Tres generaciones han mantenido vivas las recetas tradicionales mientras incorporan toques modernos que sorprenden a nuestros comensales.",
    "Cada plato cuenta una historia, cada sabor evoca recuerdos de generaciones que han encontrado en El Palleter su segundo hogar. Nuestra parrilla, que lleva funcionando desde el primer día, sigue siendo el corazón de nuestra cocina.",
    "Hoy, seguimos comprometidos con la calidad, la tradición y el sabor auténtico que nos ha caracterizado durante casi cuatro décadas."
  ],
  "slider_images": [
    {
      "src": "/assets/slider/slider-1.jpg",
      "alt": "Nuestro restaurante El Palleter",
      "caption": "Nuestro restaurante El Palleter"
    },
    {
      "src": "/assets/slider/slider-2.jpg", 
      "alt": "Nuestra hamburguesa especial",
      "caption": "Nuestra hamburguesa especial"
    },
    {
      "src": "/assets/slider/slider-3.jpg",
      "alt": "Ven y prueba nuestra parrilla", 
      "caption": "Ven y prueba nuestra parrilla"
    },
    {
      "src": "/assets/slider/slider-4.jpg",
      "alt": "En una buena comida no puede faltar un buen postre",
      "caption": "En una buena comida no puede faltar un buen postre"
    }
  ],
  "background_style": {
    "color": "rgb(20, 20, 20)",
    "pattern": true
  }
}'),

-- 🍽️ CARTA - Menú completo
('carta', '{
  "title": "Nuestra Carta",
  "subtitle": "Auténtica cocina mediterránea desde 1985",
  "categories": [
    {
      "id": "entrantes",
      "name": "Entrantes",
      "sections": [
        {
          "name": "🥗 Entrantes Fríos",
          "items": [
            {
              "name": "Ensalada Palleter",
              "description": "Pan, alioli y tomate, patatas fritas",
              "price": "11,50€"
            },
            {
              "name": "Tabla de Jamón Ibérico", 
              "description": null,
              "price": "12,00€"
            },
            {
              "name": "Boquerones en Vinagre",
              "description": null,
              "price": "7,00€"
            },
            {
              "name": "Aspencat con Mojama",
              "description": null,
              "price": "8,00€"
            },
            {
              "name": "Ensaladilla Rusa",
              "description": null,
              "price": "6,00€"
            }
          ]
        },
        {
          "name": "🔥 Entrantes Calientes",
          "items": [
            {
              "name": "Patatas Bravas",
              "description": null,
              "price": "7,00€"
            },
            {
              "name": "Pimientos del Padrón",
              "description": null,
              "price": "4,50€"
            },
            {
              "name": "Boniato Frito",
              "description": null,
              "price": "4,50€"
            },
            {
              "name": "Tabla de Quesos con Embutidos",
              "description": null,
              "price": "8,50€"
            }
          ]
        }
      ]
    },
    {
      "id": "hamburguesas",
      "name": "Hamburguesas",
      "sections": [
        {
          "name": "🍔 Hamburguesas Gourmet",
          "items": [
            {
              "name": "Hamburguesa Palleter",
              "description": "Ternera, lechuga, tomate, cebolla, queso, bacon, huevo frito y mayonesa",
              "price": "12,50€"
            },
            {
              "name": "Hamburguesa de Siempre",
              "description": "Ternera, lechuga, tomate, cebolla, queso y mahonesa", 
              "price": "10,00€"
            },
            {
              "name": "Hamburguesa Vegana",
              "description": "Filete vegetal, lechuga, tomate, cebolla, aguacate y mayonesa vegana",
              "price": "10,50€"
            }
          ]
        }
      ]
    }
  ]
}'),

-- 📞 CONTACTO - Información de contacto completa
('contact', '{
  "restaurant_info": {
    "name": "El Palleter",
    "address": {
      "street": "Calle Principal 123",
      "city": "Benissa",
      "postal_code": "03720",
      "province": "Alicante",
      "country": "España"
    },
    "phone": "+34 965 123 456",
    "email": "info@elpalleter.es",
    "website": "https://elpalleter.es"
  },
  "hours": {
    "monday": "Cerrado",
    "tuesday": "12:00 - 23:00",
    "wednesday": "12:00 - 23:00", 
    "thursday": "12:00 - 23:00",
    "friday": "12:00 - 23:00",
    "saturday": "12:00 - 23:00",
    "sunday": "12:00 - 23:00"
  },
  "social_media": {
    "facebook": "https://facebook.com/elpalleter",
    "instagram": "https://instagram.com/elpalleter",
    "twitter": "https://twitter.com/elpalleter",
    "tiktok": "https://tiktok.com/@elpalleter"
  },
  "location": {
    "latitude": 38.7084,
    "longitude": 0.0526,
    "google_maps_url": "https://maps.google.com/?cid=123456789"
  },
  "additional_info": {
    "reservation_required": false,
    "accepts_groups": true,
    "has_terrace": true,
    "parking_available": true,
    "wheelchair_accessible": true
  }
}'),

-- 🦶 FOOTER - Información del pie de página
('footer', '{
  "company_info": {
    "name": "El Palleter",
    "tagline": "Auténtica cocina mediterránea desde 1985",
    "description": "Restaurante familiar especializado en cocina mediterránea tradicional con toques modernos."
  },
  "contact_summary": {
    "address": "Calle Principal 123, Benissa (Alicante)",
    "phone": "+34 965 123 456",
    "email": "info@elpalleter.es"
  },
  "quick_links": [
    { "name": "Carta", "url": "#carta" },
    { "name": "Historia", "url": "#historia" },
    { "name": "Contacto", "url": "#contacto" },
    { "name": "Reservas", "url": "#reservas" }
  ],
  "social_links": [
    { "name": "Facebook", "url": "https://facebook.com/elpalleter", "icon": "facebook" },
    { "name": "Instagram", "url": "https://instagram.com/elpalleter", "icon": "instagram" },
    { "name": "TikTok", "url": "https://tiktok.com/@elpalleter", "icon": "tiktok" }
  ],
  "legal": {
    "copyright": "© 2025 El Palleter. Todos los derechos reservados.",
    "privacy_policy_url": "/privacidad",
    "legal_notice_url": "/aviso-legal"
  }
}'),

-- ⚙️ CONFIGURACIÓN - Ajustes generales del sitio
('settings', '{
  "site_config": {
    "site_name": "El Palleter",
    "site_url": "https://elpalleter.es",
    "default_language": "es",
    "timezone": "Europe/Madrid"
  },
  "seo_global": {
    "meta_title_suffix": " | El Palleter",
    "meta_description_default": "Restaurante El Palleter en Benissa. Auténtica cocina mediterránea desde 1985.",
    "og_image": "/assets/og-image.jpg",
    "favicon": "/favicon.ico"
  },
  "analytics": {
    "google_analytics_id": null,
    "google_tag_manager_id": null,
    "facebook_pixel_id": null
  },
  "features": {
    "online_reservations": false,
    "online_ordering": false,
    "newsletter": false,
    "blog": false
  },
  "maintenance": {
    "maintenance_mode": false,
    "maintenance_message": "Estamos actualizando nuestro sitio web. Vuelve pronto."
  }
}');

-- Crear configuración RLS (Row Level Security) para mayor seguridad
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (solo administradores pueden acceder)
CREATE POLICY "Admin access only" ON admin_users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin access only" ON page_content FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin access only" ON content_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin access only" ON media_files FOR ALL USING (auth.role() = 'service_role');

-- Funciones útiles para el panel de administración
CREATE OR REPLACE FUNCTION get_content_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_sections', (SELECT COUNT(*) FROM page_content),
        'total_media_files', (SELECT COUNT(*) FROM media_files),
        'last_update', (SELECT MAX(updated_at) FROM page_content),
        'total_admins', (SELECT COUNT(*) FROM admin_users)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar archivos huérfanos
CREATE OR REPLACE FUNCTION cleanup_orphaned_media()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Esta función se puede expandir para eliminar archivos no referenciados
    -- Por ahora, solo cuenta los archivos más antiguos de 30 días sin referencias
    SELECT COUNT(*) INTO deleted_count
    FROM media_files 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND id NOT IN (
        SELECT DISTINCT jsonb_array_elements_text(content->'slider_images'->-1->'id')::UUID
        FROM page_content 
        WHERE content ? 'slider_images'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;