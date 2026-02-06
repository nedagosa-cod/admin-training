import { useState, useEffect } from "react";
import { submitTrainingData } from "../utils/utils";
import type { TrainingRecord } from "../utils/utils";

interface AddTrainingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    desarrolladores: string[];
    coordinadores: string[];
    clientes: string[];
    tiposDesarrollo: string[];
    isMinimized?: boolean;
    onToggleMinimize?: () => void;
    initialData?: TrainingRecord | null;
}

// Campos comunes para la cabecera
interface HeaderData {
    coordinador: string;
    cliente: string;
    segmento: string;
    desarrollador: string;
    segmentoMenu: string;
    campana: string;
    formador: string;
    fechaSolicitud: string;
}

// Campos para cada desarrollo (fila dinámica)
interface RowData {
    id: string; // Para key de React
    desarrollo: string;
    nombre: string;
    cantidad: string;
    fechaMaterial: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
    observaciones: string;
}

const INITIAL_HEADER: HeaderData = {
    coordinador: "",
    cliente: "",
    segmento: "",
    desarrollador: "",
    segmentoMenu: "",
    campana: "",
    formador: "",
    fechaSolicitud: new Date().toISOString().split("T")[0], // Hoy por defecto
};

const INITIAL_ROW: RowData = {
    id: crypto.randomUUID(),
    desarrollo: "",
    nombre: "",
    cantidad: "",
    fechaMaterial: "",
    fechaInicio: "",
    fechaFin: "",
    estado: "Pendiente",
    observaciones: "",
};

const mapRecordToHeader = (record: TrainingRecord): HeaderData => ({
    coordinador: record.coordinador || "",
    cliente: record.cliente || "",
    segmento: record.segmento || "",
    desarrollador: record.desarrollador || "",
    segmentoMenu: record.segmentoMenu || "",
    campana: record.campana || "",
    formador: record.formador || "",
    fechaSolicitud: record.fechaSolicitud || new Date().toISOString().split("T")[0],
});

const mapRecordToRow = (record: TrainingRecord): RowData => ({
    id: crypto.randomUUID(),
    desarrollo: record.desarrollo || "",
    nombre: record.nombre || "",
    cantidad: record.cantidad || "",
    fechaMaterial: record.fechaMaterial || "",
    fechaInicio: record.fechaInicio || "",
    fechaFin: record.fechaFin || "",
    estado: record.estado || "Pendiente",
    observaciones: record.observaciones || "",
});

// Helper para convertir DD/MM/YYYY -> YYYY-MM-DD (para input date)
const toInputDate = (dateStr: string | null): string => {
    if (!dateStr) return "";
    // Si ya es YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // Si es DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    }
    return "";
};

// Helper para convertir YYYY-MM-DD -> DD/MM/YYYY (para guardar/state)
const fromInputDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

export default function AddTrainingModal({
    isOpen,
    onClose,
    onSuccess,
    desarrolladores,
    coordinadores,
    clientes,
    tiposDesarrollo,
    isMinimized = false,
    onToggleMinimize,
    initialData
}: AddTrainingModalProps) {
    const [headerData, setHeaderData] = useState<HeaderData>(INITIAL_HEADER);
    const [rows, setRows] = useState<RowData[]>([{ ...INITIAL_ROW }]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setHeaderData(mapRecordToHeader(initialData));
            setRows([mapRecordToRow(initialData)]);
        } else {
            setHeaderData(INITIAL_HEADER);
            setRows([{ ...INITIAL_ROW, id: crypto.randomUUID() }]);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    if (isMinimized) {
        return (
            <div className="fixed bottom-28 left-8 z-50 bg-white border border-gray-200 shadow-2xl rounded-lg p-4 flex items-center gap-4 animate-in slide-in-from-bottom-5 w-auto max-w-sm border-l-4 border-l-blue-600">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <span>📝</span>
                    </div>
                    <div>
                        <p className="font-bold text-sm text-gray-800">Registro en curso</p>
                        <p className="text-xs text-gray-500 font-medium">{rows.length} desarrollo(s) agregado(s)</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 pl-4 border-l border-gray-200 ml-2">
                    {onToggleMinimize && (
                        <button
                            onClick={onToggleMinimize}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-md transition-colors"
                            title="Restaurar"
                        >
                            <span className="text-lg">↗️</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                        title="Cerrar"
                    >
                        <span className="text-lg">✕</span>
                    </button>
                </div>
            </div>
        );
    }

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setHeaderData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRowChange = (id: string, field: keyof RowData, value: string) => {
        setRows((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    const addRow = () => {
        if (isMinimized) return; // Prevent resizing in minimized mode
        setRows((prev) => [...prev, { ...INITIAL_ROW, id: crypto.randomUUID() }]);
    };

    const removeRow = (id: string) => {
        if (rows.length === 1) return; // Mantener al menos una fila
        setRows((prev) => prev.filter((row) => row.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Validaciones básicas
            if (!headerData.cliente) {
                setError("Por favor complete los campos obligatorios (Cliente)");
                setSubmitting(false);
                return;
            }

            if (initialData && initialData.rowIndex) {
                // MODO EDICIÓN: Actualizar una sola fila
                const row = rows[0];
                const cleanRecord: TrainingRecord = {
                    ...headerData,
                    desarrollo: row.desarrollo,
                    nombre: row.nombre,
                    cantidad: row.cantidad,
                    fechaMaterial: row.fechaMaterial,
                    fechaInicio: row.fechaInicio,
                    fechaFin: row.fechaFin,
                    estado: row.estado,
                    observaciones: row.observaciones,
                    rowIndex: initialData.rowIndex, // Importante para identificar la fila
                    // Asegurar campos nulos si están vacíos
                    campana: headerData.campana || null,
                    coordinador: headerData.coordinador || null,
                    // ... mapear resto si es necesario, pero spread ...headerData y row fields cubren la mayoría
                };

                await submitTrainingData({
                    action: 'update',
                    data: cleanRecord,
                    rowIndex: initialData.rowIndex
                });
            } else {
                // MODO CREACIÓN: Append normal
                const payload: TrainingRecord[] = rows.map((row) => ({
                    ...headerData,
                    desarrollo: row.desarrollo,
                    nombre: row.nombre,
                    cantidad: row.cantidad,
                    fechaMaterial: row.fechaMaterial,
                    fechaInicio: row.fechaInicio,
                    fechaFin: row.fechaFin,
                    estado: row.estado,
                    observaciones: row.observaciones,
                }));
                await submitTrainingData(payload);
            }

            // Limpiar y cerrar
            if (!initialData) {
                setHeaderData(INITIAL_HEADER);
                setRows([{ ...INITIAL_ROW, id: crypto.randomUUID() }]);
            }
            onSuccess();
            onClose();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al enviar los datos");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl my-8">
                <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                    {/* Header del Modal */}
                    <div className={`p-6 border-b border-gray-200 flex justify-between items-center text-white rounded-t-xl ${initialData ? "bg-linear-to-r from-orange-500 to-red-600" : "bg-linear-to-r from-blue-600 to-indigo-700"}`}>
                        <h2 className="text-xl font-bold">
                            {initialData ? "✏️ Editar Registro" : "📝 Nuevo Registro de Entrenamiento"}
                        </h2>
                        <div className="flex items-center gap-2">
                            {onToggleMinimize && (
                                <button
                                    type="button"
                                    onClick={onToggleMinimize}
                                    className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors font-bold text-xl mb-2"
                                    title="Minimizar"
                                >
                                    _
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                                {error}
                            </div>
                        )}

                        {/* SECCIÓN 1: Datos Generales (Header) */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                1. Datos Generales <span className="text-xs font-normal text-gray-500">(Se aplican a todos los desarrollos)</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Solicitud</label>
                                    <input
                                        type="date"
                                        name="fechaSolicitud"
                                        value={headerData.fechaSolicitud}
                                        onChange={handleHeaderChange}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Coordinador</label>
                                    <select
                                        name="coordinador"
                                        value={headerData.coordinador}
                                        onChange={handleHeaderChange}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {coordinadores.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Cliente *</label>
                                    <select
                                        name="cliente"
                                        required
                                        value={headerData.cliente}
                                        onChange={handleHeaderChange}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {clientes.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Segmento</label>
                                    <input
                                        type="text"
                                        name="segmento"
                                        value={headerData.segmento}
                                        onChange={handleHeaderChange}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Segmento Menú</label>
                                    <input
                                        type="text"
                                        name="segmentoMenu"
                                        value={headerData.segmentoMenu}
                                        onChange={handleHeaderChange}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Desarrollador</label>
                                    <select
                                        name="desarrollador"
                                        value={headerData.desarrollador}
                                        onChange={handleHeaderChange}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {desarrolladores.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Formador</label>
                                    <input
                                        type="text"
                                        name="formador"
                                        value={headerData.formador}
                                        onChange={handleHeaderChange}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: Desarrollos (Rows) */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    2. Detalles de Desarrollos
                                </h3>
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-green-200 transition-colors flex items-center gap-1"
                                >
                                    <span className="text-lg">+</span> Agregar Fila
                                </button>
                            </div>

                            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-xs">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desarrollo</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Cant.</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F. Material</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F. Inicio</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F. Fin</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Observaciones</th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {rows.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50">
                                                <td className="px-2 py-2">
                                                    <select
                                                        value={row.desarrollo}
                                                        onChange={(e) => handleRowChange(row.id, "desarrollo", e.target.value)}
                                                        className="w-full border-gray-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {tiposDesarrollo.map((opt) => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.nombre}
                                                        onChange={(e) => handleRowChange(row.id, "nombre", e.target.value)}
                                                        className="w-full border-gray-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Nombre del tema..."
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.cantidad}
                                                        onChange={(e) => handleRowChange(row.id, "cantidad", e.target.value)}
                                                        className="w-full border-gray-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="date"
                                                        value={toInputDate(row.fechaMaterial)}
                                                        onChange={(e) => handleRowChange(row.id, "fechaMaterial", fromInputDate(e.target.value))}
                                                        className="w-full border-gray-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="date"
                                                        value={toInputDate(row.fechaInicio)}
                                                        onChange={(e) => handleRowChange(row.id, "fechaInicio", fromInputDate(e.target.value))}
                                                        className="w-full border-gray-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="date"
                                                        value={toInputDate(row.fechaFin)}
                                                        onChange={(e) => handleRowChange(row.id, "fechaFin", fromInputDate(e.target.value))}
                                                        className="w-full border-gray-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <select
                                                        value={row.estado}
                                                        onChange={(e) => handleRowChange(row.id, "estado", e.target.value)}
                                                        className="w-full border-gray-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="Pendiente">Pendiente</option>
                                                        <option value="En Curso">En Curso</option>
                                                        <option value="Finalizada">Finalizada</option>
                                                        <option value="Suspendida">Suspendida</option>
                                                    </select>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.observaciones}
                                                        onChange={(e) => handleRowChange(row.id, "observaciones", e.target.value)}
                                                        className="w-full border-gray-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Obs..."
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-center">
                                                    {rows.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRow(row.id)}
                                                            className="text-red-400 hover:text-red-600 transition-colors"
                                                            title="Eliminar fila"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer Clásico */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-6 py-2 text-white font-medium rounded-lg shadow-sm transition-all flex items-center gap-2 ${submitting
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"
                                }`}
                        >
                            {submitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <span>{initialData ? "💾 Actualizar" : "💾 Guardar Registros"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
