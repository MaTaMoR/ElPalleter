Sub ExportarHistoriasConPromptDesdeExcel()
'
' Macro para exportar historias con prompt leído desde Excel
' 1. El prompt debe estar en la hoja "PROMPT" en la celda A1
' 2. Seleccionar las filas que contienen las historias antes de ejecutar
' 3. Exporta en formato UTF-8
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
    Dim columna As Integer
    
    ' Definir las columnas que se quieren exportar (MODIFICAR AQUÍ SEGÚN NECESITES)
    Dim columnasExportar As Variant
    columnasExportar = Array("ID_US", "Ramo", "Release", "Funcionalidad", "Titulo", "Descripción de la HdU - IA")
    
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
    
    contadorHistoria = 1
    
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
    
    ' Guardar el archivo en UTF-8
    Dim objStream As Object
    Set objStream = CreateObject("ADODB.Stream")
    
    With objStream
        .Type = 2 ' adTypeText
        .Charset = "UTF-8"
        .Open
        .WriteText contenido
        .SaveToFile archivo, 2 ' adSaveCreateOverWrite
        .Close
    End With
    
    Set objStream = Nothing
    
    MsgBox "Exportación completada: " & archivo & vbCrLf & vbCrLf & _
           "Historias exportadas: " & (contadorHistoria - 1) & vbCrLf & _
           "Columnas exportadas: " & (UBound(columnasExportar) + 1) & vbCrLf & _
           "Codificación: UTF-8" & vbCrLf & vbCrLf & _
           "Ahora copia todo el contenido del archivo y pégalo en Copilot."
    
    Exit Sub
    
ErrorHojaPrompt:
    MsgBox "No se encontró la hoja 'PROMPT'. Por favor:" & vbCrLf & vbCrLf & _
           "1. Crea una nueva hoja llamada 'PROMPT'" & vbCrLf & _
           "2. Pega el prompt completo en la celda A1" & vbCrLf & _
           "3. Vuelve a ejecutar este macro"
    Exit Sub
    
End Sub

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