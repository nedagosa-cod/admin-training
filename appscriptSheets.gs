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
    // logToDebug(debugSheet, "Snippet: " + rawData.substring(0, 100));

    var data;
    try {
      data = JSON.parse(rawData);
    } catch (parseError) {
      logToDebug(debugSheet, "Error JSON.parse: " + parseError.toString());
      logToDebug(debugSheet, "Raw Data content: " + rawData);
      return createErrorResponse("Invalid JSON");
    }

    var sheet = doc.getSheetByName(sheetName);
    if (!sheet) {
      logToDebug(debugSheet, "Error: Hoja " + sheetName + " no encontrada");
      return createErrorResponse("Sheet not found");
    }

    var rowsToAdd = data.map(function(record) {
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
    });

    if (rowsToAdd.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
      logToDebug(debugSheet, "Éxito: " + rowsToAdd.length + " filas agregadas");
    } else {
      logToDebug(debugSheet, "Advertencia: Array de datos vacío");
    }

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "rows": rowsToAdd.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    logToDebug(debugSheet, "Error General: " + e.toString());
    return createErrorResponse(e.toString());
  } finally {
    lock.releaseLock();
  }
}

function createErrorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ "result": "error", "error": msg }))
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

