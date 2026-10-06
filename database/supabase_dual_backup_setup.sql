-- ========================================================
-- AUDIFLOW - CONFIGURACIÓN DE RESPALDO DUAL SUPABASE
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase
-- ========================================================

-- 1. Tabla de respaldo completo de auditorías (payload JSON idéntico a SQLite)
CREATE TABLE IF NOT EXISTS public.auditorias_sync (
    id_audit TEXT NOT NULL,
    user_email TEXT NOT NULL,
    audit_json TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_audit, user_email)
);

-- 2. Asegurar empresa por defecto para integridad referencial de usuarios y documentos
INSERT INTO public.empresas (id_empresa, nombre_empresa, nit_identificacion)
VALUES ('emp-default-global', 'Firma de Auditoría Corporativa', 'NIT-900123456-1')
ON CONFLICT (id_empresa) DO NOTHING;

-- 3. Flexibilizar la restricción de roles en usuarios si existe
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios ALTER COLUMN rol TYPE VARCHAR(100);

-- 4. Habilitar permisos de inserción y lectura para el backend (políticas permisivas o deshabilitar RLS)
-- Esto permite que la API de Audiflow guarde y consulte directamente
ALTER TABLE public.empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.texto_ocr DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clausulas_extraidas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_riesgos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditorias_sync DISABLE ROW LEVEL SECURITY;

-- 5. Otorgar permisos al rol anon y authenticated para acceso completo del backend
GRANT ALL ON TABLE public.empresas TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.usuarios TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.documentos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.texto_ocr TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.clausulas_extraidas TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.analisis_riesgos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.auditorias_sync TO anon, authenticated, service_role;
