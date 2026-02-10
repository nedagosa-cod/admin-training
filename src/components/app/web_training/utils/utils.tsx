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
  rowIndex?: number; // Para edición
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

// Helper para normalizar fechas de Google Viz "Date(y,m,d)" a "DD/MM/YYYY"
const normalizeGvizDate = (value: string | null): string | null => {
  if (!value) return null;

  // Si viene con formato Date(y,m,d)
  if (typeof value === 'string' && value.includes("Date(")) {
    const match = value.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      const year = match[1];
      const month = parseInt(match[2]) + 1; // Gviz usa meses 0-based
      const day = match[3];
      // Pad con ceros
      const m = month < 10 ? `0${month}` : month;
      const d = parseInt(day) < 10 ? `0${day}` : day;
      return `${d}/${m}/${year}`;
    }
  }

  // Si viene YYYY-MM-DD (ISO), convertir a DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  return value;
};

// Helper para parsear fechas string (DD/MM/YYYY o ISO) a Date object
export const parseDateString = (dateStr: string | null): Date | null => {
  if (!dateStr) return null;

  // Si es DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  // Si es ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Intento fallback
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

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
        .slice(0) // Asumiendo que row 0 ya es dato si usamos GID adecuado, o ajustar slice
        .map((row: SheetRow, index: number) => {
          return {
            rowIndex: index + 2, // Fila en Sheet (Header es 1, index 0 es 2)
            fechaSolicitud: normalizeGvizDate(row.c[0] ? String(row.c[0].v) : null),
            coordinador: row.c[1] ? String(row.c[1].v) : null,
            cliente: row.c[2] ? String(row.c[2].v) : null,
            segmento: row.c[3] ? String(row.c[3].v) : null,
            desarrollador: row.c[4] ? String(row.c[4].v) : null,
            segmentoMenu: row.c[5] ? String(row.c[5].v) : null,
            desarrollo: row.c[6] ? String(row.c[6].v) : null,
            nombre: row.c[7] ? String(row.c[7].v) : null,
            cantidad: row.c[8] ? String(row.c[8].v) : null,
            fechaMaterial: normalizeGvizDate(row.c[9] ? String(row.c[9].v) : null),
            fechaInicio: normalizeGvizDate(row.c[10] ? String(row.c[10].v) : null),
            fechaFin: normalizeGvizDate(row.c[11] ? String(row.c[11].v) : null),
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

export interface MasterData {
  festivos: FestivoRecord[];
  desarrolladores: string[];
  coordinadores: string[];
  clientes: string[];
  tiposDesarrollo: string[];
  estados: string[];
}

export const fetchMasterData = async (): Promise<MasterData> => {
  try {
    const sheetId = "1iU_X2DpMN2wmPE0-V69NvATwQX7PE_q15IYMcj5EYXY";
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=DATA`;
    const response = await fetch(url);
    const text = await response.text();
    const jsonString = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/
    );

    if (jsonString && jsonString[1]) {
      const data: SheetData = JSON.parse(jsonString[1]);
      const rows = data.table.rows;

      const festivos: FestivoRecord[] = [];
      const desarrolladores = new Set<string>();
      const coordinadores = new Set<string>();
      const clientes = new Set<string>();
      const tiposDesarrollo = new Set<string>();
      const estados = new Set<string>();

      rows.slice(0).forEach((row: SheetRow) => {
        // Festivos (Columnas D=3, E=4)
        if (row.c[3] && row.c[4]) {
          festivos.push({
            festivo: normalizeGvizDate(String(row.c[3].v)) || "",
            festividad: String(row.c[4].v),
          });
        }

        // Desarrolladores (Columna A = 0)
        if (row.c[0] && row.c[0].v) desarrolladores.add(String(row.c[0].v));

        // Coordinadores (Columna G = 6)
        if (row.c[6] && row.c[6].v) coordinadores.add(String(row.c[6].v));

        // Clientes (Columna I = 8)
        if (row.c[8] && row.c[8].v) clientes.add(String(row.c[8].v));

        // Tipos de Desarrollo (Columna K = 10)
        if (row.c[10] && row.c[10].v) tiposDesarrollo.add(String(row.c[10].v));

        // Estados (Columna M = 12)
        if (row.c[12] && row.c[12].v) estados.add(String(row.c[12].v));
      });

      console.log("📊 Datos Maestros cargados");

      return {
        festivos,
        desarrolladores: Array.from(desarrolladores).sort(),
        coordinadores: Array.from(coordinadores).sort(),
        clientes: Array.from(clientes).sort(),
        tiposDesarrollo: Array.from(tiposDesarrollo).sort(),
        estados: Array.from(estados).sort(),
      };
    }

    return { festivos: [], desarrolladores: [], coordinadores: [], clientes: [], tiposDesarrollo: [], estados: [] };
  } catch (error) {
    console.error("Error al cargar datos maestros:", error);
    return { festivos: [], desarrolladores: [], coordinadores: [], clientes: [], tiposDesarrollo: [], estados: [] };
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
            fechaInicio: normalizeGvizDate(row.c[1] ? String(row.c[1].v) : null),
            fechaFin: normalizeGvizDate(row.c[2] ? String(row.c[2].v) : null),
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

export const submitTrainingData = async (data: TrainingRecord[] | any): Promise<boolean> => {
  try {
    // Si es un array, asumimos que es CREAR múltiples (legacy/actual)
    // Si enviamos un objeto con { action: 'update' }, es actualización.

    let payload;
    if (Array.isArray(data)) {
      // Calcular campana para cada registro
      const recordsWithCampana = data.map((record: any) => ({
        ...record,
        campana: `${record.cliente || ""} ${record.segmento || ""}`.trim()
      }));
      payload = { action: 'create', data: recordsWithCampana };
    } else {
      // Si es un objeto único (update o create simple)
      // const record = data.data || data; // Eliminated unused variable

      // Si data tiene estructura { action, data, rowIndex }
      if (data.data) {
        const updatedRecord = {
          ...data.data,
          campana: `${data.data.cliente || ""} ${data.data.segmento || ""}`.trim()
        };
        payload = { ...data, data: updatedRecord };
      } else {
        // Si es registro directo (poco probable por como se llama, pero por si acaso)
        const updatedRecord = {
          ...data,
          campana: `${data.cliente || ""} ${data.segmento || ""}`.trim()
        };
        payload = updatedRecord;
      }
    }

    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });
    console.log("Datos enviados a Google Sheets (modo no-cors)", payload);
    return true;
  } catch (error) {
    console.error("Error al enviar datos a Google Sheets:", error);
    throw error;
  }
};

