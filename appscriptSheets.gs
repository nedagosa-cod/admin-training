function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Base_WT25";
  var debugSheet = getOrCreateDebugSheet(doc);
  
  try {
    logToDebug(debugSheet, "Inicio de petición POST");
    
    if (!e || !e.postData) {
      logToDebug(debugSheet, "Error: No postData received");
      return createErrorResponse("No postData");
    }

    var rawData = e.postData.contents;
    logToDebug(debugSheet, "Datos recibidos (length): " + rawData.length);

    var payload;
    try {
      payload = JSON.parse(rawData);
    } catch (parseError) {
      logToDebug(debugSheet, "Error JSON.parse: " + parseError.toString());
      return createErrorResponse("Invalid JSON");
    }

    var sheet = doc.getSheetByName(sheetName);
    if (!sheet) {
      return createErrorResponse("Sheet not found");
    }

    // Determinar acción: 'create' (default) o 'update'
    var action = payload.action || 'create';
    logToDebug(debugSheet, "Acción: " + action);

    if (action === 'update') {
      return handleUpdate(sheet, payload, debugSheet);
    } else {
      return handleCreate(sheet, payload.data || payload, debugSheet);
    }

  } catch (e) {
    logToDebug(debugSheet, "Error General: " + e.toString());
    return createErrorResponse(e.toString());
  } finally {
    lock.releaseLock();
  }
}

function handleCreate(sheet, data, debugSheet) {
  // Soporta tanto array de registros como un solo registro
  var records = Array.isArray(data) ? data : [data];
  
  var rowsToAdd = records.map(function(record) {
    return mapRecordToRow(record);
  });

  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
    logToDebug(debugSheet, "Éxito: " + rowsToAdd.length + " filas agregadas");
  }

  return createSuccessResponse({ "rows": rowsToAdd.length, "action": "create" });
}

function handleUpdate(sheet, payload, debugSheet) {
  var rowIndex = payload.rowIndex;
  var record = payload.data;

  if (!rowIndex || !record) {
    return createErrorResponse("Missing rowIndex or data for update");
  }

  // Validar rowIndex (asegurar que es número y > 1)
  // Nota: rowIndex viene del frontend. Si el frontend calcula index+2, aquí es directo.
  // Es mejor usar número de fila 1-based directo.
  
  logToDebug(debugSheet, "Actualizando fila: " + rowIndex);
  
  var rowData = mapRecordToRow(record);
  
  // Actualizar la fila específica (col 1 a 16)
  sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  
  return createSuccessResponse({ "updated": true, "rowIndex": rowIndex, "action": "update" });
}

function mapRecordToRow(record) {
  return [
    record.fechaSolicitud || "",
    record.coordinador || "",
    record.cliente || "",
    record.segmento || "",
    record.desarrollador || "",
    record.segmentoMenu || "",
    record.desarrollo || "",
    record.nombre || "",
    record.cantidad || "",
    record.fechaMaterial || "",
    record.fechaInicio || "",
    record.fechaFin || "",
    record.estado || "",
    record.formador || "",
    record.observaciones || "",
    record.campana || ""
  ];
}

function createErrorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ "result": "error", "error": msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createSuccessResponse(data) {
  return ContentService
      .createTextOutput(JSON.stringify(Object.assign({ "result": "success" }, data)))
      .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateDebugSheet(doc) {
  var name = "SystemLogs";
  var sheet = doc.getSheetByName(name);
  if (!sheet) {
    sheet = doc.insertSheet(name);
    sheet.appendRow(["Timestamp", "Message"]);
  }
  return sheet;
}

function logToDebug(sheet, message) {
  try {
    var timestamp = new Date();
    sheet.appendRow([timestamp, message]);
  } catch(e) {
    // Fail silently
  }
}

function doGet(e) {
   return ContentService
      .createTextOutput(JSON.stringify({ "status": "active" }))
      .setMimeType(ContentService.MimeType.JSON);
}

