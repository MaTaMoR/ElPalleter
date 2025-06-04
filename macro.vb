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
    
    Set ws = ActiveSheet
    filasActualizadas = 0
    contadorHistorias = 0
    
    ' Seleccionar archivo
    archivo = Application.GetOpenFilename(FileFilter:="Archivos de texto (*.txt), *.txt", _
                                        Title:="Seleccionar archivo con análisis generado")
    
    If archivo = "False" Then
        MsgBox "Operación cancelada"
        Exit Sub
    End If
    
    ' Leer archivo completo
    Dim objFSO As Object
    Dim objFile As Object
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    Set objFile = objFSO.OpenTextFile(archivo, 1, False, -1) ' -1 = Unicode/UTF-8
    contenido = objFile.ReadAll
    objFile.Close
    
    ' Dividir en líneas
    contenido = Replace(contenido, vbCrLf, vbLf)
    contenido = Replace(contenido, vbCr, vbLf)
    lineas = Split(contenido, vbLf)
    
    ' Procesar cada línea
    For i = 0 To UBound(lineas)
        Dim lineaActual As String
        lineaActual = Trim(lineas(i))
        
        ' Detectar cabecera de nueva historia
        If InStr(lineaActual, "------------------------------") > 0 And InStr(lineaActual, "Historia") > 0 Then
            ' Reset para nueva historia
            idUsuario = ""
            fila = 0
            Debug.Print "Nueva historia detectada: " & lineaActual
        ElseIf InStr(lineaActual, ":::") > 0 Then
            ' Verificar si es una línea con separador :::
            posicionSeparador = InStr(lineaActual, ":::")
            campo = Trim(Left(lineaActual, posicionSeparador - 1))
            valor = Trim(Mid(lineaActual, posicionSeparador + 3))
            
            ' Si encontramos un ID_US, establecer la fila actual
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
                ' Procesar otros campos solo si tenemos una historia válida
                columna = BuscarColumna(ws, campo)
                If columna > 0 Then
                    ' Verificar si es un campo de criterios múltiples
                    If Left(campo, Len(idUsuario) + 3) = idUsuario & "-CA" Or _
                       IsNumeric(Left(campo, 1)) Then
                        ' Es un criterio de aceptación o pregunta funcional
                        ActualizarCampoMultiple ws, fila, campo, valor, idUsuario
                        Debug.Print "Campo múltiple actualizado: " & campo
                    Else
                        ' Campo normal
                        ws.Cells(fila, columna).Value = valor
                        filasActualizadas = filasActualizadas + 1
                        Debug.Print "Actualizado: " & campo & " = " & Left(valor, 30) & "..."
                    End If
                Else
                    ' Si no existe la columna, saltar el valor
                    Debug.Print "Columna no encontrada, saltando: " & campo
                End If
            End If
        End If
    Next i
    
    MsgBox "Importación completada:" & vbCrLf & vbCrLf & _
           "Historias procesadas: " & contadorHistorias & vbCrLf & _
           "Campos actualizados: " & filasActualizadas & vbCrLf & vbCrLf & _
           "Archivo importado: " & archivo
    
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

Sub ActualizarCampoMultiple(ws As Worksheet, fila As Long, campo As String, valor As String, idUsuario As String)
'
' Maneja campos que pueden tener múltiples valores (criterios y preguntas)
' Los consolida en una sola celda separados por newlines
'
    Dim columnaBase As Integer
    Dim valorExistente As String
    
    ' Determinar la columna base usando nombres exactos
    If InStr(campo, "-CA") > 0 Then
        ' Es un criterio de aceptación
        columnaBase = BuscarColumna(ws, "Criterios de aceptación/Escenarios")
        If columnaBase = 0 Then
            Debug.Print "Columna 'Criterios de aceptación/Escenarios' no encontrada, saltando: " & campo
            Exit Sub
        End If
    ElseIf IsNumeric(Left(campo, 1)) Then
        ' Es una pregunta funcional
        columnaBase = BuscarColumna(ws, "Preguntas Funcionales o IT")
        If columnaBase = 0 Then
            Debug.Print "Columna 'Preguntas Funcionales o IT' no encontrada, saltando: " & campo
            Exit Sub
        End If
    Else
        Exit Sub
    End If
    
    ' Agregar el valor al contenido existente en una sola celda
    valorExistente = ws.Cells(fila, columnaBase).Value
    If valorExistente = "" Then
        ws.Cells(fila, columnaBase).Value = valor
    Else
        ws.Cells(fila, columnaBase).Value = valorExistente & vbCrLf & valor
    End If
    
End Sub