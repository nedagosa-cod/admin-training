import { useState } from "react";
import { submitTrainingData } from "../utils/utils";
import type { TrainingRecord } from "../utils/utils";

interface AddTrainingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Campos comunes para la cabecera
interface HeaderData {
    coordinador: string;
    cliente: string;
    segmento: string;
    desarrollador: string;
    segmentoMenu: string;
    observaciones: string;
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
}

const INITIAL_HEADER: HeaderData = {
    coordinador: "",
    cliente: "",
    segmento: "",
    desarrollador: "",
    segmentoMenu: "",
    observaciones: "",
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
};

export default function AddTrainingModal({ isOpen, onClose, onSuccess }: AddTrainingModalProps) {
    const [headerData, setHeaderData] = useState<HeaderData>(INITIAL_HEADER);
    const [rows, setRows] = useState<RowData[]>([{ ...INITIAL_ROW }]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

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
            if (!headerData.cliente || !headerData.campana) {
                throw new Error("Cliente y Campaña son obligatorios");
            }

            // Construir payload
            const payload: TrainingRecord[] = rows.map((row) => ({
                ...headerData,
                // Mapear campos de fila a TrainingRecord
                desarrollo: row.desarrollo,
                nombre: row.nombre,
                cantidad: row.cantidad,
                fechaMaterial: row.fechaMaterial,
                fechaInicio: row.fechaInicio,
                fechaFin: row.fechaFin,
                estado: row.estado,
                // Campos que no usamos en el form pero requiere la interfaz
                // Aseguramos que sean string vacíos o lo que corresponda si son null en la interfaz
                // La interfaz tiene 'string | null', así que null es válido o string vacío.
                // Convertimos undefined s string vacíos para el form

                // La interfaz TrainingRecord espera string | null.
                // Aquí enviamos strings.
            }));

            await submitTrainingData(payload);

            // Limpiar y cerrar
            setHeaderData(INITIAL_HEADER);
            setRows([{ ...INITIAL_ROW, id: crypto.randomUUID() }]);
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
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-t-xl">
                        <h2 className="text-xl font-bold">📝 Nuevo Registro de Entrenamiento</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            ✕
                        </button>
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
                                    <input
                                        type="text"
                                        name="coordinador"
                                        value={headerData.coordinador}
                                        onChange={handleHeaderChange}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Cliente *</label>
                                    <input
                                        type="text"
                                        name="cliente"
                                        required
                                        value={headerData.cliente}
                                        onChange={handleHeaderChange}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Campaña *</label>
                                    <input
                                        type="text"
                                        name="campana"
                                        required
                                        value={headerData.campana}
                                        onChange={handleHeaderChange}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
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
                                    <input
                                        type="text"
                                        name="desarrollador"
                                        value={headerData.desarrollador}
                                        onChange={handleHeaderChange}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
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
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones</label>
                                    <textarea
                                        name="observaciones"
                                        rows={2}
                                        value={headerData.observaciones}
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
                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {rows.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50">
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.desarrollo}
                                                        onChange={(e) => handleRowChange(row.id, "desarrollo", e.target.value)}
                                                        className="w-full border-gray-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Tipo..."
                                                    />
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
                                                        value={row.fechaMaterial}
                                                        onChange={(e) => handleRowChange(row.id, "fechaMaterial", e.target.value)}
                                                        className="w-full border-gray-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="date"
                                                        value={row.fechaInicio}
                                                        onChange={(e) => handleRowChange(row.id, "fechaInicio", e.target.value)}
                                                        className="w-full border-gray-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="date"
                                                        value={row.fechaFin}
                                                        onChange={(e) => handleRowChange(row.id, "fechaFin", e.target.value)}
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
                                    <span>💾</span> Guardar Registros
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
