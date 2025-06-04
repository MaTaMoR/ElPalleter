Sub ImportarAnalisisDesdeArchivo()
'
' Macro para importar el análisis generado desde archivo de texto
' Busca y actualiza los datos en la hoja activa
'
    Dim ws As Worksheet
    Dim archivo As String
    Dim contenido As String
    Dim lineas As Variant
    Dim i As Long
    Dim fila As Long
    Dim idUsuario As String
    Dim campo As String
    Dim valor As String
    Dim posicionSeparador As Integer
    Dim columna As Integer
    Dim filasActualizadas As Integer
    Dim contadorHistorias As Integer
    Dim bloqueMultiple As String
    Dim enBloqueMultiple As Boolean
    Dim tipoBloque As String
    
    Set ws = ActiveSheet
    filasActualizadas = 0
    contadorHistorias = 0
    bloqueMultiple = ""
    enBloqueMultiple = False
    tipoBloque = ""
    
    ' Seleccionar archivo
    archivo = Application.GetOpenFilename(FileFilter:="Archivos de texto (*.txt), *.txt", _
                                        Title:="Seleccionar archivo con análisis generado")
    
    If archivo = "False" Then
        MsgBox "Operación cancelada"
        Exit Sub
    End If
    
    ' Leer archivo completo con codificación correcta
    Dim objFSO As Object
    Dim objStream As Object
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    
    ' Usar ADODB.Stream para manejar UTF-8 correctamente
    Set objStream = CreateObject("ADODB.Stream")
    objStream.Type = 2 ' adTypeText
    objStream.Charset = "UTF-8"
    objStream.Open
    objStream.LoadFromFile archivo
    contenido = objStream.ReadText
    objStream.Close
    
    ' Dividir en líneas
    contenido = Replace(contenido, vbCrLf, vbLf)
    contenido = Replace(contenido, vbCr, vbLf)
    lineas = Split(contenido, vbLf)
    
    ' Debug: mostrar primeras líneas para verificar codificación
    Debug.Print "=== VERIFICACIÓN DE CODIFICACIÓN ==="
    Debug.Print "Total de líneas: " & UBound(lineas) + 1
    For i = 0 To WorksheetFunction.Min(5, UBound(lineas))
        Debug.Print "Línea " & i & ": " & lineas(i)
    Next i
    Debug.Print "=== FIN VERIFICACIÓN ==="
    
    ' Procesar cada línea
    For i = 0 To UBound(lineas)
        Dim lineaActual As String
        lineaActual = Trim(lineas(i))
        
        ' Detectar cabecera de nueva historia
        If InStr(lineaActual, "------------------------------") > 0 And InStr(lineaActual, "Historia") > 0 Then
            ' Guardar bloque múltiple anterior si existe
            If enBloqueMultiple And bloqueMultiple <> "" And fila > 0 Then
                GuardarBloqueMultiple ws, fila, tipoBloque, bloqueMultiple
            End If
            
            ' Reset para nueva historia
            idUsuario = ""
            fila = 0
            bloqueMultiple = ""
            enBloqueMultiple = False
            tipoBloque = ""
            Debug.Print "Nueva historia detectada: " & lineaActual
            
        ElseIf InStr(lineaActual, ":::") > 0 Then
            ' Verificar si es una línea con separador :::
            posicionSeparador = InStr(lineaActual, ":::")
            campo = Trim(Left(lineaActual, posicionSeparador - 1))
            valor = Trim(Mid(lineaActual, posicionSeparador + 3))
            
            ' Guardar bloque múltiple anterior si cambiamos de campo
            If enBloqueMultiple And bloqueMultiple <> "" And fila > 0 Then
                GuardarBloqueMultiple ws, fila, tipoBloque, bloqueMultiple
                bloqueMultiple = ""
                enBloqueMultiple = False
            End If
            
            ' Verificar si es el inicio de un bloque múltiple
            If campo = "Criterios de aceptación/Escenarios" Then
                enBloqueMultiple = True
                tipoBloque = "criterios"
                bloqueMultiple = valor
                Debug.Print "Iniciando bloque de criterios"
            ElseIf campo = "Preguntas Funcionales o IT" Then
                enBloqueMultiple = True
                tipoBloque = "preguntas"
                bloqueMultiple = valor
                Debug.Print "Iniciando bloque de preguntas"
            Else
                ' Campo normal
                If campo = "ID_US" Then
                    idUsuario = valor
                    fila = BuscarFilaPorID(ws, idUsuario)
                    If fila > 0 Then
                        contadorHistorias = contadorHistorias + 1
                        Debug.Print "Procesando historia: " & idUsuario & " en fila " & fila
                    Else
                        Debug.Print "ADVERTENCIA: No se encontró el ID " & idUsuario & " en la hoja"
                    End If
                ElseIf fila > 0 And idUsuario <> "" Then
                    ' Procesar campo normal
                    columna = BuscarColumna(ws, campo)
                    If columna > 0 Then
                        ws.Cells(fila, columna).Value = valor
                        filasActualizadas = filasActualizadas + 1
                        Debug.Print "Actualizado: " & campo & " = " & Left(valor, 30) & "..."
                    Else
                        Debug.Print "Columna no encontrada, saltando: " & campo
                    End If
                End If
            End If
            
        Else
            ' Línea sin separador ::: - puede ser parte de un bloque múltiple
            If enBloqueMultiple And lineaActual <> "" Then
                If bloqueMultiple = "" Then
                    bloqueMultiple = lineaActual
                Else
                    bloqueMultiple = bloqueMultiple & vbCrLf & lineaActual
                End If
            End If
        End If
    Next i
    
    ' Guardar el último bloque múltiple si existe
    If enBloqueMultiple And bloqueMultiple <> "" And fila > 0 Then
        GuardarBloqueMultiple ws, fila, tipoBloque, bloqueMultiple
    End If
    
    MsgBox "Importación completada:" & vbCrLf & vbCrLf & _
           "Historias procesadas: " & contadorHistorias & vbCrLf & _
           "Campos actualizados: " & filasActualizadas & vbCrLf & vbCrLf & _
           "Archivo importado: " & archivo
    
End Sub

Sub GuardarBloqueMultiple(ws As Worksheet, fila As Long, tipoBloque As String, contenido As String)
'
' Guarda un bloque múltiple (criterios o preguntas) en la columna correspondiente
'
    Dim columna As Integer
    
    If tipoBloque = "criterios" Then
        columna = BuscarColumna(ws, "Criterios de aceptación/Escenarios")
        If columna > 0 Then
            ws.Cells(fila, columna).Value = contenido
            Debug.Print "Criterios guardados: " & Left(contenido, 50) & "..."
        Else
            Debug.Print "Columna 'Criterios de aceptación/Escenarios' no encontrada"
        End If
    ElseIf tipoBloque = "preguntas" Then
        columna = BuscarColumna(ws, "Preguntas Funcionales o IT")
        If columna > 0 Then
            ws.Cells(fila, columna).Value = contenido
            Debug.Print "Preguntas guardadas: " & Left(contenido, 50) & "..."
        Else
            Debug.Print "Columna 'Preguntas Funcionales o IT' no encontrada"
        End If
    End If
    
End Sub

Function BuscarFilaPorID(ws As Worksheet, idBuscado As String) As Long
'
' Busca la fila que contiene el ID especificado
'
    Dim ultimaFila As Long
    Dim columnaID As Integer
    Dim i As Long
    
    ultimaFila = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    columnaID = BuscarColumna(ws, "ID_US")
    
    If columnaID = 0 Then
        BuscarFilaPorID = 0
        Exit Function
    End If
    
    For i = 2 To ultimaFila ' Empezar desde fila 2 (saltar headers)
        If Trim(ws.Cells(i, columnaID).Value) = idBuscado Then
            BuscarFilaPorID = i
            Exit Function
        End If
    Next i
    
    BuscarFilaPorID = 0 ' No encontrado
End Function

Function BuscarColumna(ws As Worksheet, nombreColumna As String) As Integer
'
' Busca el número de columna basado en el nombre del header
'
    Dim ultimaColumna As Integer
    Dim i As Integer
    
    ultimaColumna = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    
    ' Buscar en la primera fila (headers) - usar nombre exacto
    For i = 1 To ultimaColumna
        If Trim(ws.Cells(1, i).Value) = nombreColumna Then
            BuscarColumna = i
            Exit Function
        End If
    Next i
    
    BuscarColumna = 0 ' No encontrado
End Function