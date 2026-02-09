import { useState } from "react";
import {
  format,
  parseISO,
  isWithinInterval,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import type {
  TrainingRecord,
  FestivoRecord,
  NovedadesRecord,
} from "../utils/utils";
import Calendar from "./Calendar";

interface CalendarTabProps {
  data: TrainingRecord[];
  festivos: FestivoRecord[];
  novedades: NovedadesRecord[];
  onEdit?: (record: TrainingRecord) => void;
  onUpdateRecord?: (record: TrainingRecord) => Promise<void>;
  onBatchUpdate?: (records: TrainingRecord[], deletedIds?: number[]) => Promise<void>;
  estados?: string[];
}

export default function CalendarTab({
  data,
  festivos,
  novedades,
  onEdit,
  onUpdateRecord,
  onBatchUpdate,
  estados,
}: CalendarTabProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Función para obtener eventos activos en una fecha específica
  const getEventsForDate = (date: Date): TrainingRecord[] => {
    return data.filter((record) => {
      if (!record.fechaInicio || !record.fechaFin) return false;

      try {
        let startDate: Date;
        let endDate: Date;

        if (record.fechaInicio.includes("Date(")) {
          const startMatch = record.fechaInicio.match(
            /Date\((\d+),(\d+),(\d+)\)/
          );
          if (startMatch) {
            startDate = new Date(
              parseInt(startMatch[1]),
              parseInt(startMatch[2]),
              parseInt(startMatch[3])
            );
          } else {
            return false;
          }
        } else {
          startDate = parseISO(record.fechaInicio);
        }

        if (record.fechaFin.includes("Date(")) {
          const endMatch = record.fechaFin.match(/Date\((\d+),(\d+),(\d+)\)/);
          if (endMatch) {
            endDate = new Date(
              parseInt(endMatch[1]),
              parseInt(endMatch[2]),
              parseInt(endMatch[3])
            );
          } else {
            return false;
          }
        } else {
          endDate = parseISO(record.fechaFin);
        }

        return isWithinInterval(date, { start: startDate, end: endDate });
      } catch (error) {
        console.error("Error parseando fecha:", error, record);
        return false;
      }
    });
  };

  // Obtener días del mes actual
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  }).filter((day) => day.getDay() !== 0);

  // Obtener todas las campañas activas en el mes actual
  const getActiveCampaignsInMonth = (): {
    campana: string;
    count: number;
    desarrolladores: Set<string>;
  }[] => {
    const campaignsMap = new Map<
      string,
      { count: number; desarrolladores: Set<string> }
    >();

    days.forEach((day) => {
      if (isSameMonth(day, currentMonth)) {
        const events = getEventsForDate(day);
        events.forEach((event) => {
          if (event.campana) {
            if (!campaignsMap.has(event.campana)) {
              campaignsMap.set(event.campana, {
                count: 0,
                desarrolladores: new Set(),
              });
            }
            const campaignData = campaignsMap.get(event.campana)!;
            campaignData.count++;
            if (event.desarrollador) {
              campaignData.desarrolladores.add(event.desarrollador);
            }
          }
        });
      }
    });

    return Array.from(campaignsMap.entries()).map(
      ([campana, { count, desarrolladores }]) => ({
        campana,
        count,
        desarrolladores,
      })
    );
  };

  const activeCampaigns = getActiveCampaignsInMonth();

  return (
    <>
      <div className="flex-1 bg-white rounded-xl shadow-xl p-8 overflow-hidden h-dvh border border-gray-100">
        <Calendar
          data={data}
          festivos={festivos}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          novedades={novedades}
          onEdit={onEdit}
          onUpdateRecord={onUpdateRecord}
          onBatchUpdate={onBatchUpdate}
          estados={estados}
        />
      </div>

      {/* Panel de información */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campañas activas en el mes */}
        <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-xl transform hover:scale-105 transition-all duration-200">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Campañas Activas en {format(currentMonth, "MMMM", { locale: es })}
          </h3>
          {activeCampaigns.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {activeCampaigns.map(({ campana, count, desarrolladores }) => (
                <div
                  key={campana}
                  className="bg-white/95 backdrop-blur rounded-lg p-4 shadow-md border border-blue-100 hover:bg-white transition-all hover:shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-blue-900 text-sm mb-1">
                        {campana}
                      </p>
                      <div className="flex gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          📁 {count} proceso{count !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          👥 {desarrolladores.size} dev
                          {desarrolladores.size !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/90 rounded-lg p-4 text-center">
              <p className="text-gray-600 text-sm">
                No hay campañas activas este mes
              </p>
            </div>
          )}
        </div>

        {/* Información del día seleccionado */}
        <div className="bg-linear-to-br from-purple-500 to-pink-600 rounded-xl p-6 shadow-xl transform hover:scale-105 transition-all duration-200">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Día Seleccionado
          </h3>
          {selectedDay ? (
            <div className="space-y-3">
              <div className="bg-white/95 backdrop-blur rounded-lg p-4 shadow-md">
                <p className="font-bold text-purple-900 mb-3 text-lg">
                  {format(selectedDay, "EEEE, d 'de' MMMM", {
                    locale: es,
                  })}
                </p>
                {getEventsForDate(selectedDay).length > 0 ? (
                  <>
                    <div className="mb-3 px-3 py-2 bg-purple-100 rounded-lg">
                      <p className="text-sm font-semibold text-purple-900">
                        {getEventsForDate(selectedDay).length} proceso
                        {getEventsForDate(selectedDay).length !== 1
                          ? "s"
                          : ""}{" "}
                        activo
                        {getEventsForDate(selectedDay).length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {getEventsForDate(selectedDay)
                        .slice(0, 5)
                        .map((event, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-linear-to-r from-purple-50 to-pink-50 rounded-lg px-3 py-2 border border-purple-100"
                          >
                            <div className="text-xs">
                              <span className="font-bold text-purple-900">
                                {event.campana}
                              </span>
                              <span className="text-gray-600">
                                {" "}
                                - {event.nombre}
                              </span>
                            </div>
                            {onEdit && (
                              <button
                                onClick={() => onEdit(event)}
                                className="text-purple-400 hover:text-purple-700 p-1 hover:bg-purple-100 rounded transition-colors"
                                title="Editar Registro"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        ))}
                      {getEventsForDate(selectedDay).length > 5 && (
                        <p className="text-xs text-purple-700 text-center font-semibold bg-purple-100 rounded py-1">
                          +{getEventsForDate(selectedDay).length - 5} más...
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-2">
                    Sin procesos activos este día
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/90 rounded-lg p-4 text-center">
              <p className="text-gray-600 text-sm">
                Haz clic en un día del calendario para ver su información
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
