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
    
    Set ws = ActiveSheet
    Set rango = Selection
    
    ' Verificar que hay una selección
    If rango Is Nothing Then
        MsgBox "Por favor, selecciona las filas que deseas exportar"
        Exit Sub
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
    
    ' Agregar sección de datos al prompt
    promptCompleto = promptCompleto & vbCrLf & vbCrLf & "## DATOS DE ENTRADA" & vbCrLf & vbCrLf
    promptCompleto = promptCompleto & "[PROCESA TODAS LAS HISTORIAS INCLUIDAS AQUÍ ABAJO]" & vbCrLf & vbCrLf
    
    ' Procesar cada historia seleccionada
    For Each fila In rango.Rows
        If fila.Row > 1 Then ' Saltar la fila de headers
            datosHistorias = datosHistorias & "------------------------------ Historia " & contadorHistoria & " ------------------------------" & vbCrLf & vbCrLf
            
            ' Exportar cada campo de la fila
            For i = 1 To ultimaColumna
                nombreColumna = ws.Cells(1, i).Value
                valorCelda = ws.Cells(fila.Row, i).Value
                
                If nombreColumna <> "" And valorCelda <> "" Then
                    datosHistorias = datosHistorias & nombreColumna & ":::" & " " & valorCelda & vbCrLf
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
           "Historias exportadas: " & (contadorHistoria - 1) & vbCrLf & vbCrLf & _
           "Ahora copia todo el contenido del archivo y pégalo en Copilot."
    
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