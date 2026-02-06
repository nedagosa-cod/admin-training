interface SheetCell {
  v: string | number | null;
  f?: string;
}

interface SheetRow {
  c: (SheetCell | null)[];
}

interface SheetColumn {
  label: string;
  type: string;
}

interface SheetData {
  table: {
    rows: SheetRow[];
    cols: SheetColumn[];
  };
}

// Tipo para los datos del Excel
export interface TrainingRecord {
  fechaSolicitud: string | null;
  coordinador: string | null;
  cliente: string | null;
  segmento: string | null;
  desarrollador: string | null;
  segmentoMenu: string | null;
  desarrollo: string | null;
  nombre: string | null;
  cantidad: string | null;
  fechaMaterial: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  estado: string | null;
  formador: string | null;
  observaciones: string | null;
  campana: string | null;
}

export interface FestivoRecord {
  festivo: string | null;
  festividad: string | null;
}

export interface NovedadesRecord {
  desarrollador: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  novedad: string | null;
}

export const fetchGoogleSheetData = async (): Promise<TrainingRecord[]> => {
  try {
    // ID de tu Google Sheet
    const sheetId = "1iU_X2DpMN2wmPE0-V69NvATwQX7PE_q15IYMcj5EYXY";

    // Usar la API pública de Google Sheets (la hoja debe estar compartida públicamente)
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Base_WT25`;

    const response = await fetch(url);
    const text = await response.text();

    // Google retorna JSONP, necesitamos extraer el JSON
    const jsonString = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/
    );

    if (jsonString && jsonString[1]) {
      const data: SheetData = JSON.parse(jsonString[1]);
      console.log(jsonString[1]);
      // Extraer las filas y columnas
      const rows = data.table.rows;

      // Convertir a formato TrainingRecord
      const formattedData: TrainingRecord[] = rows
        .slice(0)
        .map((row: SheetRow) => {
          return {
            fechaSolicitud: row.c[0] ? String(row.c[0].v) : null,
            coordinador: row.c[1] ? String(row.c[1].v) : null,
            cliente: row.c[2] ? String(row.c[2].v) : null,
            segmento: row.c[3] ? String(row.c[3].v) : null,
            desarrollador: row.c[4] ? String(row.c[4].v) : null,
            segmentoMenu: row.c[5] ? String(row.c[5].v) : null,
            desarrollo: row.c[6] ? String(row.c[6].v) : null,
            nombre: row.c[7] ? String(row.c[7].v) : null,
            cantidad: row.c[8] ? String(row.c[8].v) : null,
            fechaMaterial: row.c[9] ? String(row.c[9].v) : null,
            fechaInicio: row.c[10] ? String(row.c[10].v) : null,
            fechaFin: row.c[11] ? String(row.c[11].v) : null,
            estado: row.c[12] ? String(row.c[12].v) : null,
            formador: row.c[13] ? String(row.c[13].v) : null,
            observaciones: row.c[14] ? String(row.c[14].v) : null,
            campana: row.c[15] ? String(row.c[15].v) : null,
          };
        });

      console.log("📊 Datos de Google Sheets:");
      console.log("Total de filas:", formattedData.length);
      console.table(formattedData);

      return formattedData;
    }

    return [];
  } catch (error) {
    console.error("Error al cargar datos de Google Sheets:", error);
    console.log(
      "Asegúrate de que la hoja esté compartida públicamente (cualquier persona con el enlace puede ver)"
    );
    return [];
  }
};

export const fetchSheetFestivosData = async (): Promise<FestivoRecord[]> => {
  try {
    const sheetId = "1iU_X2DpMN2wmPE0-V69NvATwQX7PE_q15IYMcj5EYXY";
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=DATA`;
    const response = await fetch(url);
    const text = await response.text();
    // Google retorna JSONP, necesitamos extraer el JSON
    const jsonString = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/
    );

    if (jsonString && jsonString[1]) {
      const data: SheetData = JSON.parse(jsonString[1]);
      console.log(jsonString[1]);
      // Extraer las filas y columnas
      const rows = data.table.rows;

      // Convertir a formato TrainingRecord
      const formattedData: FestivoRecord[] = rows
        .slice(0)
        .map((row: SheetRow) => {
          return {
            festivo: row.c[3] ? String(row.c[3].v) : null,
            festividad: row.c[4] ? String(row.c[4].v) : null,
          };
        });

      console.log("📊 Datos de Google Sheets:");
      console.log("Total de filas:", formattedData.length);
      console.table(formattedData);

      return formattedData;
    }

    return [];
  } catch (error) {
    console.error("Error al cargar datos de Google Sheets:", error);
    return [];
  }
};

export const fetchSheetNovedades = async (): Promise<NovedadesRecord[]> => {
  try {
    const sheetId = "1iU_X2DpMN2wmPE0-V69NvATwQX7PE_q15IYMcj5EYXY";
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Novedades`;
    const response = await fetch(url);
    const text = await response.text();
    // Google retorna JSONP, necesitamos extraer el JSON
    const jsonString = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/
    );

    if (jsonString && jsonString[1]) {
      const data: SheetData = JSON.parse(jsonString[1]);
      console.log(jsonString[1]);
      // Extraer las filas y columnas
      const rows = data.table.rows;

      // Convertir a formato TrainingRecord
      const formattedData: NovedadesRecord[] = rows
        .slice(0)
        .map((row: SheetRow) => {
          return {
            desarrollador: row.c[0] ? String(row.c[0].v) : null,
            fechaInicio: row.c[1] ? String(row.c[1].v) : null,
            fechaFin: row.c[2] ? String(row.c[2].v) : null,
            novedad: row.c[3] ? String(row.c[3].v) : null,
          };
        });

      console.log("📊 Datos de Google Sheets:");
      console.log("Total de filas:", formattedData.length);
      console.table(formattedData);

      return formattedData;
    }

    return [];
  } catch (error) {
    console.error("Error al cargar datos de Google Sheets:", error);
    return [];
  }
};

// URL del Web App de Google Apps Script
const GAS_URL = "https://script.google.com/macros/s/AKfycbwK5JdgsfnNW_hq3r-6Slz4O76B-XQh4m2y6YoCSHOkzKKuRXwu5bWl5E0S9vpjHMD3/exec";

export const submitTrainingData = async (data: TrainingRecord[]): Promise<boolean> => {
  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(data),
    });
    console.log("Datos enviados a Google Sheets (modo no-cors)");
    return true;
  } catch (error) {
    console.error("Error al enviar datos a Google Sheets:", error);
    throw error;
  }
};

