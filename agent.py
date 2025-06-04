Sub ExportarHistoriasConPromptDesdeExcel()
'
' Macro para exportar historias con prompt leído desde Excel
' 1. El prompt debe estar en la hoja "PROMPT" en la celda A1
' 2. Seleccionar las filas que contienen las historias antes de ejecutar
'
    Dim ws As Worksheet
    Dim wsPrompt As Worksheet
    Dim rango As Range
    Dim archivo As String
    Dim contenido As String
    Dim promptCompleto As String
    Dim datosHistorias As String
    Dim fila As Range
    Dim ultimaColumna As Integer
    Dim i As Integer
    Dim nombreColumna As String
    Dim valorCelda As String
    Dim contadorHistoria As Integer
    Dim columna As Integer ' Nueva variable para el índice de columna
    
    Set ws = ActiveSheet
    Set rango = Selection
    
    ' Verificar que hay una selección
    If rango Is Nothing Then
        MsgBox "Por favor, selecciona las filas que deseas exportar"
        Exit Sub
    End If
    
    ' Si la selección es solo una columna, expandir a toda la fila
    ultimaColumna = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    
    If rango.Columns.Count = 1 Then
        ' Expandir la selección desde la columna A hasta la última columna con datos
        Set rango = ws.Range(ws.Cells(rango.Row, 1), ws.Cells(rango.Row + rango.Rows.Count - 1, ultimaColumna))
        Debug.Print "Selección expandida automáticamente desde columna " & rango.Address & " a filas completas"
    End If
    
    ' Verificar que existe la hoja PROMPT
    On Error GoTo ErrorHojaPrompt
    Set wsPrompt = ThisWorkbook.Worksheets("PROMPT")
    On Error GoTo 0
    
    ' Leer el prompt desde la celda A1 de la hoja PROMPT
    promptCompleto = wsPrompt.Range("A1").Value
    
    ' Verificar que el prompt no esté vacío
    If Trim(promptCompleto) = "" Then
        MsgBox "La celda A1 de la hoja 'PROMPT' está vacía. Por favor, pega ahí el prompt completo."
        Exit Sub
    End If
    
    ultimaColumna = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    contadorHistoria = 1
    
    ' Leer las columnas a exportar desde la hoja CONFIG (o usar default)
    Dim columnasExportar As Variant
    columnasExportar = LeerColumnasDesdeConfig(ws)
    
    ' Agregar sección de datos al prompt
    promptCompleto = promptCompleto & vbCrLf & vbCrLf & "## DATOS DE ENTRADA" & vbCrLf & vbCrLf
    promptCompleto = promptCompleto & "[PROCESA TODAS LAS HISTORIAS INCLUIDAS AQUÍ ABAJO]" & vbCrLf & vbCrLf
    
    ' Procesar cada historia seleccionada
    For Each fila In rango.Rows
        If fila.Row > 1 Then ' Saltar la fila de headers
            datosHistorias = datosHistorias & "------------------------------ Historia " & contadorHistoria & " ------------------------------" & vbCrLf & vbCrLf
            
            ' Exportar solo las columnas especificadas en el array
            For i = 0 To UBound(columnasExportar)
                nombreColumna = columnasExportar(i)
                columna = BuscarColumna(ws, nombreColumna)
                
                If columna > 0 Then
                    valorCelda = ws.Cells(fila.Row, columna).Value
                    If valorCelda <> "" Then
                        datosHistorias = datosHistorias & nombreColumna & ":::" & " " & valorCelda & vbCrLf
                    End If
                Else
                    Debug.Print "Advertencia: No se encontró la columna '" & nombreColumna & "'"
                End If
            Next i
            
            datosHistorias = datosHistorias & vbCrLf
            contadorHistoria = contadorHistoria + 1
        End If
    Next fila
    
    ' Combinar prompt + datos
    contenido = promptCompleto & datosHistorias
    contenido = contenido & vbCrLf & "---" & vbCrLf & vbCrLf
    contenido = contenido & "**RECUERDA**: Debes procesar TODAS las historias incluidas arriba y generar análisis específicos y detallados para cada una. NO uses placeholders genéricos."
    
    ' Seleccionar archivo de destino
    archivo = Application.GetSaveAsFilename(FileFilter:="Archivos de texto (*.txt), *.txt", _
                                          Title:="Guardar prompt completo como", _
                                          InitialFileName:="AnalisisHistorias_" & Format(Now, "yyyymmdd_hhmmss") & ".txt")
    
    If archivo = "False" Then
        MsgBox "Operación cancelada"
        Exit Sub
    End If
    
    ' Guardar el archivo
    Open archivo For Output As #1
    Print #1, contenido
    Close #1
    
    MsgBox "Exportación completada: " & archivo & vbCrLf & vbCrLf & _
           "Historias exportadas: " & (contadorHistoria - 1) & vbCrLf & _
           "Columnas exportadas: " & (UBound(columnasExportar) + 1) & vbCrLf & vbCrLf & _
           "Ahora copia todo el contenido del archivo y pégalo en Copilot." & vbCrLf & vbCrLf & _
           "TIP: Usa 'ConfigurarColumnasExportar' para cambiar qué columnas exportar."
    
    Exit Sub
    
ErrorHojaPrompt:
    MsgBox "No se encontró la hoja 'PROMPT'. Por favor:" & vbCrLf & vbCrLf & _
           "1. Crea una nueva hoja llamada 'PROMPT'" & vbCrLf & _
           "2. Pega el prompt completo en la celda A1" & vbCrLf & _
           "3. Vuelve a ejecutar este macro"
    Exit Sub
    
End Sub

Sub CrearHojaPrompt()
'
' Macro auxiliar para crear la hoja PROMPT con el texto base
'
    Dim wsPrompt As Worksheet
    Dim promptBase As String
    
    ' Verificar si ya existe la hoja
    On Error GoTo CrearHoja
    Set wsPrompt = ThisWorkbook.Worksheets("PROMPT")
    
    ' Si ya existe, preguntar si sobrescribir
    If MsgBox("La hoja 'PROMPT' ya existe. ¿Deseas sobrescribir el contenido?", vbYesNo + vbQuestion) = vbNo Then
        Exit Sub
    End If
    GoTo ConfigurarHoja
    
CrearHoja:
    On Error GoTo 0
    ' Crear nueva hoja
    Set wsPrompt = ThisWorkbook.Worksheets.Add
    wsPrompt.Name = "PROMPT"
    
ConfigurarHoja:
    ' Configurar la celda A1
    With wsPrompt.Range("A1")
        .Font.Name = "Consolas"
        .Font.Size = 10
        .WrapText = True
        .VerticalAlignment = xlTop
        .HorizontalAlignment = xlLeft
    End With
    
    ' Ajustar el ancho de la columna A para que sea cómoda de leer
    wsPrompt.Columns("A:A").ColumnWidth = 120
    
    ' Prompt base para empezar
    promptBase = "# ANÁLISIS DE HISTORIAS DE USUARIO - GUIDEWIRE POLICYCENTER" & vbCrLf & vbCrLf & _
                "**IMPORTANTE**: Lee completamente este prompt antes de generar cualquier respuesta. Debes analizar TODAS las historias incluidas en la sección ""DATOS DE ENTRADA"" y generar análisis específicos y detallados para cada una." & vbCrLf & vbCrLf & _
                "## INSTRUCCIONES PARA EL ANÁLISIS" & vbCrLf & vbCrLf & _
                "Eres un analista experto en Guidewire PolicyCenter. Tu tarea es procesar las historias de usuario incluidas al final de este prompt y generar análisis enriquecidos siguiendo EXACTAMENTE este formato." & vbCrLf & vbCrLf & _
                "[CONTINÚA EDITANDO AQUÍ EL PROMPT COMPLETO...]"
    
    wsPrompt.Range("A1").Value = promptBase
    
    ' Seleccionar la celda A1 para que el usuario pueda empezar a editar
    wsPrompt.Range("A1").Select
    
    MsgBox "Hoja 'PROMPT' creada exitosamente." & vbCrLf & vbCrLf & _
           "Ahora puedes:" & vbCrLf & _
           "1. Editar el prompt completo en la celda A1" & vbCrLf & _
           "2. Usar el macro 'ExportarHistoriasConPromptDesdeExcel' para generar archivos"
    
End Sub

Sub AbrirHojaPrompt()
'
' Macro para abrir rápidamente la hoja PROMPT para editar
'
    On Error GoTo ErrorHoja
    ThisWorkbook.Worksheets("PROMPT").Activate
    ThisWorkbook.Worksheets("PROMPT").Range("A1").Select
    Exit Sub
    
ErrorHoja:
    MsgBox "No se encontró la hoja 'PROMPT'. Ejecuta primero el macro 'CrearHojaPrompt'."
End Sub

Sub ConfigurarColumnasExportar()
'
' Macro para configurar fácilmente qué columnas exportar
' Crea una hoja "CONFIG" con la lista de columnas a exportar
'
    Dim wsConfig As Worksheet
    Dim columnasDefault As Variant
    Dim i As Integer
    
    ' Columnas por defecto
    columnasDefault = Array("ID_US", "Ramo", "Release", "Funcionalidad", "Titulo", "Descripción de la HdU - IA")
    
    ' Verificar si ya existe la hoja CONFIG
    On Error GoTo CrearHojaConfig
    Set wsConfig = ThisWorkbook.Worksheets("CONFIG")
    
    ' Si ya existe, preguntar si sobrescribir
    If MsgBox("La hoja 'CONFIG' ya existe. ¿Deseas sobrescribir la configuración?", vbYesNo + vbQuestion) = vbNo Then
        Exit Sub
    End If
    GoTo ConfigurarHojaConfig
    
CrearHojaConfig:
    On Error GoTo 0
    ' Crear nueva hoja
    Set wsConfig = ThisWorkbook.Worksheets.Add
    wsConfig.Name = "CONFIG"
    
ConfigurarHojaConfig:
    ' Limpiar la hoja
    wsConfig.Cells.Clear
    
    ' Configurar headers
    wsConfig.Range("A1").Value = "Columnas a Exportar"
    wsConfig.Range("A1").Font.Bold = True
    wsConfig.Range("A1").Font.Size = 12
    
    wsConfig.Range("A2").Value = "Edita esta lista para cambiar qué columnas se exportan:"
    wsConfig.Range("A2").Font.Italic = True
    
    ' Agregar las columnas por defecto
    For i = 0 To UBound(columnasDefault)
        wsConfig.Cells(i + 4, 1).Value = columnasDefault(i)
    Next i
    
    ' Formatear
    wsConfig.Columns("A:A").AutoFit
    wsConfig.Range("A4:A" & (4 + UBound(columnasDefault))).Borders.LineStyle = xlContinuous
    
    ' Seleccionar la primera celda de datos
    wsConfig.Range("A4").Select
    
    MsgBox "Hoja 'CONFIG' creada exitosamente." & vbCrLf & vbCrLf & _
           "Puedes:" & vbCrLf & _
           "1. Editar la lista de columnas en la columna A (a partir de la fila 4)" & vbCrLf & _
           "2. Agregar o quitar columnas según necesites" & vbCrLf & _
           "3. El macro de exportación usará esta lista automáticamente"
    
    Exit Sub
    
End Sub

Function LeerColumnasDesdeConfig(ws As Worksheet) As Variant
'
' Lee la lista de columnas desde la hoja CONFIG
' Si no existe, usa la lista por defecto
'
    Dim wsConfig As Worksheet
    Dim ultimaFilaConfig As Long
    Dim columnasArray() As String
    Dim i As Long
    Dim valorColumna As String
    Dim contador As Integer
    
    ' Intentar acceder a la hoja CONFIG
    On Error GoTo UsarDefault
    Set wsConfig = ThisWorkbook.Worksheets("CONFIG")
    
    ' Encontrar la última fila con datos en la columna A
    ultimaFilaConfig = wsConfig.Cells(wsConfig.Rows.Count, 1).End(xlUp).Row
    
    ' Verificar que hay datos después de la fila 3 (headers)
    If ultimaFilaConfig <= 3 Then GoTo UsarDefault
    
    ' Contar las columnas válidas
    contador = 0
    For i = 4 To ultimaFilaConfig
        valorColumna = Trim(wsConfig.Cells(i, 1).Value)
        If valorColumna <> "" Then
            contador = contador + 1
        End If
    Next i
    
    ' Si no hay columnas válidas, usar default
    If contador = 0 Then GoTo UsarDefault
    
    ' Redimensionar el array
    ReDim columnasArray(0 To contador - 1)
    
    ' Llenar el array
    contador = 0
    For i = 4 To ultimaFilaConfig
        valorColumna = Trim(wsConfig.Cells(i, 1).Value)
        If valorColumna <> "" Then
            columnasArray(contador) = valorColumna
            contador = contador + 1
        End If
    Next i
    
    LeerColumnasDesdeConfig = columnasArray
    Exit Function
    
UsarDefault:
    On Error GoTo 0
    ' Usar la lista por defecto
    LeerColumnasDesdeConfig = Array("ID_US", "Ramo", "Release", "Funcionalidad", "Titulo", "Descripción de la HdU - IA")
End Function
End Sub