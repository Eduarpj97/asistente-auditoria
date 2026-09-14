create database Auditflow;

use auditflow;


-- TABLA DE EMPRESAS / ORGANIZACIONES
-- Permite aislar los contratos por cliente/empresa 
CREATE TABLE empresas (
    id_empresa VARCHAR(36) PRIMARY KEY, -- UUID v4
    nombre_empresa VARCHAR(150) NOT NULL,
    nit_identificacion VARCHAR(50) UNIQUE NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA DE USUARIOS Y ROLES
CREATE TABLE usuarios (
    id_usuario VARCHAR(36) PRIMARY KEY, -- UUID v4
    id_empresa VARCHAR(36) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) DEFAULT 'Analista' CHECK (rol IN ('Admin', 'Auditor', 'Analista')),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa) ON DELETE CASCADE
);

-- TABLA GENERAL DE DOCUMENTOS (CONTRATOS)
-- Registra los metadatos del archivo y la trazabilidad del almacenamiento seguro
CREATE TABLE documentos (
    id_documento VARCHAR(36) PRIMARY KEY, -- UUID v4
    id_empresa VARCHAR(36),
    id_usuario_carga VARCHAR(36),
    nombre_original VARCHAR(255) NOT NULL,
    hash_sha256 VARCHAR(64) NOT NULL, -- Para verificación de integridad y evitar duplicados
    ruta_almacenamiento_seguro VARCHAR(512) NOT NULL, -- Ruta privada fuera del web root o bucket S3
    tamano_bytes BIGINT NOT NULL,
    tipo_mime VARCHAR(50) DEFAULT 'application/pdf',
    
    -- Tipo de contrato para guiar las reglas de auditoría
    tipo_contrato VARCHAR(50) DEFAULT 'Otro' CHECK (tipo_contrato IN ('Licencia_Software', 'SLA_Servicios', 'Terminos_Legales', 'Otro')),
    
    -- Control del estado dentro del Pipeline de Procesamiento
    estado_procesamiento VARCHAR(30) DEFAULT 'Cargado' 
        CHECK (estado_procesamiento IN ('Cargado', 'En_OCR', 'OCR_Completado', 'En_Analisis_IA', 'Auditado', 'Error')),
    mensaje_error TEXT,
    
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_carga) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- TABLA DE TEXTO EXTRAÍDO POR EL PIPELINE OCR
-- Almacena el contenido procesado (página por página o en bloque)
CREATE TABLE texto_ocr (
    id_ocr VARCHAR(36) PRIMARY KEY, -- UUID v4
    id_documento VARCHAR(36) NOT NULL,
    num_pagina INT NOT NULL,
    contenido_texto TEXT NOT NULL, -- Texto resultante extraído por Tesseract/EasyOCR/PyPDF
    confianza_ocr DECIMAL(5,2), -- Porcentaje de precisión retornado por el motor OCR (ej: 98.50)
    procesado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_documento) REFERENCES documentos(id_documento) ON DELETE CASCADE,
    CONSTRAINT uq_documento_pagina UNIQUE (id_documento, num_pagina)
);

-- TABLA DE CLÁUSULAS EXTRAÍDAS Y CATEGORIZADAS
-- Permite segmentar el contrato para que la IA aplique reglas de cumplimiento
CREATE TABLE clausulas_extraidas (
    id_clausula VARCHAR(36) PRIMARY KEY, -- UUID v4
    id_documento VARCHAR(36) NOT NULL,
    num_pagina INT,
    tipo_clausula VARCHAR(80) NOT NULL, -- Ej: 'Penalización', 'Renovación_Automática', 'SLA_Disponibilidad', 'Jurisdicción'
    texto_clausula TEXT NOT NULL,
    posicion_inicio_caracter INT,
    posicion_fin_caracter INT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_documento) REFERENCES documentos(id_documento) ON DELETE CASCADE
);

-- TABLA DE ANÁLISIS DE RIESGOS Y CUMPLIMIENTO REGULATORIO
-- Almacena los hallazgos generados por el módulo de IA / Auditoría
CREATE TABLE analisis_riesgos (
    id_riesgo VARCHAR(36) PRIMARY KEY, -- UUID v4
    id_documento VARCHAR(36) NOT NULL,
    id_clausula VARCHAR(36), -- Clave opcional relacionada a la cláusula específica que genera el riesgo
    
    nivel_riesgo VARCHAR(20) NOT NULL CHECK (nivel_riesgo IN ('Bajo', 'Medio', 'Alto', 'Critico')),
    categoria_cumplimiento VARCHAR(100) NOT NULL, -- Ej: 'Privacidad_Datos', 'SLA', 'Rescisión_Anticipada'
    titulo_hallazgo VARCHAR(200) NOT NULL,
    descripcion_riesgo TEXT NOT NULL,
    recomendacion_mitigacion TEXT NOT NULL,
    
    es_incumplimiento BOOLEAN DEFAULT FALSE,
    auditado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_documento) REFERENCES documentos(id_documento) ON DELETE CASCADE,
    FOREIGN KEY (id_clausula) REFERENCES clausulas_extraidas(id_clausula) ON DELETE SET NULL
);


-- Optimizar búsquedas de documentos por empresa y estado de pipeline
CREATE INDEX idx_documentos_empresa_estado ON documentos(id_empresa, estado_procesamiento);

-- Optimizar consulta de fragmentos OCR de un contrato
CREATE INDEX idx_texto_ocr_documento ON texto_ocr(id_documento, num_pagina);

-- Optimizar filtros por nivel de riesgo para los dashboards del Frontend
CREATE INDEX idx_analisis_riesgo_nivel ON analisis_riesgos(id_documento, nivel_riesgo);
