"""
GENERADOR DE PROMPT PARA COPILOT - VERSIÓN SIMPLIFICADA

Este script busca historias en Excel y genera un archivo .txt con el prompt para Copilot.
Versión: 7.0 - Solo Generación de Prompt
"""

import pandas as pd
from datetime import datetime

def generar_prompt_para_copilot(ids_historias: str, 
                               archivo_excel: str = "HU Release 1.2.1.xlsx",
                               hoja: str = "USER STORIES"):
    """
    Busca historias en Excel y genera archivo .txt con prompt para Copilot
    
    Args:
        ids_historias: IDs de historias separados por coma
        archivo_excel: Nombre del archivo Excel
        hoja: Nombre de la hoja
    
    Returns:
        str: Nombre del archivo .txt generado (o None si error)
    """
    
    print("🔍 BUSCANDO HISTORIAS Y GENERANDO PROMPT")
    print("=" * 50)
    
    try:
        # Cargar datos del Excel
        print(f"📂 Cargando: {archivo_excel} - Hoja: {hoja}")
        df_original = pd.read_excel(archivo_excel, sheet_name=hoja)
        
        # Procesar IDs solicitados
        ids_lista = [id_hist.strip() for id_hist in ids_historias.split(",")]
        print(f"🎯 IDs solicitados: {ids_lista}")
        
        # Filtrar historias
        filas_filtradas = df_original[df_original['ID_US'].astype(str).isin(ids_lista)].copy()
        
        print(f"✅ Historias encontradas: {len(filas_filtradas)} de {len(ids_lista)} solicitadas")
        
        if len(filas_filtradas) == 0:
            print("❌ ERROR: No se encontraron historias con esos IDs")
            return None
        
        # Mostrar IDs no encontrados
        ids_encontrados = filas_filtradas['ID_US'].astype(str).tolist()
        ids_faltantes = [id_h for id_h in ids_lista if id_h not in ids_encontrados]
        if ids_faltantes:
            print(f"⚠️  IDs no encontrados: {', '.join(ids_faltantes)}")
        
        # Generar archivo de prompt
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        archivo_prompt = f"prompt_copilot_{timestamp}.txt"
        
        print(f"📝 Generando prompt: {archivo_prompt}")
        
        # Crear contenido del prompt
        contenido_prompt = crear_contenido_prompt(filas_filtradas, df_original)
        
        # Escribir archivo
        with open(archivo_prompt, 'w', encoding='utf-8') as f:
            f.write(contenido_prompt)
        
        print(f"🎉 PROMPT GENERADO EXITOSAMENTE")
        print(f"📁 Archivo: {archivo_prompt}")
        print(f"📊 Historias incluidas: {len(filas_filtradas)}")
        
        return archivo_prompt
        
    except FileNotFoundError:
        print(f"❌ ERROR: No se encontró el archivo {archivo_excel}")
        return None
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return None

def crear_contenido_prompt(historias_df, df_original):
    """
    Crea el contenido completo del prompt con contexto y datos - VERSIÓN CONCISA
    """
    
    prompt_content = f"""# ANÁLISIS DE HISTORIAS DE USUARIO - SEGUROS

## CONTEXTO RÁPIDO
Eres analista de requerimientos de seguros. Analiza estas {len(historias_df)} historias y completa la información faltante.

## VALORES OBLIGATORIOS A USAR

**Tipo de Requerimiento:** Funcional | Técnico | Performance

**Épica:** 
• Adaptaciones NPVD para R33/R34/R37
• Nuevo Producto Técnico 1 para R11/R25  
• Nuevo Producto Técnico 2 para R31/R33

**Feature:**
• Configuración de Producto, Tarifación, Cotización y Emisión
• Cambio de Póliza, Cancelación Rehabilitación y Reescritura
• Renovación, Datos Administrativos, Upgrade de Versión
• Documentación, GT Framework?, Reaseguro, Pantallas Cross LOB

**Funcionalidad:**
• Configurar Producto, Rating, Validaciones, Reglas de Suscripción
• Formularios de Póliza, Estructura Comercial, Upgrade, Impuestos

**Como (Rol):** Actuario | PO | Suscriptor | Usuario de Santa Lucia | Promotor | Agente

## FORMATO DE RESPUESTA OBLIGATORIO

Para CADA historia, responde con este formato exacto:

HISTORIA [ID]:
- Tipo de Requerimiento: [elegir de la lista]
- Épica: [elegir de la lista]
- Feature: [elegir de la lista]  
- Funcionalidad: [elegir de la lista]
- Como: [elegir rol]
- Quiero: [acción específica]
- Para: [beneficio/valor]
- Descripción mejorada: [versión clara y técnica]
- Criterios de Aceptación:
  * DADO [contexto] CUANDO [acción] ENTONCES [resultado]
  * DADO [contexto] CUANDO [acción] ENTONCES [resultado]
  * DADO [contexto] CUANDO [acción] ENTONCES [resultado]
- Preguntas Funcionales:
  * [Pregunta sobre requerimiento]
  * [Pregunta sobre casos especiales]
  * [Pregunta sobre integraciones]
  * [Pregunta sobre validaciones]
  * [Pregunta sobre UX]

═══════════════════════════════════════════════════════════════════

## HISTORIAS A ANALIZAR ({len(historias_df)} total)

"""

    # Agregar cada historia con separación visual clara
    for i, (index, fila) in enumerate(historias_df.iterrows(), 1):
        # Extraer y limpiar datos
        datos = {}
        for columna in df_original.columns:
            valor = fila[columna]
            datos[columna] = "" if pd.isna(valor) else str(valor)
        
        prompt_content += f"""
██████████████████████████████████████████████████████████████████
                              HISTORIA {i}
██████████████████████████████████████████████████████████████████

🔹 ID_US: {datos.get('ID_US', 'N/A')}
🔹 Título: {datos.get('Titulo', 'N/A')}
🔹 Ramo: {datos.get('Ramo', 'N/A')}
🔹 Release: {datos.get('Release', 'N/A')}
🔹 Descripción: {datos.get('Descripción de la HdU - IA', 'N/A')}
🔹 Proceso: {datos.get('Proceso', 'N/A')}
🔹 Funcionalidad2: {datos.get('Funcionalidad2', 'N/A')}

░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

"""

    prompt_content += f"""
═══════════════════════════════════════════════════════════════════

## ⚠️  INSTRUCCIONES CRÍTICAS

1. **USA SOLO** los valores de las listas arriba
2. **MANTÉN** el formato exacto de respuesta
3. **INCLUYE** mínimo 3 criterios y 5 preguntas por historia
4. **PROCESA** las {len(historias_df)} historias mostradas

¡ANALIZA TODAS LAS HISTORIAS AHORA!
"""

    return prompt_content

def listar_historias_disponibles(archivo_excel: str = "HU Release 1.2.1.xlsx",
                                hoja: str = "USER STORIES"):
    """
    Muestra todas las historias disponibles en el Excel para referencia
    """
    
    try:
        print("📋 LISTANDO HISTORIAS DISPONIBLES")
        print("=" * 50)
        
        df = pd.read_excel(archivo_excel, sheet_name=hoja)
        
        for index, fila in df.iterrows():
            id_us = fila.get('ID_US', 'N/A')
            titulo = fila.get('Titulo', 'N/A')
            ramo = fila.get('Ramo', 'N/A')
            release = fila.get('Release', 'N/A')
            
            titulo_corto = titulo[:60] + "..." if len(str(titulo)) > 60 else titulo
            print(f"🔹 {id_us} | {ramo} | R{release} | {titulo_corto}")
        
        print(f"\n📊 Total de historias: {len(df)}")
        return df['ID_US'].tolist()
        
    except Exception as e:
        print(f"❌ ERROR listando historias: {str(e)}")
        return []

def main():
    """
    Función principal simplificada
    """
    
    print("🚀 GENERADOR DE PROMPT PARA COPILOT")
    print("=" * 50)
    
    # Configuración (modificar según necesidad)
    ids_ejemplo = "HU001, HU002, HU003"  # ⚠️ CAMBIAR POR IDs REALES
    archivo_excel = "HU Release 1.2.1.xlsx"
    hoja = "USER STORIES"
    
    # Paso 1: Mostrar historias disponibles (opcional)
    print("📋 PASO 1: Historias disponibles")
    listar_historias_disponibles(archivo_excel, hoja)
    
    print(f"\n🎯 PASO 2: Generando prompt para IDs: {ids_ejemplo}")
    
    # Paso 2: Generar prompt
    archivo_generado = generar_prompt_para_copilot(ids_ejemplo, archivo_excel, hoja)
    
    if archivo_generado:
        print(f"\n✅ ÉXITO! Archivo generado: {archivo_generado}")
        print("\n" + "="*60)
        print("🤖 SIGUIENTE PASO:")
        print("="*60)
        print(f"1. Abre el archivo: {archivo_generado}")
        print("2. Copia todo el contenido")
        print("3. Pégalo en Microsoft 365 Copilot")
        print("4. ¡Espera el análisis completo!")
        print("="*60)
    else:
        print("\n❌ Error: No se pudo generar el prompt")

if __name__ == "__main__":
    main()