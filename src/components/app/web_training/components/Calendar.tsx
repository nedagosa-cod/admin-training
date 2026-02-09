import { useState, useEffect } from "react";
import { parseDateString } from "../utils/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isWithinInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import type {
  TrainingRecord,
  FestivoRecord,
  NovedadesRecord,
} from "../utils/utils";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Flag,
  BookCheck,
  CircleFadingArrowUp,
  ShieldX,
  Trash2,
} from "lucide-react";

interface CalendarProps {
  data: TrainingRecord[];
  festivos: FestivoRecord[];
  novedades: NovedadesRecord[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDay: Date | null;
  setSelectedDay: (date: Date | null) => void;
  onEdit?: (record: TrainingRecord) => void;
  onUpdateRecord?: (record: TrainingRecord) => Promise<void>;
  onBatchUpdate?: (records: TrainingRecord[], deletedIds?: number[]) => Promise<void>;
  estados?: string[];
  onAddRecord?: (record: TrainingRecord) => Promise<void>;
  tiposDesarrollo?: string[];
}

// Interfaz para agrupar eventos por campaña
interface GroupedEvent {
  campana: string;
  coordinador: string | null;
  desarrollador: string | null;
  cliente: string | null;
  segmento: string | null;
  segmentoMenu: string | null;
  formador: string | null;
  fechaMaterial: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  desarrollos: Array<{
    desarrollo: string | null;
    nombre: string | null;
    segmento: string | null;
    cantidad: string | null;
    estado: string | null;
    observaciones: string | null;
    originalRecord?: TrainingRecord;
  }>;
}

// Componente para edición en línea
const EditableField = ({
  value,
  onSave,
  type = "text",
  className = "",
  isEditingEnabled = false,
  options = [],
}: {
  value: string | null;
  onSave: (newValue: string) => void;
  type?: "text" | "number" | "select" | "textarea";
  className?: string;
  isEditingEnabled?: boolean;
  options?: string[];
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  if (!isEditingEnabled) {
    return <span className={className}>{value || "-"}</span>;
  }

  if (isEditing) {
    const handleBlur = () => {
      setIsEditing(false);
      if (currentValue !== (value || "")) {
        onSave(currentValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && type !== "textarea") {
        handleBlur();
      }
      if (e.key === "Escape") {
        setIsEditing(false);
        setCurrentValue(value || "");
      }
    };

    if (type === "select") {
      return (
        <select
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleBlur}
          autoFocus
          className="border rounded px-2 py-1 text-sm w-full bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccionar...</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }

    if (type === "textarea") {
      return (
        <textarea
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="border rounded px-2 py-1 text-sm w-full bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 min-h-[60px]"
        />
      )
    }

    return (
      <input
        type={type}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="border rounded px-2 py-1 text-sm w-full bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-pointer hover:bg-yellow-100 hover:text-yellow-900 px-1 rounded transition-colors border border-transparent hover:border-yellow-300`}
      title="Clic para editar"
    >
      {value || <span className="text-gray-400 italic">Clic para editar</span>}
    </span>
  );
};

export default function Calendar({
  data,
  festivos,
  currentMonth,
  setCurrentMonth,
  selectedDay,
  setSelectedDay,
  novedades,
  onUpdateRecord,
  onBatchUpdate,
  estados,
  onAddRecord,
  tiposDesarrollo,
}: CalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<GroupedEvent | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showActualizaciones, setShowActualizaciones] = useState<boolean>(true);
  const [showIncumplimientos, setShowIncumplimientos] = useState<boolean>(true);

  // Estado para la creación de nuevo desarrollo en el modal
  const [isAdding, setIsAdding] = useState(false);
  const [newDevelopment, setNewDevelopment] = useState<Partial<TrainingRecord>>({
    desarrollo: "",
    nombre: "",
    cantidad: "",
    fechaMaterial: "",
    fechaInicio: "",
    fechaFin: "",
    estado: "Pendiente",
    observaciones: ""
  });

  // Estado para cambios pendientes de guardar [rowIndex -> record]
  const [modifiedRecords, setModifiedRecords] = useState<Map<number, TrainingRecord>>(new Map());
  // Estado para registros marcados para eliminar [Set<rowIndex>]
  const [deletedRecordIndices, setDeletedRecordIndices] = useState<Set<number>>(new Set());

  // Función para guardar cambios en línea (buffer local)
  const handleSaveField = async (
    originalRecord: TrainingRecord,
    field: keyof TrainingRecord,
    newValue: string
  ) => {
    // Si no hay función de actualización, no hacemos nada
    if (!onBatchUpdate && !onUpdateRecord) return;

    // Crear registro actualizado
    const updatedRecord = { ...originalRecord, [field]: newValue };

    // 1. Actualizar UI local (optimistic)
    if (selectedEvent) {
      const updatedDesarrollos = selectedEvent.desarrollos.map(cat => {
        if (cat.originalRecord === originalRecord) {
          return { ...cat, [field]: newValue, originalRecord: updatedRecord };
        }
        return cat;
      });
      setSelectedEvent({ ...selectedEvent, desarrollos: updatedDesarrollos });
    }

    // 2. Guardar en buffer de cambios
    if (updatedRecord.rowIndex !== undefined) {
      const rowIndex = updatedRecord.rowIndex;
      setModifiedRecords(prev => {
        const newMap = new Map(prev);
        // Si ya existe en modificados, tomamos ese como base por si se editó otro campo antes
        const existing = newMap.get(rowIndex);
        const base = existing || updatedRecord;
        newMap.set(rowIndex, { ...base, [field]: newValue });
        return newMap;
      });
    }
  };

  // Guardar todos los cambios
  // Función para marcar registro para eliminar
  const handleDeleteRecord = (record: TrainingRecord) => {
    if (record.rowIndex === undefined) return;

    setDeletedRecordIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(record.rowIndex!)) {
        newSet.delete(record.rowIndex!); // Toggle (undelete)
      } else {
        newSet.add(record.rowIndex!);
      }
      return newSet;
    });
  };

  // Guardar todos los cambios
  const handleSaveChanges = async () => {
    if (!onBatchUpdate || (modifiedRecords.size === 0 && deletedRecordIndices.size === 0)) return;

    const recordsToSave = Array.from(modifiedRecords.values());
    const recordsToDelete = Array.from(deletedRecordIndices);

    await onBatchUpdate(recordsToSave, recordsToDelete);

    // Limpiar cambios después de guardar
    setModifiedRecords(new Map());
    setDeletedRecordIndices(new Set());
  };

  const handleSaveNewDevelopment = async () => {
    if (!selectedEvent || !onAddRecord) return;

    // Construir el nuevo registro combinando datos del evento (header) y del formulario
    const newRecord: TrainingRecord = {
      // Header data from selectedEvent
      coordinador: selectedEvent.coordinador,
      cliente: selectedEvent.cliente,
      segmento: selectedEvent.segmento,
      desarrollador: selectedEvent.desarrollador,
      segmentoMenu: selectedEvent.segmentoMenu,
      campana: selectedEvent.campana,
      formador: selectedEvent.formador,
      fechaSolicitud: new Date().toISOString().split('T')[0], // Default a hoy

      // New development data
      desarrollo: newDevelopment.desarrollo || "",
      nombre: newDevelopment.nombre || "",
      cantidad: newDevelopment.cantidad || "",
      fechaMaterial: newDevelopment.fechaMaterial || "",
      fechaInicio: newDevelopment.fechaInicio || "",
      fechaFin: newDevelopment.fechaFin || "",
      estado: newDevelopment.estado || "Pendiente",
      observaciones: newDevelopment.observaciones || "",
    };

    await onAddRecord(newRecord);
    setIsAdding(false);
    setNewDevelopment({
      desarrollo: "",
      nombre: "",
      cantidad: "",
      fechaMaterial: "",
      fechaInicio: "",
      fechaFin: "",
      estado: "Pendiente",
      observaciones: ""
    });
    setSelectedEvent(null); // Cerrar modal para refrescar o forzar recarga
  };

  // Obtener todos los días del mes actual incluyendo días de semanas anteriores/posteriores
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes como primer día
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  }).filter(
    (day) => day.getDay() !== 0 // Filtrar domingos (0 = domingo)
  );
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Función para obtener eventos activos en una fecha específica
  const getEventsForDate = (date: Date): TrainingRecord[] => {
    return data.filter((record) => {
      if (!record.fechaInicio || !record.fechaFin) return false;

      try {
        const startDate = parseDateString(record.fechaInicio);
        const endDate = parseDateString(record.fechaFin);

        if (startDate && endDate) {
          // Verificar si hay algún día del mes dentro del rango
          // Nota: aquí la lógica original comparaba con currentMonth pero el nombre de la función es getEventsForDate(date)
          // Sin embargo, esta función se usa para mostrar EVENTOS DEL DÍA SELECCIONADO.
          // La lógica original usaba isWithinInterval.
          return isWithinInterval(date, { start: startDate, end: endDate });
        }
        return false;
      } catch (error) {
        console.error("Error parseando fechas:", error, record);
        return false;
      }
    });
  };
  // Función para agrupar eventos por campaña
  const groupEventsByCampaign = (events: TrainingRecord[]): GroupedEvent[] => {
    const grouped = new Map<string, GroupedEvent>();

    events.forEach((event) => {
      const campana = event.campana || "Sin campaña";

      if (!grouped.has(campana)) {
        grouped.set(campana, {
          campana: campana,
          coordinador: event.coordinador,
          desarrollador: event.desarrollador,
          cliente: event.cliente,
          segmento: event.segmento,
          segmentoMenu: event.segmentoMenu,
          formador: event.formador,
          fechaMaterial: event.fechaMaterial,
          fechaInicio: event.fechaInicio,
          fechaFin: event.fechaFin,
          desarrollos: [],
        });
      }

      const group = grouped.get(campana)!;
      group.desarrollos.push({
        desarrollo: event.desarrollo,
        nombre: event.nombre,
        segmento: event.segmento,
        cantidad: event.cantidad,
        estado: event.estado,
        observaciones: event.observaciones,
        originalRecord: event,
      });
    });

    return Array.from(grouped.values());
  };

  // Función para verificar si un día es festivo
  const isHoliday = (
    date: Date
  ): { isHoliday: boolean; name: string | null } => {
    for (const festivo of festivos) {
      if (!festivo.festivo) continue;

      try {
        const festivoDate = parseDateString(festivo.festivo);

        if (!festivoDate) continue;

        // Comparar solo año, mes y día
        if (
          festivoDate.getFullYear() === date.getFullYear() &&
          festivoDate.getMonth() === date.getMonth() &&
          festivoDate.getDate() === date.getDate()
        ) {
          return { isHoliday: true, name: festivo.festividad };
        }
      } catch (error) {
        console.error("Error parseando fecha de festivo:", error, festivo);
      }
    }

    return { isHoliday: false, name: null };
  };

  // Función para obtener novedades activas en una fecha específica
  const getNovedadesForDate = (date: Date): NovedadesRecord[] => {
    return novedades.filter((novedad) => {
      if (!novedad.fechaInicio || !novedad.fechaFin) return false;

      try {
        const startDate = parseDateString(novedad.fechaInicio);
        const endDate = parseDateString(novedad.fechaFin);

        if (startDate && endDate) {
          return isWithinInterval(date, { start: startDate, end: endDate });
        }
        return false;
      } catch (error) {
        console.error("Error parseando fecha de novedad:", error, novedad);
        return false;
      }
    });
  };



  // Paleta de colores para campañas (50+ colores distintos)
  const campaignColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
    "bg-lime-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-sky-500",
    "bg-rose-500",
    "bg-green-600",
    "bg-sky-500",
    "bg-slate-500",
    "bg-blue-600",
    "bg-pink-600",
    "bg-red-900",
    "bg-indigo-600",
    "bg-purple-600",
    "bg-red-800",
    "bg-teal-600",
    "bg-yellow-400",
    "bg-cyan-600",
    "bg-blue-900",
    "bg-amber-600",
    "bg-emerald-600",
    "bg-red-500",
    "bg-fuchsia-600",
    "bg-rose-600",
    "bg-red-700",
    "bg-blue-700",
    "bg-green-700",
    "bg-cyan-500",
    "bg-indigo-700",
    "bg-red-900",
    "bg-purple-700",
    "bg-yellow-700",
    "bg-teal-700",
    "bg-orange-700",
    "bg-cyan-700",
    "bg-lime-700",
    "bg-amber-700",
    "bg-emerald-700",
    "bg-violet-700",
    "bg-fuchsia-700",
    "bg-rose-700",
    "bg-sky-700",
  ];

  // Función para obtener un color consistente para cada campaña
  const getCampaignColor = (campana: string | null): string => {
    if (!campana) return "bg-gray-500";

    // Generar un hash simple del nombre de la campaña
    let hash = 0;
    for (let i = 0; i < campana.length; i++) {
      hash = campana.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Usar el hash para seleccionar un color de la paleta
    const index = Math.abs(hash) % campaignColors.length;
    return campaignColors[index];
  };

  // Función para obtener un color consistente para cada desarrollador (usada en novedades)
  const getDeveloperColor = (desarrollador: string | null): string => {
    if (!desarrollador) return "bg-gray-500";

    const developerColors = [
      "bg-green-500",
      "bg-pink-500",
      "bg-red-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-cyan-500",
      "bg-blue-500",
    ];

    // Generar un hash simple del nombre del desarrollador
    let hash = 0;
    for (let i = 0; i < desarrollador.length; i++) {
      hash = desarrollador.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Usar el hash para seleccionar un color de la paleta
    const index = Math.abs(hash) % developerColors.length;
    return developerColors[index];
  };

  // Obtener color según el estado (solo para el modal de detalle)
  const getStatusColor = (estado: string | null): string => {
    if (!estado) return "bg-gray-500";
    switch (estado.toLowerCase()) {
      case "entregado":
        return "bg-green-500";
      case "finalizado":
        return "bg-blue-500";
      case "cancelado":
        return "bg-orange-800";
      case "en proceso":
        return "bg-yellow-500";
      case "proyectado":
        return "bg-gray-500";
      case "sin material":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Función para verificar si una fecha es inicio o fin de un evento
  const isDateStartOrEnd = (
    date: Date,
    event: GroupedEvent
  ): { isStart: boolean; isEnd: boolean } => {
    if (!event.fechaInicio || !event.fechaFin)
      return { isStart: false, isEnd: false };

    try {
      const startDate = parseDateString(event.fechaInicio);
      const endDate = parseDateString(event.fechaFin);

      if (!startDate || !endDate) return { isStart: false, isEnd: false };

      // Comparar solo año, mes y día
      const isStart =
        startDate.getFullYear() === date.getFullYear() &&
        startDate.getMonth() === date.getMonth() &&
        startDate.getDate() === date.getDate();

      const isEnd =
        endDate.getFullYear() === date.getFullYear() &&
        endDate.getMonth() === date.getMonth() &&
        endDate.getDate() === date.getDate();

      return { isStart, isEnd };
    } catch (error) {
      console.error("Error parseando fechas:", error, event);
      return { isStart: false, isEnd: false };
    }
  };

  // Función para formatear fechas del formato Date(año, mes, día) a día/mes/año
  const formatDateString = (dateString: string | null): string => {
    if (!dateString) return "";

    // Si ya viene como DD/MM/YYYY, devolver tal cual
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;

    const date = parseDateString(dateString);
    if (!date) return dateString || "";

    return format(date, "dd/MM/yyyy");
  };

  // Obtener campañas activas del mes actual
  const getActiveCampaigns = (): string[] => {
    const campaignsInMonth = data.filter((record) => {
      // Verificar si hay fechas válidas
      if (!record.fechaInicio || !record.fechaFin) return false;

      try {
        const startDate = parseDateString(record.fechaInicio);
        const endDate = parseDateString(record.fechaFin);

        if (startDate && endDate) {
          // Verificar si hay algún día del mes dentro del rango
          const monthStartDate = startOfMonth(currentMonth);
          const monthEndDate = endOfMonth(currentMonth);

          return startDate <= monthEndDate && endDate >= monthStartDate;
        }
        return false;
      } catch (error) {
        console.error("Error parseando fechas:", error, record);
        return false;
      }
    });

    // Obtener campañas únicas
    const uniqueCampaigns = Array.from(
      new Set(
        campaignsInMonth
          .map((record) => record.campana)
          .filter((c): c is string => !!c)
      )
    ).sort();

    return uniqueCampaigns;
  };

  const activeCampaigns = getActiveCampaigns();

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header del calendario */}
      <div className="flex flex-col gap-4 mb-8 px-4">
        <div className="flex items-center justify-between gap-4">
          <div className=" flex flex-col items-center justify-center">
            <h2 className="text-2xl  font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent capitalize text-center">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </h2>
            {/* Cambia mes */}
            <div className="flex gap-3">
              <button
                onClick={prevMonth}
                className="p-3 bg-linear-to-r from-blue-500 to-indigo-600 text-white rounded-lg transition-all hover:shadow-lg transform hover:scale-105"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-6 py-3 bg-linear-to-r from-purple-500 to-pink-600 text-white rounded-lg transition-all hover:shadow-lg transform hover:scale-105 font-bold"
              >
                Hoy
              </button>
              <button
                onClick={nextMonth}
                className="p-3 bg-linear-to-r from-blue-500 to-indigo-600 text-white rounded-lg transition-all hover:shadow-lg transform hover:scale-105"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Leyenda de colores */}
          <div className="bg-white rounded-lg shadow-md px-4 py-2 border border-gray-200 w-full">
            <div className="flex items-center gap-4 2xl:gap-6">
              <span className="text-xs font-bold text-gray-600 hidden 2xl:block">
                Estados:
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Finalizada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                  <span className="text-xs text-gray-700">En Proceso</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-800 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Pendiente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-500 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Sin Iniciar</span>
                </div>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>

              {/* Iconos de inicio y fin */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Play className="w-4 h-4 text-gray-700" />
                  <span className="text-xs text-gray-700">Inicio</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flag className="w-4 h-4 text-gray-700" />
                  <span className="text-xs text-gray-700">Fin</span>
                </div>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              {/* Controles de visibilidad */}
              <div className="flex gap-4 items-center ">
                <span className="text-xs font-bold text-gray-700 hidden 2xl:block">
                  Mostrar:
                </span>

                {/* Control de actualizaciones */}
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-all">
                  <input
                    type="checkbox"
                    checked={showActualizaciones}
                    onChange={(e) => setShowActualizaciones(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <CircleFadingArrowUp className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-gray-700">
                    Actualizaciones
                  </span>
                </label>

                {/* Control de incumplimientos */}
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-all">
                  <input
                    type="checkbox"
                    checked={showIncumplimientos}
                    onChange={(e) => setShowIncumplimientos(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                  />
                  <ShieldX className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-gray-700">
                    Incumplimientos
                  </span>
                </label>
              </div>
            </div>
            {/* Campañas activas del mes */}
            {activeCampaigns.length > 0 && (
              <div className="bg-blue-500 rounded-lg shadow-md px-4 py-3 border border-gray-200 mt-2 flex items-center justify-center">
                <div className="flex items-center gap-2 flex-wrap">
                  {activeCampaigns.map((campaign) => (
                    <button
                      key={campaign}
                      onClick={() =>
                        setSelectedCampaign(
                          selectedCampaign === campaign ? null : campaign
                        )
                      }
                      className={`px-3 py-1 rounded shadow-sm hover:shadow-md transition-all transform hover:scale-105 cursor-pointer ${selectedCampaign === campaign
                        ? "bg-white text-gray-800 ring-2 ring-white"
                        : `${getCampaignColor(
                          campaign
                        )} text-white ring-1 ring-white/30`
                        }`}
                      title={
                        selectedCampaign === campaign
                          ? "Clic para quitar filtro"
                          : "Clic para filtrar por esta campaña"
                      }
                    >
                      <span className="text-xs font-medium">{campaign}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="flex-1 flex flex-col">
        {/* Días de la semana */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-bold text-sm text-white bg-linear-to-r from-blue-500 to-indigo-600 2xl:py-3 py-1 rounded-lg shadow-md"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-6 gap-3 flex-1">
          {days.map((day) => {
            const eventsForDay = getEventsForDate(day);
            const groupedEvents = groupEventsByCampaign(eventsForDay);
            const novedadesForDay = getNovedadesForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            const holidayInfo = isHoliday(day);
            return (
              <div
                key={day.toString()}
                onClick={() => setSelectedDay(day)}
                className={`
                  border-2 rounded-xl p-3 min-h-[100px] flex flex-col cursor-pointer
                  transition-all hover:shadow-xl transform hover:scale-105
                  ${holidayInfo.isHoliday
                    ? "bg-red-100 border-red-400"
                    : isCurrentMonth
                      ? "bg-white border-gray-200"
                      : "bg-gray-100 border-gray-300"
                  }
                  ${isCurrentDay ? "ring-4 ring-blue-400 shadow-lg" : ""}
                  ${selectedDay &&
                    format(selectedDay, "yyyy-MM-dd") ===
                    format(day, "yyyy-MM-dd")
                    ? "ring-4 ring-purple-400 shadow-lg"
                    : ""
                  }
                `}
              >
                <div className="flex-1 flex">
                  <div
                    className={`
                    text-sm font-bold mb-2 flex items-center justify-center w-7 h-7 rounded-full
                    ${isCurrentMonth ? "text-gray-900" : "text-gray-500"}
                    ${isCurrentDay
                        ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white"
                        : holidayInfo.isHoliday
                          ? "bg-red-600 text-white"
                          : ""
                      }
                  `}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="flex items-center gap-3 ml-2">
                    {novedadesForDay.map((novedad, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 transform rotate-45 shadow-sm mb-2 ring-2 ring-red-800 ${getDeveloperColor(
                          novedad.desarrollador
                        )}`}
                        title={`${novedad.desarrollador || "Sin desarrollador"
                          }: ${novedad.novedad || "Sin descripción"}`}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Eventos del día */}
                <div className="flex-1 flex">
                  {holidayInfo.isHoliday ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <p className="text-xs font-bold text-red-700">
                          🎉 Festivo
                        </p>
                        {holidayInfo.name && (
                          <p className="text-[10px] text-red-600 mt-1">
                            {holidayInfo.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-full">
                        <div className="flex gap-1 px-2 items-center">
                          <BookCheck className="w-3 h-3 text-green-500 relative -left-2" />
                          {groupedEvents
                            .filter(
                              (event) =>
                                !event.desarrollos.some(
                                  (d) =>
                                    d.desarrollo?.toUpperCase() ===
                                    "ACTUALIZACION"
                                )
                            )
                            .slice(0, 6)
                            .map((event, idx) => {
                              const dateStatus = isDateStartOrEnd(day, event);
                              const isFiltered =
                                selectedCampaign &&
                                event.campana !== selectedCampaign;
                              // Obtener el estado más relevante (priorizar en proceso y finalizado)
                              const getGroupStatus = () => {
                                const estados = event.desarrollos.map(
                                  (d) => d.estado
                                );
                                if (
                                  estados.some(
                                    (e) => e?.toLowerCase() === "en proceso"
                                  )
                                )
                                  return "En Proceso";
                                if (
                                  estados.some(
                                    (e) => e?.toLowerCase() === "finalizado"
                                  )
                                )
                                  return "Finalizado";
                                if (
                                  estados.some(
                                    (e) => e?.toLowerCase() === "entregado"
                                  )
                                )
                                  return "Entregado";
                                return estados[0] || null;
                              };
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedEvent(event)}
                                  className={`
                              flex-1 min-w-0
                              text-left text-[10px] 2xl:px-2 px-1 py-1.5 rounded-lg flex justify-between items-center gap-1
                              ${getCampaignColor(event.campana)} text-white
                              hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:scale-105 
                              truncate
                              ${isFiltered
                                      ? "opacity-30 grayscale saturate-0"
                                      : ""
                                    }
                            `}
                                  title={`${event.campana || "Sin campaña"} (${event.desarrollos.length
                                    } desarrollo${event.desarrollos.length > 1 ? "s" : ""
                                    })`}
                                >
                                  <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold hidden 2xl:block">
                                    {event.desarrollador
                                      ?.split(" ")[0]
                                      .slice(0, 1)
                                      .toUpperCase()}
                                    {event.desarrollador
                                      ?.split(" ")[1]
                                      .slice(0, 1)
                                      .toUpperCase()}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    {dateStatus.isStart && (
                                      <Play className="2xl:w-3 2xl:h-3 w-2 h-2 text-white" />
                                    )}
                                    {dateStatus.isEnd && (
                                      <Flag className="2xl:w-3 2xl:h-3 w-2 h-2 text-white" />
                                    )}
                                    <div
                                      className={`rounded-full 2xl:ring-2 ring-1 ring-white ${getStatusColor(
                                        getGroupStatus()
                                      )} 2xl:w-2 2xl:h-2 w-1.5 h-1.5 shadow-sm`}
                                    ></div>
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                        {showActualizaciones && (
                          <div className="flex gap-1 px-2 mt-1">
                            <CircleFadingArrowUp className="2xl:w-3 2xl:h-3 w-2 h-2 text-blue-500 relative -left-2" />
                            {groupedEvents
                              .filter(
                                (event) =>
                                  event.desarrollos.some(
                                    (d) =>
                                      d.desarrollo?.toUpperCase() ===
                                      "ACTUALIZACION"
                                  ) &&
                                  !event.desarrollos.some(
                                    (d) =>
                                      d.estado?.toLowerCase() ===
                                      "incumplimiento"
                                  )
                              )
                              .slice(0, 6)
                              .map((event, idx) => {
                                const dateStatus = isDateStartOrEnd(day, event);
                                const isFiltered =
                                  selectedCampaign &&
                                  event.campana !== selectedCampaign;
                                // Obtener el estado más relevante (priorizar en proceso y finalizado)
                                const getGroupStatus = () => {
                                  const estados = event.desarrollos.map(
                                    (d) => d.estado
                                  );
                                  if (
                                    estados.some(
                                      (e) => e?.toLowerCase() === "en proceso"
                                    )
                                  )
                                    return "En Proceso";
                                  if (
                                    estados.some(
                                      (e) => e?.toLowerCase() === "finalizado"
                                    )
                                  )
                                    return "Finalizado";
                                  if (
                                    estados.some(
                                      (e) => e?.toLowerCase() === "entregado"
                                    )
                                  )
                                    return "Entregado";
                                  return estados[0] || null;
                                };
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedEvent(event)}
                                    className={`
                              flex-1 min-w-0
                              text-left text-[8px] 2xl:px-2 px-1 py-0.2 rounded-lg flex justify-between items-center gap-1
                              ${getCampaignColor(event.campana)} text-white
                              hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:scale-105 
                              truncate
                              ${isFiltered
                                        ? "opacity-30 grayscale saturate-0"
                                        : ""
                                      }
                            `}
                                    title={`${event.campana || "Sin campaña"
                                      } (${event.desarrollos.length} desarrollo${event.desarrollos.length > 1 ? "s" : ""
                                      })`}
                                  >
                                    <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold hidden 2xl:block">
                                      {event.desarrollador
                                        ?.split(" ")[0]
                                        .slice(0, 1)
                                        .toUpperCase()}
                                      {event.desarrollador
                                        ?.split(" ")[1]
                                        .slice(0, 1)
                                        .toUpperCase()}
                                    </p>
                                    <div className="flex items-center gap-1">
                                      {dateStatus.isStart && (
                                        <Play className="2xl:w-3 2xl:h-3 w-2 h-2 text-white" />
                                      )}
                                      {dateStatus.isEnd && (
                                        <Flag className="2xl:w-3 2xl:h-3 w-2 h-2 text-white" />
                                      )}
                                      <div
                                        className={`rounded-full 2xl:ring-2 ring-1 ring-white ${getStatusColor(
                                          getGroupStatus()
                                        )} 2xl:w-2 2xl:h-2 w-1.5 h-1.5 shadow-sm`}
                                      ></div>
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        )}
                        {showIncumplimientos && (
                          <div className="flex gap-2 px-2 mt-2">
                            <ShieldX className="2xl:w-3 2xl:h-3 w-2 h-2 text-red-500 relative -left-2" />
                            {groupedEvents
                              .filter((event) =>
                                event.desarrollos.some(
                                  (d) =>
                                    d.estado?.toLowerCase() === "incumplimiento"
                                )
                              )
                              .slice(0, 6)
                              .map((event, idx) => {
                                const isFiltered =
                                  selectedCampaign &&
                                  event.campana !== selectedCampaign;
                                // Obtener el estado más relevante (priorizar en proceso y finalizado)

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedEvent(event)}
                                    className={`
                              flex-1 min-w-0
                              text-left text-[8px] 2xl:px-2 px-1 py-1 rounded-lg flex justify-between items-center gap-1
                              ${getCampaignColor(
                                      event.campana
                                    )} text-white 2xl:ring-2 ring-1 ring-red-500
                              hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:scale-105 
                              truncate
                              ${isFiltered
                                        ? "opacity-30 grayscale saturate-0"
                                        : ""
                                      }
                            `}
                                    title={`${event.campana || "Sin campaña"
                                      } (${event.desarrollos.length} desarrollo${event.desarrollos.length > 1 ? "s" : ""
                                      })`}
                                  ></button>
                                );
                              })}
                          </div>
                        )}
                      </div>
                      {groupedEvents.length > 6 && (
                        <div className="text-xs font-bold text-gray-700 text-center mt-2 bg-gray-100 rounded py-1">
                          +{groupedEvents.length - 6} más
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de detalle del evento */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-6xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border-2 border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {selectedEvent.campana || "Sin campaña"}
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center transition-all text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Información común de la campaña */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedEvent.coordinador && (
                  <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <span className="font-bold text-purple-900 text-sm uppercase tracking-wide">
                      Coordinador
                    </span>
                    <p className="text-gray-800 font-semibold text-lg mt-1">
                      {selectedEvent.coordinador}
                    </p>
                  </div>
                )}
                {selectedEvent.desarrollador && (
                  <div className="bg-linear-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-200">
                    <span className="font-bold text-green-900 text-sm uppercase tracking-wide mb-2 block">
                      Desarrollador
                    </span>
                    <span
                      className={`inline-block px-4 py-2 rounded-lg text-white font-bold text-base shadow-md ${getDeveloperColor(
                        selectedEvent.desarrollador
                      )}`}
                    >
                      {selectedEvent.desarrollador}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedEvent.fechaMaterial && (
                  <div className="bg-white rounded-xl p-4 border-2 border-green-300 shadow-md">
                    <span className="font-bold text-green-900 text-xs uppercase tracking-wide block mb-2">
                      📅 Fecha Material
                    </span>
                    <p className="text-gray-800 font-semibold">
                      {formatDateString(selectedEvent.fechaMaterial)}
                    </p>
                  </div>
                )}
                {selectedEvent.fechaInicio && (
                  <div className="bg-white rounded-xl p-4 border-2 border-blue-300 shadow-md">
                    <span className="font-bold text-blue-900 text-xs uppercase tracking-wide block mb-2">
                      📅 Fecha Inicio
                    </span>
                    <p className="text-gray-800 font-semibold">
                      {formatDateString(selectedEvent.fechaInicio)}
                    </p>
                  </div>
                )}
                {selectedEvent.fechaFin && (
                  <div className="bg-white rounded-xl p-4 border-2 border-red-300 shadow-md">
                    <span className="font-bold text-red-900 text-xs uppercase tracking-wide block mb-2">
                      📅 Fecha Fin
                    </span>
                    <p className="text-gray-800 font-semibold">
                      {formatDateString(selectedEvent.fechaFin)}
                    </p>
                  </div>
                )}
              </div>

              {/* Tabla de desarrollos */}
              <div className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
                <h4 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <span>📋</span>
                  Desarrollos de la Campaña
                  <span className="text-sm font-normal text-gray-600">
                    ({selectedEvent.desarrollos.length} total
                    {selectedEvent.desarrollos.length > 1 ? "es" : ""})
                  </span>
                </h4>

                {/* Formulario de Agregar Nuevo Desarrollo */}
                {onAddRecord && (
                  <div className="mb-4">
                    {!isAdding ? (
                      <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-4 py-2 rounded-lg transition-colors font-semibold text-sm w-full justification-center"
                      >
                        <span className="text-lg">+</span> Agregar Desarrollo a esta Campaña
                      </button>
                    ) : (
                      <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <h5 className="font-bold text-gray-700 mb-3 text-sm">Nuevo Desarrollo</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo Desarrollo</label>
                            <select
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={newDevelopment.desarrollo || ""}
                              onChange={e => setNewDevelopment({ ...newDevelopment, desarrollo: e.target.value })}
                            >
                              <option value="">Seleccionar...</option>
                              {tiposDesarrollo?.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre Tema</label>
                            <input
                              type="text"
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={newDevelopment.nombre || ""}
                              onChange={e => setNewDevelopment({ ...newDevelopment, nombre: e.target.value })}
                              placeholder="Nombre del tema..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Cantidad</label>
                            <input
                              type="text"
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={newDevelopment.cantidad || ""}
                              onChange={e => setNewDevelopment({ ...newDevelopment, cantidad: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Material</label>
                            <input
                              type="date"
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={newDevelopment.fechaMaterial || ""}
                              onChange={e => setNewDevelopment({ ...newDevelopment, fechaMaterial: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Inicio</label>
                            <input
                              type="date"
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={newDevelopment.fechaInicio || ""}
                              onChange={e => setNewDevelopment({ ...newDevelopment, fechaInicio: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Fin</label>
                            <input
                              type="date"
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={newDevelopment.fechaFin || ""}
                              onChange={e => setNewDevelopment({ ...newDevelopment, fechaFin: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
                            <select
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={newDevelopment.estado || "Pendiente"}
                              onChange={e => setNewDevelopment({ ...newDevelopment, estado: e.target.value })}
                            >
                              {estados?.map(e => <option key={e} value={e}>{e}</option>) || <option>Pendiente</option>}
                            </select>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Observaciones</label>
                            <input
                              type="text"
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={newDevelopment.observaciones || ""}
                              onChange={e => setNewDevelopment({ ...newDevelopment, observaciones: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setIsAdding(false)}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleSaveNewDevelopment}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
                          >
                            Guardar Nuevo Desarrollo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {selectedEvent.desarrollos.map((desarrollo, idx) => (
                    <div
                      key={idx}
                      className={`bg-white rounded-lg p-5 shadow-md border-2 border-gray-200 transition-all 
                        ${desarrollo.originalRecord?.rowIndex && deletedRecordIndices.has(desarrollo.originalRecord.rowIndex)
                          ? "opacity-50 border-red-200 bg-red-50 grayscale"
                          : "hover:border-indigo-300"}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                            <EditableField
                              value={desarrollo.nombre}
                              onSave={(val) => desarrollo.originalRecord && handleSaveField(desarrollo.originalRecord, 'nombre', val)}
                              isEditingEnabled={!!onUpdateRecord}
                              className="hover:bg-gray-100 px-1 rounded"
                            />
                          </h5>
                          {desarrollo.desarrollo && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <span className="font-semibold">Tipo:</span>
                              <EditableField
                                value={desarrollo.desarrollo}
                                onSave={(val) => desarrollo.originalRecord && handleSaveField(desarrollo.originalRecord, 'desarrollo', val)}
                                isEditingEnabled={!!onUpdateRecord}
                                type="select"
                                options={["Evolutivo", "Garantía", "Incidencia", "Proyecto", "Soporte", "Actualizacion"]} // TODO: Usar lista maestra si es posible pasarla
                                className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md font-medium"
                              />
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <EditableField
                            value={desarrollo.estado}
                            onSave={(val) => desarrollo.originalRecord && handleSaveField(desarrollo.originalRecord, 'estado', val)}
                            isEditingEnabled={!!onUpdateRecord}
                            type="select"
                            options={estados && estados.length > 0 ? estados : ["Entregado", "Finalizado", "Cancelado", "En Proceso", "Proyectado", "Sin Material", "Incumplimiento"]}
                            className={`px-3 py-1.5 rounded-lg text-white font-bold text-sm shadow-md ${getStatusColor(desarrollo.estado)}`}
                          />
                        </div>
                        {onBatchUpdate && desarrollo.originalRecord?.rowIndex && (
                          <button
                            onClick={() => handleDeleteRecord(desarrollo.originalRecord!)}
                            className={`p-1.5 rounded-full transition-colors ${deletedRecordIndices.has(desarrollo.originalRecord.rowIndex)
                              ? "bg-red-200 text-red-700 hover:bg-red-300"
                              : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                              }`}
                            title={deletedRecordIndices.has(desarrollo.originalRecord.rowIndex) ? "Restaurar" : "Eliminar"}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        {desarrollo.segmento && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700 text-sm">
                              Segmento:
                            </span>
                            <EditableField
                              value={desarrollo.segmento}
                              onSave={(val) => desarrollo.originalRecord && handleSaveField(desarrollo.originalRecord, 'segmento', val)}
                              isEditingEnabled={!!onUpdateRecord}
                              className="text-gray-900 bg-blue-50 px-2 py-1 rounded"
                            />
                          </div>
                        )}
                        {desarrollo.cantidad && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700 text-sm">
                              Cantidad:
                            </span>
                            <EditableField
                              value={desarrollo.cantidad}
                              onSave={(val) => desarrollo.originalRecord && handleSaveField(desarrollo.originalRecord, 'cantidad', val)}
                              isEditingEnabled={!!onUpdateRecord}
                              type="number"
                              className="text-gray-900 bg-green-50 px-2 py-1 rounded font-medium"
                            />
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="font-semibold text-gray-700 text-sm block mb-1">
                          Observaciones:
                        </span>
                        <EditableField
                          value={desarrollo.observaciones}
                          onSave={(val) => desarrollo.originalRecord && handleSaveField(desarrollo.originalRecord, 'observaciones', val)}
                          isEditingEnabled={!!onUpdateRecord}
                          type="textarea"
                          className="text-gray-800 text-sm bg-gray-50 p-2 rounded w-full block"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer con acciones */}
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                {onBatchUpdate && (
                  <button
                    onClick={handleSaveChanges}
                    disabled={modifiedRecords.size === 0 && deletedRecordIndices.size === 0}
                    className={`px-6 py-2 rounded-lg text-white font-bold transition-all transform hover:scale-105 shadow-md flex items-center gap-2
                      ${(modifiedRecords.size > 0 || deletedRecordIndices.size > 0)
                        ? "bg-linear-to-r from-blue-600 to-indigo-600 hover:shadow-lg"
                        : "bg-gray-300 cursor-not-allowed text-gray-500"
                      }`}
                  >
                    <BookCheck className="w-5 h-5" />
                    Guardar Cambios ({modifiedRecords.size + deletedRecordIndices.size})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
