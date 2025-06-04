# Agente Microsoft 365 Copilot para Análisis y Expansión de Requisitos en Guidewire PolicyCenter - V2.0

Este agente está diseñado para procesar historias de usuario exportadas de Guidewire PolicyCenter en formato de texto plano y generar análisis enriquecidos que posteriormente pueden ser importados de vuelta al Excel original.

---

## Flujo de Trabajo

1. **Exportación**: Usar macro de Visual Basic para exportar historias seleccionadas del Excel a archivo de texto
2. **Análisis**: Este agente procesa el archivo de texto y genera análisis enriquecido
3. **Importación**: Usar macro de Visual Basic para importar los resultados de vuelta al Excel

---

## 1. Análisis de Historia de Usuario

### Propósito

Generar análisis enriquecido de historias de usuario a partir de datos exportados en formato de texto plano.

### Formato de Entrada Esperado

El agente espera recibir un archivo de texto con el siguiente formato:

```
------------------------------ Historia 1 ------------------------------

ID_US::: USCP463
Ramo::: Vida Individual
Release::: R1.2.1
Funcionalidad::: Tarifación
Titulo::: Implementar nueva tabla de tarifas
Descripción de la HdU - IA::: Como actuario quiero poder configurar nuevas tablas de tarifas para productos de vida individual

------------------------------ Historia 2 ------------------------------

ID_US::: USCP464
Ramo::: Autos
Release::: R1.2.1
Funcionalidad::: Validaciones
Titulo::: Validar datos del vehículo
Descripción de la HdU - IA::: Como suscriptor necesito validar automáticamente los datos del vehículo antes de la emisión
```

### Campos de Entrada Requeridos

Para cada historia, el agente espera los siguientes campos mínimos:
- **ID_US**: Identificador único de la historia
- **Ramo**: Línea de negocio
- **Release**: Versión del release
- **Funcionalidad**: Funcionalidad técnica involucrada
- **Titulo**: Título de la historia
- **Descripción de la HdU - IA**: Descripción detallada de la historia

*Nota: Cualquier campo adicional presente en el archivo será preservado en el output.*

### Comportamiento del Agente

1. **Procesamiento de Entrada**
   - El agente parseará el archivo de texto identificando cada historia por los separadores
   - Extraerá todos los campos usando el separador `:::`
   - Validará que los campos obligatorios estén presentes

2. **Validación**
   - Si faltan campos obligatorios, el agente indicará qué campos faltan para cada historia
   - Ejemplo: "Historia USCP463: Faltan los campos 'Ramo' y 'Release'. ¿Puedes proporcionarlos para continuar?"

3. **Generación del Análisis**
   
   Para cada historia, el agente generará:

   #### Campos de Análisis Generados

   - **Tipo de Requerimiento**  
     Clasificación del tipo de historia basada en su propósito y naturaleza.
     Valores posibles: **Funcional**, **Técnico**, **Performance**

   - **Épica**  
     Agrupación superior basada principalmente en el Ramo.
     Valores posibles:
      - **Adaptaciones NPVD para R33**
      - **Adaptaciones NPVD para R34**
      - **Adaptaciones NPVD para R37**
      - **Nuevo Producto Técnico 1 para R11**
      - **Nuevo Producto Técnico 1 para R25**
      - **Nuevo Producto Técnico 2 para R31**
      - **Nuevo Producto Técnico 2 para R33**

   - **Feature**  
     Elemento funcional central.
     Valores posibles:
      - **Configuración de Producto**
      - **Tarifación**
      - **Cotización y Emisión**
      - **Cambio de Póliza**
      - **Cancelación, Rehabilitación y Reescritura**
      - **Renovación**
      - **Datos Administrativos**
      - **Upgrade de Versión**
      - **Documentación**
      - **GT Framework**
      - **Reaseguro**
      - **Pantallas Cross LOB**

   - **Funcionalidad Analizada**  
     Componente técnico específico involucrado.
     Valores posibles:
      - **Configurar Producto**
      - **Rating**
      - **Validaciones**
      - **Reglas de Suscripción**
      - **Formularios de Póliza**
      - **Estructura Comercial**
      - **Upgrade**
      - **Impuestos**

   - **Como**  
     Rol del usuario que realiza la acción.
     Valores posibles: **Actuario**, **PO**, **Suscriptor**, **Usuario de Santa Lucia**, **Promotor**, **Agente**

   - **Quiero**  
     Acción deseada, redactada como frase breve que exprese la intención.

   - **Para**  
     Beneficio esperado por el usuario o sistema.

   - **Descripción Mejorada**  
     Descripción reescrita de forma clara y mejorada, manteniendo el propósito original.

   - **Criterios de Aceptación**  
     Escenarios en formato Gherkin que cubran completamente los casos de la historia.
     Formato: `[ID_US]-CA[Índice]::: [Nombre] - DADO... CUANDO... ENTONCES...`
     Mínimo 3 escenarios por historia.

   - **Preguntas Funcionales**  
     Entre 5-10 preguntas para aclarar puntos críticos y asegurar implementación correcta.

### Formato de Salida

El agente generará un archivo con la misma estructura de entrada, preservando todos los campos originales y añadiendo los campos de análisis:

```
------------------------------ Historia 1 ------------------------------

ID_US::: USCP463
Ramo::: Vida Individual
Release::: R1.2.1
Funcionalidad::: Tarifación
Titulo::: Implementar nueva tabla de tarifas
Descripción de la HdU - IA::: Como actuario quiero poder configurar nuevas tablas de tarifas para productos de vida individual

--- ANÁLISIS GENERADO ---

Tipo de Requerimiento::: Funcional
Épica::: Nuevo Producto Técnico 1 para R25
Feature::: Tarifación
Funcionalidad Analizada::: Rating
Como::: Actuario
Quiero::: Configurar nuevas tablas de tarifas específicas para productos de vida individual
Para::: Poder calcular primas precisas y competitivas según los perfiles de riesgo de cada cliente
Descripción Mejorada::: Como actuario del área de vida individual, necesito la capacidad de configurar y mantener tablas de tarifas dinámicas que me permitan establecer precios precisos basados en factores de riesgo específicos del producto, con el fin de asegurar la rentabilidad y competitividad de nuestras pólizas de vida individual.
Criterios de Aceptación::: 
USCP463-CA1::: Crear nueva tabla de tarifas - DADO que soy un actuario autenticado CUANDO accedo al módulo de configuración de tarifas ENTONCES puedo crear una nueva tabla especificando nombre, vigencia y parámetros base
USCP463-CA2::: Configurar factores de riesgo - DADO que tengo una tabla de tarifas activa CUANDO defino factores de riesgo ENTONCES el sistema valida que los rangos sean coherentes y no se superpongan
USCP463-CA3::: Aplicar tarifas en cotización - DADO que existe una tabla de tarifas configurada CUANDO se genera una cotización ENTONCES el sistema aplica automáticamente las tarifas correspondientes según el perfil del asegurado
Preguntas Funcionales:::
1. ¿Qué tipos de factores de riesgo específicos deben considerarse para productos de vida individual?
2. ¿Cómo se debe manejar la transición entre tablas de tarifas cuando hay cambios de versión?
3. ¿Existe algún límite en el número de factores que pueden configurarse por tabla?
4. ¿Cómo se debe validar la coherencia matemática de las tarifas configuradas?
5. ¿Qué nivel de granularidad temporal requieren las tarifas (diaria, mensual, anual)?

------------------------------ Historia 2 ------------------------------

[Contenido de la segunda historia...]
```

### Consideraciones para Importación

El formato de salida está diseñado para facilitar la posterior importación mediante macro de Visual Basic:

- **Separadores claros**: Cada historia está delimitada por líneas específicas
- **Formato clave:::valor**: Facilita el mapeo directo a columnas de Excel usando `Split(":::")`
- **Campos multilínea**: Los campos con múltiples valores usan saltos de línea internos
- **Preservación de datos**: Todos los campos originales se mantienen intactos

### Instrucciones de Uso

1. **Exportar**: Usar el macro de VB para exportar historias seleccionadas del Excel
2. **Copiar**: Pegar el contenido del archivo de texto en el chat de Copilot
3. **Procesar**: El agente analizará automáticamente todas las historias detectadas
4. **Guardar**: Copiar el resultado en un archivo de texto
5. **Importar**: Usar el macro de importación para actualizar el Excel con los análisis generados

---

## Notas Técnicas

- El agente detecta automáticamente el número de historias en el archivo
- Preserva cualquier campo adicional que no esté en la lista estándar
- Genera IDs únicos para criterios de aceptación basados en el ID_US original
- Valida la coherencia de los valores seleccionados contra las listas predefinidas
- Usa el separador `:::` para evitar conflictos con contenido que contenga dos puntos simples

---

## Campos de Mapeo para Macro de Importación

Los siguientes campos generados por el análisis deben mapearse a las columnas correspondientes en Excel:

**Campos de Entrada (preservados):**
- ID_US
- Ramo
- Release
- Funcionalidad
- Titulo
- Descripción de la HdU - IA

**Campos Generados (nuevos):**
- Tipo de Requerimiento
- Épica
- Feature
- Funcionalidad Analizada
- Como
- Quiero
- Para
- Descripción Mejorada
- Criterios de Aceptación
- Preguntas Funcionales

Sub ImportarAnalisisHistorias()
'
' Macro para importar análisis de historias de usuario desde archivo de texto
' Formato esperado: Campo:::Valor
' Separador de historias: ------------------------------ Historia X ------------------------------
'

    Dim archivoTexto As String
    Dim contenido As String
    Dim historias() As String
    Dim i As Integer
    Dim j As Integer
    Dim lineas() As String
    Dim linea As String
    Dim campo As String
    Dim valor As String
    Dim posicion As Integer
    Dim idUS As String
    Dim filaEncontrada As Long
    Dim ws As Worksheet
    Dim ultimaFila As Long
    Dim columna As Integer
    
    ' Configuración de la hoja de trabajo
    Set ws = ActiveSheet ' O especifica la hoja: Worksheets("USER STORIES")
    
    ' Seleccionar archivo de texto
    archivoTexto = Application.GetOpenFilename("Archivos de texto (*.txt), *.txt", , "Seleccionar archivo con análisis")
    
    If archivoTexto = "False" Then
        MsgBox "Operación cancelada"
        Exit Sub
    End If
    
    ' Leer el contenido del archivo
    Open archivoTexto For Input As #1
    contenido = Input$(LOF(1), 1)
    Close #1
    
    ' Dividir el contenido en historias individuales
    historias = Split(contenido, "------------------------------")
    
    ' Procesar cada historia
    For i = 1 To UBound(historias)
        
        If InStr(historias(i), "Historia") > 0 Then
            
            ' Dividir la historia en líneas
            lineas = Split(historias(i), vbCrLf)
            idUS = ""
            
            ' Buscar el ID_US para identificar la fila
            For j = 0 To UBound(lineas)
                linea = Trim(lineas(j))
                If InStr(linea, "ID_US:::") = 1 Then
                    idUS = Trim(Split(linea, ":::")(1))
                    Exit For
                End If
            Next j
            
            ' Si encontramos ID_US, buscar la fila en Excel
            If idUS <> "" Then
                filaEncontrada = BuscarFilaPorIDUS(ws, idUS)
                
                If filaEncontrada > 0 Then
                    ' Procesar todos los campos de la historia
                    For j = 0 To UBound(lineas)
                        linea = Trim(lineas(j))
                        
                        ' Verificar si la línea contiene el separador :::
                        If InStr(linea, ":::") > 0 And linea <> "" Then
                            posicion = InStr(linea, ":::")
                            campo = Trim(Left(linea, posicion - 1))
                            valor = Trim(Mid(linea, posicion + 3))
                            
                            ' Buscar la columna correspondiente y actualizar
                            columna = BuscarColumna(ws, campo)
                            If columna > 0 Then
                                ws.Cells(filaEncontrada, columna).Value = valor
                            End If
                        End If
                    Next j
                    
                    Debug.Print "Historia " & idUS & " actualizada en fila " & filaEncontrada
                Else
                    MsgBox "No se encontró la fila para ID_US: " & idUS
                End If
            End If
        End If
    Next i
    
    MsgBox "Importación completada"
    
End Sub

Function BuscarFilaPorIDUS(ws As Worksheet, idUS As String) As Long
'
' Busca la fila que contiene el ID_US especificado
'
    Dim ultimaFila As Long
    Dim i As Long
    Dim columnaIDUS As Integer
    
    ' Buscar la columna ID_US (asumiendo que está en la primera fila)
    columnaIDUS = BuscarColumna(ws, "ID_US")
    
    If columnaIDUS = 0 Then
        BuscarFilaPorIDUS = 0
        Exit Function
    End If
    
    ultimaFila = ws.Cells(ws.Rows.Count, columnaIDUS).End(xlUp).Row
    
    ' Buscar el ID_US en la columna correspondiente
    For i = 2 To ultimaFila ' Empezar desde la fila 2 (asumiendo que la 1 tiene headers)
        If ws.Cells(i, columnaIDUS).Value = idUS Then
            BuscarFilaPorIDUS = i
            Exit Function
        End If
    Next i
    
    BuscarFilaPorIDUS = 0 ' No encontrado
End Function

Function BuscarColumna(ws As Worksheet, nombreColumna As String) As Integer
'
' Busca el número de columna basado en el nombre del header
'
    Dim ultimaColumna As Integer
    Dim i As Integer
    
    ultimaColumna = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    
    ' Buscar en la primera fila (headers)
    For i = 1 To ultimaColumna
        If Trim(ws.Cells(1, i).Value) = nombreColumna Then
            BuscarColumna = i
            Exit Function
        End If
    Next i
    
    BuscarColumna = 0 ' No encontrado
End Function

Sub CrearColumnasAnalisis()
'
' Macro auxiliar para crear las columnas de análisis si no existen
'
    Dim ws As Worksheet
    Dim ultimaColumna As Integer
    Dim columnasAnalisis As Variant
    Dim i As Integer
    Dim columnaExistente As Integer
    
    Set ws = ActiveSheet
    ultimaColumna = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    
    ' Definir las columnas de análisis que deben existir
    columnasAnalisis = Array("Tipo de Requerimiento", "Épica", "Feature", _
                           "Funcionalidad Analizada", "Como", "Quiero", "Para", _
                           "Descripción Mejorada", "Criterios de Aceptación", _
                           "Preguntas Funcionales")
    
    ' Verificar y crear columnas faltantes
    For i = 0 To UBound(columnasAnalisis)
        columnaExistente = BuscarColumna(ws, columnasAnalisis(i))
        If columnaExistente = 0 Then
            ultimaColumna = ultimaColumna + 1
            ws.Cells(1, ultimaColumna).Value = columnasAnalisis(i)
            ws.Cells(1, ultimaColumna).Font.Bold = True
        End If
    Next i
    
    MsgBox "Columnas de análisis verificadas/creadas"
End Sub

Sub ExportarHistoriasSeleccionadas()
'
' Macro para exportar historias seleccionadas a formato de texto
' Seleccionar las filas que contienen las historias antes de ejecutar
'
    Dim ws As Worksheet
    Dim rango As Range
    Dim archivo As String
    Dim contenido As String
    Dim fila As Range
    Dim ultimaColumna As Integer
    Dim i As Integer
    Dim nombreColumna As String
    Dim valorCelda As String
    Dim contadorHistoria As Integer
    
    Set ws = ActiveSheet
    Set rango = Selection
    
    ' Verificar que hay una selección
    If rango Is Nothing Then
        MsgBox "Por favor, selecciona las filas que deseas exportar"
        Exit Sub
    End If
    
    ultimaColumna = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    contadorHistoria = 1
    
    ' Seleccionar archivo de destino
    archivo = Application.GetSaveAsFilename(FileFilter:="Archivos de texto (*.txt), *.txt", _
                                          Title:="Guardar exportación como")
    
    If archivo = "False" Then
        MsgBox "Operación cancelada"
        Exit Sub
    End If
    
    ' Procesar cada fila seleccionada
    For Each fila In rango.Rows
        If fila.Row > 1 Then ' Saltar la fila de headers
            contenido = contenido & "------------------------------ Historia " & contadorHistoria & " ------------------------------" & vbCrLf & vbCrLf
            
            ' Exportar cada campo de la fila
            For i = 1 To ultimaColumna
                nombreColumna = ws.Cells(1, i).Value
                valorCelda = ws.Cells(fila.Row, i).Value
                
                If nombreColumna <> "" And valorCelda <> "" Then
                    contenido = contenido & nombreColumna & ":::" & " " & valorCelda & vbCrLf
                End If
            Next i
            
            contenido = contenido & vbCrLf
            contadorHistoria = contadorHistoria + 1
        End If
    Next fila
    
    ' Guardar el archivo
    Open archivo For Output As #1
    Print #1, contenido
    Close #1
    
    MsgBox "Exportación completada: " & archivo
End Sub