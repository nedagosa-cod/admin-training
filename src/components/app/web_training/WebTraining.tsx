import { useEffect, useState } from "react";
import {
  fetchGoogleSheetData,
  fetchMasterData,
  fetchSheetNovedades,
} from "./utils/utils";
import type {
  TrainingRecord,
  FestivoRecord,
  NovedadesRecord,
} from "./utils/utils";
import { useAuth } from "@/context/AuthContext";
import CalendarTab from "./components/CalendarTab";
import CampaignsTab from "./components/CampaignsTab";
import ReportsTab from "./components/ReportsTab";
import AddTrainingModal from "./components/AddTrainingModal";

type Tab = "calendar" | "campaigns" | "reports";

export default function WebTraining() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<TrainingRecord[]>([]);
  const [festivos, setFestivos] = useState<FestivoRecord[]>([]);
  const [novedades, setNovedades] = useState<NovedadesRecord[]>([]);
  // Listas Maestras
  const [desarrolladores, setDesarrolladores] = useState<string[]>([]);
  const [coordinadores, setCoordinadores] = useState<string[]>([]);
  const [clientes, setClientes] = useState<string[]>([]);
  const [tiposDesarrollo, setTiposDesarrollo] = useState<string[]>([]);

  const [isModalMinimized, setIsModalMinimized] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("calendar");
  const [showHelp, setShowHelp] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [records, masterData, novedadesData] = await Promise.all([
        fetchGoogleSheetData(),
        fetchMasterData(),
        fetchSheetNovedades(),
      ]);
      setData(records);
      setFestivos(masterData.festivos);
      setDesarrolladores(masterData.desarrolladores);
      setCoordinadores(masterData.coordinadores);
      setClientes(masterData.clientes);
      setTiposDesarrollo(masterData.tiposDesarrollo);

      setNovedades(novedadesData);
      setError(null);
    } catch (err) {
      setError("Error al cargar los datos de Google Sheets");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSuccessAdd = () => {
    // Recargar datos después de agregar
    loadData();
    // Opcional: Mostrar notificación de éxito
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-8 flex flex-col">
      {/* Sistema de pestañas */}
      <div className="mb-6 bg-white rounded-xl shadow-md border border-gray-100">
        <nav className="flex space-x-1 p-2">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`${activeTab === "calendar"
              ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-100"
              } flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105`}
          >
            📅 Calendario
          </button>
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`${activeTab === "campaigns"
              ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-100"
              } flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105`}
          >
            📊 Consulta de Campañas
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`${activeTab === "reports"
              ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-100"
              } flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105`}
          >
            📈 Reportes
          </button>
        </nav>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Pestaña de Calendario */}
          {activeTab === "calendar" && (
            <CalendarTab
              data={data}
              festivos={festivos}
              novedades={novedades}
            />
          )}

          {/* Pestaña de Consulta de Campañas */}
          {activeTab === "campaigns" && <CampaignsTab data={data} />}

          {/* Pestaña de Reportes */}
          {activeTab === "reports" && <ReportsTab data={data} />}
        </>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      )}

      {/* Botón de Agregar Nuevo (Flotante) - Solo Admin */}
      {isAdmin && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-28 right-8 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center font-bold text-3xl z-40 border-4 border-white"
          title="Agregar Nuevo Registro"
        >
          +
        </button>
      )}

      {/* Botón de ayuda flotante */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-8 right-8 bg-linear-to-r from-blue-500 to-indigo-600 text-white rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center font-bold text-2xl z-50 border-4 border-white"
        title="Ayuda e Instrucciones"
      >
        ?
      </button>

      {/* Modal de Agregar Datos - Solo Admin */}
      {isAdmin && (
        <AddTrainingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSuccessAdd}
          desarrolladores={desarrolladores}
          coordinadores={coordinadores}
          clientes={clientes}
          tiposDesarrollo={tiposDesarrollo}
          isMinimized={isModalMinimized}
          onToggleMinimize={() => setIsModalMinimized(!isModalMinimized)}
        />
      )}

      {/* Modal de ayuda */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Encabezado */}
            <div className="sticky top-0 bg-linear-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-center shadow-lg z-10">
              <div>
                <h2 className="text-3xl font-bold mb-2">📚 Guía de Uso</h2>
                <p className="text-blue-100 text-sm">
                  Aprende a usar todas las funcionalidades del sistema
                </p>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-white hover:bg-white hover:text-blue-600 rounded-full w-10 h-10 flex items-center justify-center transition-all text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div className="p-8 space-y-6">
              {/* Ejemplo visual de un día del calendario */}
              <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-300">
                <h3 className="text-2xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                  📅 Ejemplo: Así se ve un día del Calendario
                </h3>
                <p className="text-gray-700 mb-4">
                  Cada día del calendario puede tener diferentes elementos
                  visuales que te indican información importante:
                </p>

                {/* Ejemplo visual del día - Versión realista */}
                <div className="bg-gray-50 rounded-lg p-6 shadow-lg border-2 border-purple-200 mb-4">
                  <div className="flex flex-col items-center gap-4">
                    {/* Ejemplo de día normal con procesos */}
                    <div className="w-full max-w-md">
                      <p className="text-center text-sm font-bold text-gray-600 mb-2">
                        Ejemplo: Día con múltiples procesos
                      </p>
                      <div className="border-2 rounded-xl p-3 min-h-[140px] flex flex-col bg-white border-gray-200 shadow-md hover:shadow-xl transition-all">
                        <div className="flex-1 flex mb-2">
                          <div className="text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 text-white">
                            15
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {/* Diamantes de novedades */}
                            <div
                              className="w-2 h-2 transform rotate-45 shadow-sm ring-2 ring-red-800 bg-yellow-500"
                              title="Novedad"
                            ></div>
                            <div
                              className="w-2 h-2 transform rotate-45 shadow-sm ring-2 ring-red-800 bg-green-500"
                              title="Novedad"
                            ></div>
                          </div>
                        </div>

                        {/* Eventos del día */}
                        <div className="flex-1">
                          <div className="grid grid-cols-4 gap-1 px-2">
                            {/* Proceso 1 */}
                            <div className="text-left text-[10px] px-2 py-1.5 rounded-lg flex justify-between items-center gap-1 bg-blue-500 text-white shadow-md">
                              <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
                                Campaña A
                              </p>
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                <div className="rounded-full ring-2 ring-white bg-green-500 w-2 h-2 shadow-sm"></div>
                              </div>
                            </div>
                            {/* Proceso 2 */}
                            <div className="text-left text-[10px] px-2 py-1.5 rounded-lg flex justify-between items-center gap-1 bg-purple-500 text-white shadow-md">
                              <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
                                Campaña B
                              </p>
                              <div className="flex items-center gap-1">
                                <div className="rounded-full ring-2 ring-white bg-blue-500 w-2 h-2 shadow-sm"></div>
                              </div>
                            </div>
                            {/* Proceso 3 */}
                            <div className="text-left text-[10px] px-2 py-1.5 rounded-lg flex justify-between items-center gap-1 bg-pink-500 text-white shadow-md">
                              <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
                                Campaña C
                              </p>
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
                                </svg>
                                <div className="rounded-full ring-2 ring-white bg-red-800 w-2 h-2 shadow-sm"></div>
                              </div>
                            </div>
                            {/* Proceso 4 */}
                            <div className="text-left text-[10px] px-2 py-1.5 rounded-lg flex justify-between items-center gap-1 bg-green-600 text-white shadow-md">
                              <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
                                Campaña D
                              </p>
                              <div className="flex items-center gap-1">
                                <div className="rounded-full ring-2 ring-white bg-gray-500 w-2 h-2 shadow-sm"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explicación de cada elemento */}
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border-l-4 border-gray-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🔢</div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">
                          Número del día (círculo superior izquierdo)
                        </h4>
                        <p className="text-sm text-gray-700">
                          Muestra el día del mes dentro de un círculo. Si es el
                          día actual, aparece con fondo azul. Si es festivo,
                          tiene fondo rojo.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💎</div>
                      <div>
                        <h4 className="font-bold text-yellow-900 mb-1">
                          Diamantes de colores (junto al número)
                        </h4>
                        <p className="text-sm text-gray-700">
                          Pequeños rombos con borde rojo que indican novedades o
                          eventos especiales ese día. Cada color representa un
                          desarrollador diferente. Al pasar el mouse, se ve qué
                          novedad es.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📦</div>
                      <div>
                        <h4 className="font-bold text-blue-900 mb-1">
                          Rectángulos de campañas (área principal)
                        </h4>
                        <p className="text-sm text-gray-700">
                          Cada rectángulo de color representa un proceso de
                          entrenamiento activo ese día. El color se asigna
                          automáticamente según la campaña. Muestra el nombre de
                          la campaña y al hacer clic se pueden ver más detalles.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">▶️</div>
                      <div>
                        <h4 className="font-bold text-indigo-900 mb-1">
                          Ícono Play (triángulo)
                        </h4>
                        <p className="text-sm text-gray-700">
                          El ícono de "Play" (▶) aparece en el rectángulo de la
                          campaña es cuando se inicia el desarrollo solicitado
                          para ese cliente.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🚩</div>
                      <div>
                        <h4 className="font-bold text-purple-900 mb-1">
                          Ícono Flag (bandera)
                        </h4>
                        <p className="text-sm text-gray-700">
                          El ícono de "Flag" (🚩) aparece en el rectángulo de la
                          campaña indica que se termina y se entrega el
                          desarrollo solicitado para ese cliente.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">⚫</div>
                      <div>
                        <h4 className="font-bold text-green-900 mb-1">
                          Punto de estado (círculo pequeño)
                        </h4>
                        <p className="text-sm text-gray-700">
                          Cada rectángulo tiene un pequeño círculo de color que
                          indica el estado del proceso:
                          <br />
                          🟢 <strong>Verde</strong> = Finalizada
                          <br />
                          🔵 <strong>Azul</strong> = En Proceso
                          <br />
                          🔴 <strong>Rojo oscuro</strong> = Pendiente
                          <br />⚫ <strong>Gris</strong> = Sin Iniciar
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-l-4 border-red-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🎉</div>
                      <div>
                        <h4 className="font-bold text-red-900 mb-1">
                          Días festivos (fondo rojo)
                        </h4>
                        <p className="text-sm text-gray-700">
                          Los días festivos tienen un fondo rojo claro y
                          muestran "🎉 Festivo" con el nombre de la festividad.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de Estados */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🚦 Estados de los Procesos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-linear-to-br from-green-100 to-green-200 rounded-lg p-4 border-2 border-green-400">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">✅</span>
                      <span className="font-bold text-green-900">
                        Completado
                      </span>
                    </div>
                    <p className="text-sm text-green-800">
                      El proceso ha finalizado exitosamente
                    </p>
                  </div>
                  <div className="bg-linear-to-br from-yellow-100 to-orange-200 rounded-lg p-4 border-2 border-yellow-400">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⏳</span>
                      <span className="font-bold text-orange-900">
                        En Curso
                      </span>
                    </div>
                    <p className="text-sm text-orange-800">
                      El proceso está actualmente en desarrollo
                    </p>
                  </div>
                  <div className="bg-linear-to-br from-gray-100 to-gray-200 rounded-lg p-4 border-2 border-gray-400">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📋</span>
                      <span className="font-bold text-gray-900">Pendiente</span>
                    </div>
                    <p className="text-sm text-gray-800">
                      El proceso aún no ha comenzado
                    </p>
                  </div>
                </div>
              </div>

              {/* Consejos y Tips */}
              <div className="bg-linear-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-300">
                <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                  💡 Consejos Útiles
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🎨</span>
                    <div>
                      <strong>Colores en el calendario:</strong> La intensidad
                      del color indica la cantidad de procesos activos. Más
                      intenso = más procesos.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🔍</span>
                    <div>
                      <strong>Búsqueda rápida:</strong> En la pestaña de
                      campañas, busca por nombre para encontrar rápidamente lo
                      que necesitas.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <strong>Reportes visuales:</strong> Usa la pestaña de
                      reportes para obtener análisis detallados con gráficos.
                    </div>
                  </li>
                </ul>
              </div>

              {/* Atajos y funciones rápidas */}
              <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-sm">
                <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  ⚡ Funciones Rápidas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">👆</div>
                    <div>
                      <p className="font-semibold text-gray-900">Clic en día</p>
                      <p className="text-sm text-gray-600">
                        Ver procesos activos ese día
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📅</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Flechas calendario
                      </p>
                      <p className="text-sm text-gray-600">
                        Navegar entre meses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🔍</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Buscar campaña
                      </p>
                      <p className="text-sm text-gray-600">
                        Filtrar por nombre en tiempo real
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📊</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Clic en campaña
                      </p>
                      <p className="text-sm text-gray-600">
                        Ver estadísticas completas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📈</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Pestaña Reportes
                      </p>
                      <p className="text-sm text-gray-600">
                        Análisis y gráficos detallados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🎯</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Etiquetas visuales
                      </p>
                      <p className="text-sm text-gray-600">
                        Identificación rápida de festivos y novedades
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="sticky bottom-0 bg-linear-to-r from-gray-100 to-gray-200 p-6 rounded-b-2xl flex justify-center border-t-2 border-gray-300">
              <button
                onClick={() => setShowHelp(false)}
                className="bg-linear-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
              >
                ¡Entendido! 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
