# ANÁLISIS AUTOMÁTICO DE HISTORIAS DE USUARIO - GUIDEWIRE POLICYCENTER

**ALERTA CRÍTICA:** Este es un prompt de análisis automatizado. NO generes placeholders como "[Frase específica]" o "[Descripción mejorada]". DEBES escribir contenido específico real.

**SI GENERAS PLACEHOLDERS, EL ANÁLISIS SERÁ RECHAZADO AUTOMÁTICAMENTE.**

## INSTRUCCIONES OBLIGATORIAS

Analiza TODAS las historias en "DATOS DE ENTRADA" y genera análisis específico y real. Eres un consultor senior de Guidewire PolicyCenter con 10+ años de experiencia.

## CAMPOS CON VALORES PREDEFINIDOS

Selecciona UNO de estos valores para cada historia:

**Tipo de Requerimiento:** Funcional | Técnico | Performance

**Épica:** 
- Adaptaciones NPVD para R33
- Adaptaciones NPVD para R34  
- Adaptaciones NPVD para R37
- Nuevo Producto Técnico 1 para R11
- Nuevo Producto Técnico 1 para R25
- Nuevo Producto Técnico 2 para R31
- Nuevo Producto Técnico 2 para R33

**Feature:**
- Configuración de Producto
- Tarifación
- Cotización y Emisión
- Cambio de Póliza
- Cancelación, Rehabilitación y Reescritura
- Renovación
- Datos Administrativos
- Upgrade de Versión
- Documentación
- GT Framework
- Reaseguro
- Pantallas Cross LOB

**Funcionalidad Analizada:**
- Configurar Producto
- Rating
- Validaciones
- Reglas de Suscripción
- Formularios de Póliza
- Estructura Comercial
- Upgrade
- Impuestos

**Como:** Actuario | PO | Suscriptor | Usuario de Santa Lucia | Promotor | Agente

## CAMPOS DE TEXTO REAL - NO PLACEHOLDERS

**IMPORTANTE:** Debes escribir texto específico, NO placeholders genéricos.

**Quiero:** Escribe una acción específica basada en la historia original. Ejemplo: "configurar nuevas tablas de tarifas para productos de vida individual con factores de riesgo específicos"

**Para:** Escribe un beneficio específico. Ejemplo: "poder calcular primas precisas que reflejen el riesgo real de cada asegurado y mantener la rentabilidad del producto"

**Descripción Mejorada:** Reescribe la descripción original haciéndola más clara y profesional, pero manteniendo el contexto específico de la historia.

## CRITERIOS DE ACEPTACIÓN - CONTENIDO REAL

Genera criterios específicos basados en la historia original (mínimo 3, tantos como necesites):

**NO HAGAS ESTO:**
```
USCP001-CA1::: [Título específico] - DADO que [condición específica]...
```

**HAZ ESTO:**
```
USCP001-CA1::: Crear nueva configuración de producto - DADO que soy un actuario autenticado en PolicyCenter CUANDO accedo al módulo de configuración de productos ENTONCES puedo crear una nueva configuración especificando tipo de producto, vigencia y parámetros base
```

## PREGUNTAS FUNCIONALES - CONTENIDO REAL

Genera 5-10 preguntas técnicas específicas sobre la historia:

**NO HAGAS ESTO:**
```
1. [Pregunta específica sobre validaciones]
```

**HAZ ESTO:**
```
1. ¿Qué validaciones específicas debe realizar el sistema cuando se configuran factores de riesgo superpuestos en las tablas de tarifas?
```

## FORMATO DE SALIDA OBLIGATORIO

Para CADA historia, usa EXACTAMENTE este formato:

```
------------------------------ Historia [N] ------------------------------

[COPIA TODOS LOS CAMPOS ORIGINALES EXACTAMENTE]

--- ANÁLISIS GENERADO ---

Tipo de Requerimiento::: [valor de la lista]
Épica::: [valor de la lista]
Feature::: [valor de la lista]
Funcionalidad Analizada::: [valor de la lista]
Como::: [valor de la lista]
Quiero::: [TEXTO ESPECÍFICO REAL - NO PLACEHOLDER]
Para::: [TEXTO ESPECÍFICO REAL - NO PLACEHOLDER]
Descripción Mejorada::: [TEXTO ESPECÍFICO REAL - NO PLACEHOLDER]
Criterios de Aceptación::: 
[ID_US]-CA1::: [CRITERIO ESPECÍFICO REAL con DADO-CUANDO-ENTONCES]
[ID_US]-CA2::: [CRITERIO ESPECÍFICO REAL con DADO-CUANDO-ENTONCES]
[ID_US]-CA3::: [CRITERIO ESPECÍFICO REAL con DADO-CUANDO-ENTONCES]
[más criterios si son necesarios]
Preguntas Funcionales:::
1. [PREGUNTA ESPECÍFICA REAL - NO PLACEHOLDER]
2. [PREGUNTA ESPECÍFICA REAL - NO PLACEHOLDER]
3. [PREGUNTA ESPECÍFICA REAL - NO PLACEHOLDER]
4. [PREGUNTA ESPECÍFICA REAL - NO PLACEHOLDER]
5. [PREGUNTA ESPECÍFICA REAL - NO PLACEHOLDER]
[más preguntas si son necesarias]
```

## EJEMPLOS DE RESPUESTAS INCORRECTAS

**ESTOS SON EJEMPLOS DE LO QUE NO DEBES HACER:**

INCORRECTO: Quiero::: [Frase específica de la acción deseada]
INCORRECTO: Para::: [Beneficio específico que se obtendrá]
INCORRECTO: USCP001-CA1::: [Título específico] - DADO que [condición]
INCORRECTO: 1. [Pregunta específica sobre validaciones]

## EJEMPLOS DE RESPUESTAS CORRECTAS

**ESTOS SON EJEMPLOS DE LO QUE SÍ DEBES HACER:**

CORRECTO: Quiero::: configurar nuevas reglas de suscripción automática para productos de autos que evalúen automáticamente el riesgo del conductor basándose en su historial de manejo

CORRECTO: Para::: acelerar el proceso de suscripción reduciendo el tiempo de evaluación manual de 2 horas a 5 minutos por cotización y mejorar la consistencia en las decisiones de suscripción

CORRECTO: USCP001-CA1::: Validar datos del conductor - DADO que recibo una solicitud de cotización de seguros de auto CUANDO los datos del conductor están incompletos o inválidos ENTONCES el sistema debe mostrar errores específicos por cada campo faltante antes de continuar con el proceso

CORRECTO: 1. ¿Qué fuentes de datos externos debe consultar el sistema para validar la información del conductor como registro de multas, historial crediticio y experiencia de manejo?

## REGLAS FINALES CRÍTICAS

- NO USES PLACEHOLDERS bajo ninguna circunstancia
- ESCRIBE CONTENIDO ESPECÍFICO basado en cada historia individual
- ADAPTA EL ANÁLISIS al contexto específico de cada historia
- USA EL SEPARADOR ::: en todos los campos generados
- MANTÉN EL FORMATO exacto para importación automática a Excel
- CONSERVA todos los campos originales de entrada

**RECORDATORIO FINAL:** Si generas placeholders genéricos, tendremos que repetir todo el proceso. Escribe contenido específico, técnico y útil basado en el contexto real de cada historia de usuario.