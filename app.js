// =================================================================
// 1. IMPORTACIONES DE FIREBASE
// =================================================================

// 1A. Importación de las funciones BASE de la APP (initialize)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// 1B. Importación de las funciones de Firestore (BD)
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    where,
    doc,
    setDoc,
    getDoc,
    deleteDoc, 
    updateDoc,
    deleteField,
    limit, // <--- Probablemente la necesitas para la consulta de vigencia
    documentId // <--- ¡Importación corregida!
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- TUS CREDENCIALES ---
const firebaseConfig = {
    apiKey: "AIzaSyC2AAOpd6ksLONTnIlTtUurwcxuX2qWAkQ", // !!! PEGA AQUÍ TUS DATOS REALES !!!
    authDomain: "inversionesdiarias-883da.firebaseapp.com",
    projectId: "inversionesdiarias-883da",
    storageBucket: "inversionesdiarias-883da.firebasestorage.app",
    messagingSenderId: "1008506850156",
    appId: "1:1008506850156:web:10b1f3db91cd8d8bd9c149"
};
// -------------------------

// Inicializar Firebase y la DB (AHORA initializeApp está definida)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =================================================================
// 2. CONSTANTES GLOBALES (Revisión de Fijos)
// =================================================================
const MOVIMIENTOS_COLLECTION = "movimientos";
const FIJOS_CONFIG_COLLECTION = "fijos_config";
// 🚨 ¡CUIDADO! Esta constante ya NO debe usarse en las funciones de guardado o carga
// porque ahora usamos el mes ('2025-12') como ID del documento.
// Te sugiero eliminarla si ya no la usas, o dejarla como recordatorio.
// const FIJOS_CONFIG_DOC_ID = "maestro"; 
const CATEGORIAS_PERSONALIZADAS_COLLECTION = "categorias_fijas_personalizadas";
// ... (Continúa con el resto de tu código)

// --- DEFINICIÓN DE CATEGORÍAS (Base Estática) ---

// 1. CATEGORÍAS VARIABLES (18 ITEMS)
const CATEGORIAS_VARIABLES = [
    { value: 'SUPERMERCADO', label: 'Supermercado' }, 
    { value: 'KIOSCO', label: 'Kiosco' },
    { value: 'CARNICERIA', label: 'Carnicería' },
    { value: 'GRANJA', label: 'Granja' },
    { value: 'PANADERIA', label: 'Panadería' },
    { value: 'VERDULERIA', label: 'Verdulería' },
    { value: 'ALMACEN', label: 'Almacén' },
    { value: 'DELIVERY', label: 'Delivery' },
    { value: 'OCIO', label: 'Ocio' },
    { value: 'SALIDAS', label: 'Salidas' },
    { value: 'ELECTRO', label: 'Electro' },
    { value: 'GOMERIA', label: 'Gomería' },
    { value: 'MECANICO', label: 'Mecánico' },
    { value: 'PEAJE', label: 'Peaje' },
    { value: 'VARIOS', label: 'Varios' },
    { value: 'FARMACIA', label: 'Farmacia' },
    { value: 'LIBRERIA', label: 'Librería' },
    { value: 'ROPA', label: 'Ropa' }
];

// 2. CATEGORÍAS FIJAS RECURRENTES (Base - NO borrables)
const CATEGORIAS_FIJAS_BASE = [ 
    { value: 'ALQUILER', label: 'Alquiler' }, 
    { value: 'LUZ', label: 'Luz' },
    { value: 'GAS', label: 'Gas' }, 
    { value: 'AGUA', label: 'Agua' },
    { value: 'INTERNET', label: 'Internet' },
    { value: 'ESCUELA', label: 'Escuela' }, 
    { value: 'CREDITO_AILEN', label: 'Crédito Ailen' },
    { value: 'CREDITO_JUAN', label: 'Crédito Juan' },
    { value: 'CREDITO_FELI', label: 'Crédito Feli' },
    { value: 'MP_AILEN', label: 'MercadoPago Ailen' },
    { value: 'MP_JUAN', label: 'MercadoPago Juan' },
    { value: 'VISA_BCO_PCIA', label: 'Visa Bco Pcia' }, 
    { value: 'VISA_BCO_SANTANDER', label: 'Visa Bco Santander' },
    { value: 'AMEX_BCO_SANTANDER', label: 'American Bco Santander' },
];

const DEVIATION_THRESHOLD = 0.10; 
// ----------------------------------------------------

let myChartEgresos; 
let myChartIngresos; 
const formatoMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

// Variables Globales Dinámicas
let CATEGORIAS_FIJAS_VALUES = []; 
let categoriasFijasActuales = []; 
let configFijosMaestro = {};
let CATEGORIA_LABEL_MAP = {}; 


// Referencias a elementos del DOM
const formulario = document.getElementById('form-movimiento');
const selectMesFiltro = document.getElementById('mes-filtro');
const selectCategoria = document.getElementById('categoria');
const btnAplicarFiltro = document.getElementById('aplicar-filtro');

// Botones de Fecha Rápida
const btnHoy = document.getElementById('btn-hoy');
const btnAyer = document.getElementById('btn-ayer');
const fechaInput = document.getElementById('fecha');

// Modal Configuración de Montos Fijos
const modalFijos = document.getElementById('modal-fijos');
const btnConfigFijos = document.getElementById('btn-config-fijos');
const btnCerrarModalFijos = document.getElementById('cerrar-modal-fijos');
const btnGuardarConfigFijos = document.getElementById('guardar-config-fijos');
const fijosMaestrosContainer = document.getElementById('fijos-maestros-container');

// Modal Admin Categorías 
const btnAdministrarFijos = document.getElementById('btn-administrar-fijos'); 
const modalAdminCategorias = document.getElementById('modal-admin-categorias');
const btnCerrarAdminCategorias = document.getElementById('cerrar-modal-admin-categorias');
const formNuevaCategoria = document.getElementById('form-nueva-categoria');
const listaCategoriasAdmin = document.getElementById('lista-categorias-admin');

// Búsqueda en Tabla
const busquedaInput = document.getElementById('busqueda-movimientos'); 

// Define cuántos meses futuros y pasados debe mostrar el selector de período
const MESES_FUTUROS_PLANIFICACION = 18; 
const MESES_PASADOS_HISTORICO = 12;

// OCULTAR SPLASH SCREEN ESTILO DISNEY
setTimeout(() => {
    const splash = document.getElementById('splash');
    if(splash) {
        splash.style.opacity = '0';
        splash.style.transform = 'scale(1.1)';
        // Elimina el elemento después de la transición de 1 segundo
        setTimeout(() => splash.remove(), 1000); 
    }
}, 3000); // 2500ms o el tiempo que quieras que se muestre como mínimo

// Hacemos la función global para que el HTML pueda acceder a ella (onclick)
window.toggleSensitiveData = toggleSensitiveData;

// Hacemos la función global para que el HTML pueda acceder a ella (onclick)
window.toggleSensitiveData = toggleSensitiveData; 

/**
 * Alterna el estado de visibilidad (blur) de los datos sensibles
 * en un grupo específico (resumen o fijos).
 * @param {string} group - 'resumen' o 'fijos'
 */
function toggleSensitiveData(group) {
    const dataElements = document.querySelectorAll(`.${group}-data`);
    const iconElement = document.getElementById(`icon-${group}`);

    if (dataElements.length === 0) return;

    // isRevealed será TRUE si tiene la clase 'revealed' (actualmente visible: 👁️)
    const isRevealed = dataElements[0].classList.contains('revealed');

    // 1. Alternar la clase en todos los elementos del grupo (Si está revelado, lo oculta y viceversa)
    dataElements.forEach(element => {
        element.classList.toggle('revealed', !isRevealed);
    });

    // 2. Cambiar el icono (USANDO OJOS Y MONO)
    if (iconElement) {
        if (isRevealed) {
            // Estaba revelado (👁️) -> Ocultar (🙈)
            iconElement.textContent = '🙈'; 
            iconElement.title = 'Mostrar Montos';
            // También actualizamos el icono en el botón que contiene el span
            iconElement.parentElement.title = 'Mostrar Montos'; 
        } else {
            // Estaba oculto (🙈) -> Revelar (👁️)
            iconElement.textContent = '👁️'; 
            iconElement.title = 'Ocultar Montos';
            iconElement.parentElement.title = 'Ocultar Montos';
        }
    }
    
    // 3. Guardar el estado en localStorage
    localStorage.setItem(`data-revealed-${group}`, !isRevealed);
}

// Opcional: Cargar y aplicar el estado guardado al inicio de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Si el estado guardado es 'true' (debe estar revelado), llamamos a toggle
    if (localStorage.getItem('data-revealed-resumen') === 'true') {
        toggleSensitiveData('resumen'); 
    } else {
         // Si por defecto debe estar oculto, actualizamos el icono a 🙈
         const iconResumen = document.getElementById('icon-resumen');
         if (iconResumen) iconResumen.textContent = '🙈';
    }

    if (localStorage.getItem('data-revealed-fijos') === 'true') {
        toggleSensitiveData('fijos');
    } else {
         const iconFijos = document.getElementById('icon-fijos');
         if (iconFijos) iconFijos.textContent = '🙈';
    }
});

// ===========================================
// FUNCIONES DE UTILIDAD SWEETALERT2
// ===========================================

/**
 * Muestra una notificación Toast (éxito, error, advertencia)
 * @param {string} icon - 'success', 'error', 'warning', 'info', 'question'
 * @param {string} title - El mensaje principal de la alerta
 */
const mostrarNotificacion = (icon, title) => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: icon,
        title: title
    });
};

/**
 * Muestra un modal de confirmación con botones personalizados
 * @param {string} title - Título del modal de confirmación
 * @param {string} text - Mensaje de confirmación
 * @param {function} callback - Función a ejecutar si el usuario confirma (presiona Sí)
 */
const confirmarAccion = async (title, text, callback) => {
    const result = await Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1D4ED8', // Usamos tu color primary
        cancelButtonColor: '#EF4444',  // Usamos tu color danger
        confirmButtonText: 'Sí, estoy seguro',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        callback();
    }
};


// ====================================================================
// === FUNCIONES DE UTILIDAD ===
// ====================================================================

// --- LÓGICA DEL MENÚ DE 3 PUNTOS ---
let menuAbierto = null; 

function formatearFechaArgentina(fechaISO) {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-');
    if (partes.length === 3) {
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return fechaISO;
}

// CORRECCIÓN CLAVE: Adjuntar al window para que sea global y accesible desde el onclick del tr.innerHTML
window.mostrarMenuAcciones = function(event, id, fecha, tipo, categoria, detalle, monto) {
    // Si hay un menú abierto, ciérralo
    if (menuAbierto) { menuAbierto.remove(); menuAbierto = null; }
    
    // Crear el contenedor del menú
    const menu = document.createElement('div');
    // CLAVE DE VISIBILIDAD: Usar z-50 para asegurar que esté por encima de la tabla.
    menu.className = 'absolute right-0 mt-2 w-40 bg-white rounded-md shadow-xl z-50 border border-gray-200';

    // Crear botones de Editar y Eliminar
    menu.innerHTML = `
        <button onclick="editarMovimiento('${id}', '${fecha}', '${tipo}', '${categoria}', '${detalle.replace(/'/g, "\\'")}', ${monto}); this.parentNode.remove();"
            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            ✏️ Editar
        </button>
        <button onclick="eliminarMovimiento('${id}', '${categoria}', ${monto}); this.parentNode.remove();"
            class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            🗑️ Eliminar
        </button>
    `;

    // Adjuntar y establecer posición
    const celda = event.target.closest('td');
    celda.appendChild(menu);
    menuAbierto = menu;
}

// Cierre global del menú al hacer clic fuera
document.addEventListener('click', (e) => {
    if (menuAbierto && !menuAbierto.contains(e.target) && !e.target.closest('button')) {
        menuAbierto.remove();
        menuAbierto = null;
    }
});

// --- LÓGICA DE FECHA RÁPIDA ---

function obtenerFechaFormateada(restaDias = 0) {
    const d = new Date();
    d.setDate(d.getDate() - restaDias);
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

btnHoy.addEventListener('click', () => fechaInput.value = obtenerFechaFormateada(0));
btnAyer.addEventListener('click', () => fechaInput.value = obtenerFechaFormateada(1));


// --- LÓGICA DE GUARDADO (CON VALIDACIÓN DE FIJOS) ---
formulario.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const id = document.getElementById('movimiento-id')?.value; 
    const fecha = document.getElementById('fecha').value;
    const monto = parseFloat(document.getElementById('monto').value);

    // [CORRECCIÓN 1: SweetAlert2 para validación de campos]
    if (isNaN(monto) || monto <= 0 || !fecha || !selectCategoria.value) {
        mostrarNotificacion('warning', '¡Oops! Por favor, completa la fecha, el monto y selecciona una categoría.');
        return;
    }

    const categoria = selectCategoria.value;
    const tipo = document.getElementById('tipo').value;
    const esFijo = CATEGORIAS_FIJAS_VALUES.includes(categoria) && tipo === 'egreso';
    
    // VALIDACIÓN DE MONTOS FIJOS
    if (esFijo) {
        // 💡 CORRECCIÓN CRÍTICA: Buscar la configuración vigente para la fecha del movimiento
        const mesVigenciaMovimiento = fecha.substring(0, 7); // YYYY-MM
        let configFijosMaestro = {};
        let presupuesto = 0;

        // BÚSQUEDA DEL DOCUMENTO FIJO VIGENTE MÁS RECIENTE ANTERIOR O IGUAL AL MES DEL MOVIMIENTO
        const q = query(
            collection(db, FIJOS_CONFIG_COLLECTION),
            where(documentId(), '<=', mesVigenciaMovimiento), 
            orderBy(documentId(), 'desc'),
            limit(1)
        );

        try {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                configFijosMaestro = querySnapshot.docs[0].data();
            }
        } catch (error) {
            console.error("Error al buscar configuración fija para validación:", error);
        }

        // Obtener el presupuesto desde la configuración vigente
        presupuesto = configFijosMaestro[categoria]?.monto || 0;
        
        // El resto del código de validación es correcto
        if (presupuesto > 0) {
            const deviation = Math.abs(monto - presupuesto) / presupuesto;

            if (deviation > DEVIATION_THRESHOLD) {
                const porcentaje = (deviation * 100).toFixed(1);
                
                // [CORRECCIÓN 2: SweetAlert2 para advertencia de desvío]
                const result = await Swal.fire({
                    title: '⚠️ Advertencia de Monto Fijo',
                    html: `Estás ingresando <b>${formatoMoneda.format(monto)}</b> para <b>${CATEGORIA_LABEL_MAP[categoria]}</b>.<br><br>El presupuesto es ${formatoMoneda.format(presupuesto)}.<br>Desviación: <b>${porcentaje}%</b> (Máximo: ${DEVIATION_THRESHOLD * 100}%).<br><br>¿Desea continuar con el registro de este monto?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#1D4ED8',
                    cancelButtonColor: '#EF4444',
                    confirmButtonText: 'Sí, Continuar',
                    cancelButtonText: 'Cancelar'
                });

                if (!result.isConfirmed) {
                    return; 
                }
            }
        }
    }

    const movimientoData = {
        fecha: fecha,
        tipo: tipo,
        categoria: categoria,
        detalle: document.getElementById('detalle').value.trim() || 'Sin detalle',
        monto: monto,
        mes_ref: fecha.substring(0, 7), 
        esFijo: esFijo
    };

    try {
        if (id) {
            const docRef = doc(db, MOVIMIENTOS_COLLECTION, id);
            await updateDoc(docRef, movimientoData);
            // [CORRECCIÓN 3: SweetAlert2 para actualización exitosa]
            mostrarNotificacion('success', `¡Movimiento de ${CATEGORIA_LABEL_MAP[categoria] || categoria} actualizado!`);
        } else {
            movimientoData.timestamp = new Date(); 
            await addDoc(collection(db, MOVIMIENTOS_COLLECTION), movimientoData);
            // [CORRECCIÓN 3: SweetAlert2 para guardado exitoso]
            mostrarNotificacion('success', `¡Movimiento de ${CATEGORIA_LABEL_MAP[categoria] || categoria} guardado!`);
        }

        // Limpiar y resetear la interfaz
        formulario.reset();
        document.getElementById('movimiento-id')?.remove(); 
        const submitButton = formulario.querySelector('button[type="submit"]');
        submitButton.textContent = 'GUARDAR';
        submitButton.classList.remove('bg-amber-500', 'hover:bg-amber-600');
        submitButton.classList.add('bg-primary', 'hover:bg-blue-700');
        fechaInput.value = obtenerFechaFormateada(0); 
        
        await inicializarDashboard(); 

    } catch (error) {
        console.error(`Error al ${id ? 'actualizar' : 'guardar'}: `, error);
        // [CORRECCIÓN 3: SweetAlert2 para error]
        mostrarNotificacion('error', "Ocurrió un error al guardar/actualizar. Revisa la consola.");
    }
});

// --- FUNCIONES ACCESIBLES GLOBALMENTE (Edición y Eliminación) ---

window.editarMovimiento = async (id, fecha, tipo, categoria, detalle, monto) => {
    
    let idInput = document.getElementById('movimiento-id');
    if (!idInput) {
        idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.id = 'movimiento-id';
        formulario.appendChild(idInput);
    }
    idInput.value = id;
    
    document.getElementById('fecha').value = fecha;
    document.getElementById('tipo').value = tipo;
    document.getElementById('categoria').value = categoria;
    document.getElementById('detalle').value = detalle === 'Sin detalle' ? '' : detalle;
    document.getElementById('monto').value = monto;
    
    const submitButton = formulario.querySelector('button[type="submit"]');
    submitButton.textContent = 'ACTUALIZAR MOVIMIENTO';
    submitButton.classList.remove('bg-primary');
    submitButton.classList.add('bg-amber-500', 'hover:bg-amber-600');
    
    // [CORRECCIÓN 4: SweetAlert2 para notificación de edición]
    mostrarNotificacion('info', `Editando: ${CATEGORIA_LABEL_MAP[categoria] || categoria}. Modifique los campos y presione 'ACTUALIZAR'.`);
};

window.eliminarMovimiento = async (id, categoria, monto) => {
    // [CORRECCIÓN 5: SweetAlert2 para confirmación de eliminación de movimiento]
    confirmarAccion(
        `¿Estás seguro de ELIMINAR?`,
        `Se eliminará el movimiento de ${CATEGORIA_LABEL_MAP[categoria] || categoria} por ${formatoMoneda.format(monto)}.`,
        async () => {
            try {
                await deleteDoc(doc(db, MOVIMIENTOS_COLLECTION, id));
                mostrarNotificacion('success', "Movimiento eliminado correctamente.");
                await inicializarDashboard(); 
            } catch (error) {
                console.error("Error al eliminar:", error);
                mostrarNotificacion('error', "Error al eliminar el movimiento.");
            }
        }
    );
};


// --- LÓGICA DE CATEGORÍAS FIJAS DINÁMICAS (FUNCIÓN CLAVE) ---

async function cargarCategoriasFijas() {
    // 1. Obtener categorías personalizadas de Firebase
    const q = query(collection(db, CATEGORIAS_PERSONALIZADAS_COLLECTION), orderBy("nombre", "asc"));
    const snapshot = await getDocs(q);
    const categoriasPersonalizadas = snapshot.docs.map(doc => ({ 
        value: doc.id, 
        label: doc.data().nombre,
        esPersonalizada: true 
    }));

    // 2. Definir los Ingresos (estáticos)
    const categoriasIngreso = [
        { value: 'SUELDO', label: 'Sueldo (Ingreso)' }, 
        { value: 'SALARIO', label: 'Salario (Ingreso)' },
        { value: 'EMPRENDIMIENTO', label: 'Emprendimiento (Ingreso)' }, 
    ];

    // 3. Unir la lista Base con las Personalizadas
    const categoriasEgresosFijos = [...CATEGORIAS_FIJAS_BASE, ...categoriasPersonalizadas];
    
    // 4. Actualizar las variables globales
    categoriasFijasActuales = [...categoriasEgresosFijos, ...categoriasIngreso];
    
    // 5. Actualizar la lista de VALUES para las validaciones (Solo Egreso Fijos)
    CATEGORIAS_FIJAS_VALUES.length = 0; 
    categoriasEgresosFijos.forEach(cat => CATEGORIAS_FIJAS_VALUES.push(cat.value));

    // 6. Construir el Mapa de Búsqueda (ID/Value -> Label)
    CATEGORIA_LABEL_MAP = {};
    [...CATEGORIAS_VARIABLES, ...categoriasEgresosFijos, ...categoriasIngreso].forEach(cat => {
        CATEGORIA_LABEL_MAP[cat.value] = cat.label;
    });
    
    return categoriasFijasActuales;
}


// --- LÓGICA DE FIJOS RECURRENTES (CONFIGURACIÓN MAESTRA Y MODAL) ---

btnConfigFijos.addEventListener('click', async () => {
    await cargarFijosMaestrosAlModal();
    modalFijos.classList.remove('hidden');
});

btnCerrarModalFijos.addEventListener('click', () => {
    modalFijos.classList.add('hidden');
});

async function cargarFijosMaestrosAlModal() {
    
    // 1. Usamos el mes actual como referencia para encontrar la configuración MÁS RECIENTE
    const mesVigenciaActual = selectMesFiltro.value; 
    let configFijosMaestro = {};

    // --- BÚSQUEDA DEL DOCUMENTO FIJO VIGENTE MÁS RECIENTE ---
    // Consulta: Busca el último documento cuyo ID (YYYY-MM) sea menor o igual al mes seleccionado.
    const q = query(
        collection(db, FIJOS_CONFIG_COLLECTION),
        where(documentId(), '<=', mesVigenciaActual), 
        orderBy(documentId(), 'desc'),
        limit(1)
    );

    try {
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            configFijosMaestro = querySnapshot.docs[0].data();
            console.log(`[Modal Fijos] Cargando configuración vigente desde: ${querySnapshot.docs[0].id}`);
        } else {
            console.log("[Modal Fijos] No se encontró configuración. Usando valores por defecto.");
        }
    } catch (error) {
        console.error("Error al cargar fijos para el modal:", error);
    }
    // --------------------------------------------------------

    fijosMaestrosContainer.innerHTML = '';

    // Usamos la lista de fijos dinámica
    const egresosFijos = categoriasFijasActuales.filter(c => c.value !== 'SUELDO' && c.value !== 'SALARIO' && c.value !== 'EMPRENDIMIENTO');

    egresosFijos.forEach(cat => {
        // Usa la configuración encontrada por vigencia, o valores por defecto
        const config = configFijosMaestro[cat.value] || { monto: 0, detalle: '', activo: true }; 
        
        const div = document.createElement('div');
        div.className = 'flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 p-2 border rounded-lg bg-gray-50';
        
        // Formateamos el monto para el input (si existe)
        const montoDisplay = config.monto ? config.monto.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '';

        div.innerHTML = `
            <div class="flex items-center w-full sm:w-1/4">
                <input type="checkbox"
                        id="check-${cat.value}"
                        data-categoria="${cat.value}"
                        data-campo="activo"
                        ${config.activo ? 'checked' : ''}
                        class="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mr-2"
                />
                <label for="check-${cat.value}" class="font-medium text-gray-700">${cat.label}:</label>
            </div>
            <input type="number" 
                    data-categoria="${cat.value}"
                    data-campo="monto"
                    value="${montoDisplay}"
                    placeholder="Monto presupuestado"
                    class="w-full sm:w-1/4 p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            />
            <input type="text" 
                    data-categoria="${cat.value}"
                    data-campo="detalle"
                    value="${config.detalle || ''}"
                    placeholder="Ej: Cuota 4/12 o Inactivo en verano"
                    class="w-full sm:w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            />
        `;
        fijosMaestrosContainer.appendChild(div);
    });
}

btnGuardarConfigFijos.addEventListener('click', async () => {
    // 1. OBTENER EL MES SELECCIONADO PARA USARLO COMO ID DEL DOCUMENTO
    const mesVigencia = selectMesFiltro.value; // Ejemplo: '2026-01'
    
    const nuevaConfig = {};
    const inputs = fijosMaestrosContainer.querySelectorAll('input'); 
    
    inputs.forEach(input => {
        const categoria = input.dataset.categoria;
        const campo = input.dataset.campo;
        let valor;

        if (campo === 'monto') {
            // Quitamos cualquier símbolo o coma para asegurar el float
            // Esto permite que el usuario ingrese '120.000' o '120,000'
            valor = parseFloat(input.value.replace(/[$,.]/g, '')) || 0; 
        } else if (campo === 'activo') {
            valor = input.checked; 
        } else {
            valor = input.value.trim();
        }
        
        if (!nuevaConfig[categoria]) {
            nuevaConfig[categoria] = { monto: 0, detalle: '', activo: true }; 
        }
        nuevaConfig[categoria][campo] = valor;
    });

    try {
        // 2. CAMBIO CRÍTICO: El ID del documento es el MES/AÑO ('2026-01')
        await setDoc(doc(db, FIJOS_CONFIG_COLLECTION, mesVigencia), nuevaConfig);
        
        mostrarNotificacion('success', `¡Configuración de Gastos Fijos guardada para ${mesVigencia}!`);
        modalFijos.classList.add('hidden');
        await cargarMovimientos(selectMesFiltro.value);
    } catch (error) {
        console.error("Error al guardar configuración de fijos:", error);
        mostrarNotificacion('error', "Error al guardar la configuración.");
    }
});

// --- LÓGICA DE ADMINISTRACIÓN DE CATEGORÍAS FIJAS PERSONALIZADAS ---

btnAdministrarFijos.addEventListener('click', async () => {
    await cargarCategoriasAdmin();
    modalAdminCategorias.classList.remove('hidden');
});

// Nota: btnCerrarAdminCategorias usa el ID corregido del footer del modal de admin

async function cargarCategoriasAdmin() {
    await cargarCategoriasFijas(); 
    listaCategoriasAdmin.innerHTML = '';
    
    // Muestra TODAS las categorías fijas de egreso, incluyendo las estáticas.
    const categoriasAMostrar = categoriasFijasActuales
        .filter(c => c.value !== 'SUELDO' && c.value !== 'SALARIO' && c.value !== 'EMPRENDIMIENTO');

    if (categoriasAMostrar.length === 0) {
        listaCategoriasAdmin.innerHTML = '<p class="p-4 text-gray-500 text-center">No hay categorías fijas definidas.</p>';
        return;
    }
    
    categoriasAMostrar.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-3 rounded-lg border bg-gray-50';
        
        let botonEliminar = '';
        let etiquetaInfo = '';

        // Solo se permite la eliminación si es una categoría personalizada (creada por el usuario)
        if (cat.esPersonalizada) {
            botonEliminar = `
                <button onclick="eliminarCategoriaFija('${cat.value}', '${cat.label}')" 
                        class="text-danger hover:text-red-800 transition duration-150 p-1">
                    🗑️ Eliminar
                </button>
            `;
        } else {
             // Indicador de que es una categoría base no eliminable
            etiquetaInfo = `<span class="text-xs text-gray-400 ml-2">(Base)</span>`;
            botonEliminar = `
                <span class="text-xs text-gray-500 p-1">No borrable</span>
            `;
        }

        item.innerHTML = `
            <span class="font-medium text-gray-800">${cat.label} ${etiquetaInfo}</span>
            ${botonEliminar}
        `;
        listaCategoriasAdmin.appendChild(item);
    });
}

formNuevaCategoria.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre-nueva-categoria').value.trim();
    
    if (!nombre) {
        // [CORRECCIÓN 7: SweetAlert2 para validación de categoría vacía]
        mostrarNotificacion('warning', "El nombre de la categoría no puede estar vacío.");
        return;
    }

    try {
        await addDoc(collection(db, CATEGORIAS_PERSONALIZADAS_COLLECTION), {
            nombre: nombre,
            fechaCreacion: new Date()
        });
        // [CORRECCIÓN 7: SweetAlert2 para creación de categoría exitosa]
        mostrarNotificacion('success', `Categoría fija "${nombre}" creada. Asigna su monto en Configuración Maestra.`);
        formNuevaCategoria.reset();
        await cargarCategoriasAdmin(); 
        await inicializarDashboard(); 
    } catch (error) {
        console.error("Error al crear categoría:", error);
        // [CORRECCIÓN 7: SweetAlert2 para error]
        mostrarNotificacion('error', "Error al crear la categoría.");
    }
});

window.eliminarCategoriaFija = async (id, nombre) => {
    // [CORRECCIÓN 8: SweetAlert2 para confirmación de eliminación de categoría]
    confirmarAccion(
        `¿Estás seguro de ELIMINAR la categoría?`,
        `Se eliminará la categoría fija personalizada "${nombre}". \n\n¡Advertencia! Esto NO BORRARÁ los movimientos históricos ya registrados con ella.`,
        async () => {
            try {
                // 1. Eliminar la categoría de la colección de personalizadas
                await deleteDoc(doc(db, CATEGORIAS_PERSONALIZADAS_COLLECTION, id));
                
                // 2. Eliminar su configuración maestra
                const configRef = doc(db, FIJOS_CONFIG_COLLECTION, FIJOS_CONFIG_DOC_ID);
                await updateDoc(configRef, { [id]: deleteField() }); 
                
                mostrarNotificacion('success', `Categoría "${nombre}" eliminada correctamente.`);
                await cargarCategoriasAdmin(); 
                await inicializarDashboard(); 

            } catch (error) {
                console.error("Error al eliminar categoría:", error);
                mostrarNotificacion('error', "Error al eliminar la categoría.");
            }
        }
    );
};

// --- LÓGICA DE LECTURA, ANÁLISIS Y GRÁFICO ---

function inicializarCategoriasDropdown() {
    
    selectCategoria.innerHTML = '<option value="" disabled selected>-- Seleccionar Categoría --</option>';
    
    const optgroupVariables = document.createElement('optgroup');
    optgroupVariables.label = 'GASTOS VARIABLES (Diario)';
    CATEGORIAS_VARIABLES.forEach(cat => optgroupVariables.appendChild(new Option(cat.label, cat.value)));
    selectCategoria.appendChild(optgroupVariables);

    const optgroupFijos = document.createElement('optgroup');
    optgroupFijos.label = 'GASTOS FIJOS (Egreso de Cuenta)';
    categoriasFijasActuales
        .filter(c => c.value !== 'SUELDO' && c.value !== 'SALARIO' && c.value !== 'EMPRENDIMIENTO')
        .forEach(cat => optgroupFijos.appendChild(new Option(cat.label, cat.value)));
    selectCategoria.appendChild(optgroupFijos);
    
    const optgroupIngresos = document.createElement('optgroup');
    optgroupIngresos.label = 'INGRESOS';
    categoriasFijasActuales
        .filter(c => c.value === 'SUELDO' || c.value === 'SALARIO' || c.value === 'EMPRENDIMIENTO')
        .forEach(cat => optgroupIngresos.appendChild(new Option(cat.label, cat.value)));
    selectCategoria.appendChild(optgroupIngresos);
}


async function cargarResumenFijos(mesSeleccionado, movimientosMesActual) {
    
    // 1. Inicializamos la variable que contendrá la configuración fija vigente.
    let configFijosMaestro = {}; 

    // --- BÚSQUEDA DEL DOCUMENTO FIJO VIGENTE PARA ESTE MES (VIGENCIA HISTÓRICA) ---
    // Usamos el mes seleccionado para encontrar la configuración más reciente anterior o igual a ese mes.
    const q = query(
        collection(db, FIJOS_CONFIG_COLLECTION),
        // Filtra los documentos cuyo ID (formato YYYY-MM) sea menor o igual al mes que estamos viendo.
        where(documentId(), '<=', mesSeleccionado), 
        // Ordena de forma descendente (el más reciente primero).
        orderBy(documentId(), 'desc'),
        // Limita a 1 solo resultado (el monto fijo más reciente vigente).
        limit(1)
    );

    try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Si encontramos una configuración, la asignamos.
            configFijosMaestro = querySnapshot.docs[0].data();
            console.log(`[Fijos Vigencia] Usando configuración desde: ${querySnapshot.docs[0].id}`);
        } else {
            // Si no hay, ya está inicializado a {}, pero dejamos el log.
            console.log("[Fijos Vigencia] No se encontró configuración previa. Usando objeto vacío.");
        }
    } catch (error) {
        console.error("Error al obtener configuración fija vigente:", error);
        configFijosMaestro = {}; // Asegura un objeto vacío en caso de error
    }
    // -------------------------------------------------------------------------------------

    const fijosPagadosDisplay = document.getElementById('fijos-pagados');
    const fijosPresupuestoDisplay = document.getElementById('fijos-presupuesto');
    const fijosPendienteDisplay = document.getElementById('fijos-pendiente');
    const listaFijosContainer = document.getElementById('lista-fijos');
    
    listaFijosContainer.innerHTML = '<p class="text-center text-sm text-gray-500">Cargando...</p>';

    let totalPresupuestoFijo = 0;
    let totalPagadoFijo = 0;
    
    // Obtenemos los pagos REALES del mes para las categorías fijas
    const fijosPagados = movimientosMesActual
        .filter(m => m.esFijo && m.tipo === 'egreso') 
        .reduce((acc, m) => {
            acc[m.categoria] = (acc[m.categoria] || 0) + m.monto;
            return acc;
        }, {});
        
    listaFijosContainer.innerHTML = '';

    // Usar la lista dinámica para iterar y mostrar
    categoriasFijasActuales
        .filter(c => c.value !== 'SUELDO' && c.value !== 'SALARIO' && c.value !== 'EMPRENDIMIENTO')
        .forEach(cat => {
            const config = configFijosMaestro[cat.value] || { monto: 0, detalle: '', activo: true };
            
            // FILTRO CLAVE: Solo mostrar si está ACTIVO o si hay un pago registrado.
            if (!config.activo && (fijosPagados[cat.value] === undefined || fijosPagados[cat.value] === 0)) {
                return; 
            }

            const montoEstimado = config.monto || 0;
            const detalleCuota = config.detalle || '';
            const montoPagado = fijosPagados[cat.value] || 0;
            const pendiente = Math.max(0, montoEstimado - montoPagado);
            
            if (config.activo) { 
                // Sumamos al total de presupuesto solo si la categoría está marcada como ACTIVA
                totalPresupuestoFijo += montoEstimado;
            }
            // Sumamos al total pagado REAL, independientemente del estado 'activo', si hay un movimiento
            totalPagadoFijo += montoPagado; 

            const item = document.createElement('div');
            const baseClass = config.activo ? '' : 'opacity-70 border-gray-300 bg-gray-50'; 
            item.className = `flex justify-between items-center p-3 rounded-lg border ${baseClass}`;
            
            let statusClass = 'text-danger bg-danger/10 border-danger';
            let statusText = `${formatoMoneda.format(pendiente)} Pendiente`;
            
            if (!config.activo) {
                statusClass = 'text-gray-500 bg-gray-100 border-gray-300';
                statusText = montoPagado > 0 ? `Pagado ${formatoMoneda.format(montoPagado)} (INACTIVO)` : 'INACTIVO';
            } else if (montoPagado >= montoEstimado && montoEstimado > 0) {
                statusClass = 'text-success bg-success/10 border-success';
                statusText = '✅ Pago Completo';
            } else if (montoPagado > 0 && montoPagado < montoEstimado) {
                statusClass = 'text-amber-600 bg-amber-100 border-amber-500';
                statusText = `${formatoMoneda.format(montoPagado)} pagado`;
            } else if (montoEstimado === 0 && montoPagado > 0) {
                statusClass = 'text-green-800 bg-green-200 border-green-500';
                statusText = '✅ Pagado (Sin Est.)';
            } else if (montoEstimado === 0) {
                statusClass = 'text-gray-500 bg-gray-100 border-gray-300';
                statusText = 'No Presupuestado';
            }

            item.innerHTML = `
                <span class="font-medium text-gray-800">${cat.label} 
                    ${detalleCuota ? `<span class="text-xs text-gray-500 block">${detalleCuota}</span>` : ''}
                </span>
                <div class="text-right">
                    <span class="text-xs text-gray-500 block">Est.: ${formatoMoneda.format(montoEstimado)}</span>
                    <span class="font-semibold text-sm ${statusClass}">${statusText}</span>
                </div>
            `;
            listaFijosContainer.appendChild(item);
    });

    fijosPresupuestoDisplay.textContent = formatoMoneda.format(totalPresupuestoFijo);
    fijosPagadosDisplay.textContent = formatoMoneda.format(totalPagadoFijo);
    fijosPendienteDisplay.textContent = formatoMoneda.format(totalPresupuestoFijo - totalPagadoFijo);
    
    // Devolvemos el total pagado REAL (totalPagadoFijo) y los detalles (fijosPagados)
    return { totalPagadoFijo, fijosPagados }; 
}


// ====================================================================
// === FUNCIÓN PRINCIPAL DE CARGA DE MOVIMIENTOS (4 COLUMNAS PWA) ===
// ====================================================================

async function cargarMovimientos(mesSeleccionado) {
    if (!mesSeleccionado) return;
    
    const listaMovimientos = document.getElementById('lista-movimientos');
    // ATENCIÓN: Colspan ajustado a 4 columnas
    listaMovimientos.innerHTML = '<tr><td colspan="4" class="px-4 py-3 text-center">Cargando datos...</td></tr>'; 
    
    const [anio, mes] = mesSeleccionado.split('-').map(Number);
    const mesAnteriorDate = new Date(anio, mes - 2, 1);
    const mesAnteriorRef = `${mesAnteriorDate.getFullYear()}-${String(mesAnteriorDate.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('mes-actual').textContent = mesSeleccionado;
    
    const movimientosMesActual = await obtenerMovimientosPorMes(mesSeleccionado);
    const movimientosMesAnterior = await obtenerMovimientosPorMes(mesAnteriorRef);
    
    busquedaInput.value = ''; 
    const { totalPagadoFijo, fijosPagados } = await cargarResumenFijos(mesSeleccionado, movimientosMesActual);

    let totalIngresos = 0;
    let totalEgresosVariables = 0;
    const egresosPorCategoria = {}; 
    const ingresosPorCategoria = {}; 
    listaMovimientos.innerHTML = ''; 

    movimientosMesActual.forEach(data => {
        const esFijo = data.esFijo && data.tipo === 'egreso';
        const esIngreso = data.tipo === 'ingreso';

        if (esIngreso) {
            totalIngresos += data.monto;
            ingresosPorCategoria[data.categoria] = (ingresosPorCategoria[data.categoria] || 0) + data.monto; 
        } else if (!esFijo) { 
            totalEgresosVariables += data.monto;
        }
        
        if (!esIngreso) { 
             egresosPorCategoria[data.categoria] = (egresosPorCategoria[data.categoria] || 0) + data.monto;
        }

        // 1. FORMATO DE FECHA A DD/MM
        const fechaPartes = data.fecha.split('-'); // asume YYYY-MM-DD
        const fechaDDMM = `${fechaPartes[2]}/${fechaPartes[1]}`;
        
        // 2. ÍCONO PARA REEMPLAZAR LA COLUMNA TIPO
        const tipoIcono = esIngreso 
            ? '<span class="text-success inline-block ml-1 font-extrabold" title="INGRESO">▲</span>' 
            : '<span class="text-danger inline-block ml-1 font-extrabold" title="EGRESO">▼</span>';
            
        // 3. CONCATENACIÓN CATEGORÍA Y DETALLE
        const categoriaLabel = CATEGORIA_LABEL_MAP[data.categoria] || data.categoria;
        const categoriaYDetalleHTML = `
            ${categoriaLabel}
            ${data.detalle && data.detalle !== 'Sin detalle' 
                ? `<span class="text-xs text-gray-500 block sm:inline">(${data.detalle})</span>` 
                : ''}
        `;
        
        const tr = document.createElement('tr');
        tr.className = esIngreso ? 'row-ingreso' : 'row-egreso';
        tr.innerHTML = `
            <td class="px-3 py-2 sm:px-4 sm:py-3 w-[15%] text-left font-semibold">
                ${fechaDDMM}${tipoIcono}
            </td>
            
            <td class="px-3 py-2 sm:px-4 sm:py-3 w-[45%] text-left ${esFijo ? 'text-blue-600 font-semibold' : 'text-gray-800'}">
                ${categoriaYDetalleHTML}
            </td>
            
            <td class="px-3 py-2 sm:px-4 sm:py-3 w-[25%] text-left font-bold">
                ${formatoMoneda.format(data.monto)}
            </td>
            
            <td class="px-3 py-2 sm:px-4 sm:py-3 w-[15%] text-center relative">
                <button onclick="mostrarMenuAcciones(event, 
                    '${data.id}', 
                    '${data.fecha}', 
                    '${data.tipo}', 
                    '${data.categoria}', 
                    '${data.detalle.replace(/'/g, "\\'")}', 
                    ${data.monto}
                )" 
                    class="text-gray-500 hover:text-gray-800 transition duration-150 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg font-bold leading-none">
                    ⋮ 
                </button>
            </td>
        `; 

        listaMovimientos.appendChild(tr);
    });

    if (movimientosMesActual.length === 0) {
        // Colspan ajustado a 4 columnas
        listaMovimientos.innerHTML = '<tr><td colspan="4" class="px-4 py-3 text-center">No hay movimientos registrados para este mes.</td></tr>';
    }

    // EL EGRESO TOTAL SIEMPRE USA EL MONTO REAL PAGADO DE LOS FIJOS
    const totalEgresos = totalPagadoFijo + totalEgresosVariables;
    const balance = totalIngresos - totalEgresos;
    
    // --- ACTUALIZACIÓN DE PANTALLA ESCRITORIO/GRANDE (CON SÍMBOLO Y DECIMALES) ---
    document.getElementById('total-ingresos').textContent = formatoMoneda.format(totalIngresos);
    document.getElementById('total-egresos').textContent = formatoMoneda.format(totalEgresos);
    document.getElementById('balance-final').textContent = formatoMoneda.format(balance);
    document.getElementById('balance-final').className = `text-lg sm:text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-danger'} hidden sm:block`;
    
    // --- NUEVA ACTUALIZACIÓN DE PANTALLA MÓVIL (SIN $ Y SIN DECIMALES) ---
    const formatoEntero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

    document.getElementById('total-ingresos-movil').textContent = formatoEntero.format(totalIngresos);
    document.getElementById('total-egresos-movil').textContent = formatoEntero.format(totalEgresos);
    document.getElementById('balance-final-movil').textContent = formatoEntero.format(balance);
    document.getElementById('balance-final-movil').className = `text-base font-bold ${balance >= 0 ? 'text-success' : 'text-danger'} block sm:hidden`;


    // --- CÁLCULO DE PORCENTAJES Y TOP GASTOS (NUEVO REPORTE) ---
    
    // 1. Proporciones de Alto Nivel
    
    const pctFijosVsIngreso = totalIngresos > 0 ? (totalPagadoFijo / totalIngresos) * 100 : 0;
    const pctVariablesVsIngreso = totalIngresos > 0 ? (totalEgresosVariables / totalIngresos) * 100 : 0;
    const pctBalanceVsIngreso = totalIngresos > 0 ? (balance / totalIngresos) * 100 : 0;

    // Actualizar Alto Nivel en la nueva tarjeta
    document.getElementById('pct-fijos-vs-ingreso').textContent = `${pctFijosVsIngreso.toFixed(1)}%`;
    document.getElementById('pct-variables-vs-ingreso').textContent = `${pctVariablesVsIngreso.toFixed(1)}%`;
    document.getElementById('pct-balance-vs-ingreso').textContent = `${pctBalanceVsIngreso.toFixed(1)}%`;
    document.getElementById('pct-balance-vs-ingreso').classList.toggle('text-danger', balance < 0);
    document.getElementById('pct-balance-vs-ingreso').classList.toggle('text-success', balance >= 0);

    
    // 2. Desglose Interno por Categoría
    
    // Función para obtener el porcentaje de una categoría dentro de su grupo
    const getPercentageBreakdown = (categoryMap, totalGroup, isFijo) => {
        if (totalGroup === 0) return [];
        
        const breakdown = Object.keys(categoryMap).map(categoria => {
            let label;
            if (isFijo) {
                // CORRECCIÓN CLAVE: Buscar el label en la lista de Fijos dinámica
                const catInfo = categoriasFijasActuales.find(c => c.value === categoria);
                label = catInfo ? catInfo.label : categoria;
            } else {
                const catInfo = CATEGORIAS_VARIABLES.find(c => c.value === categoria);
                label = catInfo ? catInfo.label : categoria;
            }
            
            return {
                categoria: label,
                monto: categoryMap[categoria],
                porcentaje: (categoryMap[categoria] / totalGroup) * 100
            };
        });
        // Ordenar por el porcentaje más alto
        return breakdown.sort((a, b) => b.porcentaje - a.porcentaje);
    };
    
    // Filtrar Egreso Variables (no fijos)
    const egresosVariablesMap = movimientosMesActual
        .filter(m => m.tipo === 'egreso' && !m.esFijo)
        .reduce((acc, m) => {
            acc[m.categoria] = (acc[m.categoria] || 0) + m.monto;
            return acc;
        }, {});

    // Generar top 3 Variables
    const topVariables = getPercentageBreakdown(egresosVariablesMap, totalEgresosVariables, false).slice(0, 3);
    const topVariablesHTML = topVariables.length > 0 ? topVariables.map(item => `
        <div class="flex justify-between items-center border-b border-gray-100 pb-1">
            <span class="text-gray-800">${item.categoria}</span>
            <span class="font-bold text-sm text-danger">${item.porcentaje.toFixed(1)}%</span>
        </div>
    `).join('') : '<p class="text-sm text-gray-500">No hay gastos variables en el mes.</p>';
    document.getElementById('top-gastos-variables').innerHTML = `<h4 class="text-md font-semibold text-gray-700">Top ${topVariables.length} Variables:</h4>` + topVariablesHTML;
    
    // Generar top 3 Fijos (Usando fijosPagados que contiene los montos reales)
    const topFijos = getPercentageBreakdown(fijosPagados, totalPagadoFijo, true).slice(0, 3);
    const topFijosHTML = topFijos.length > 0 ? topFijos.map(item => `
        <div class="flex justify-between items-center border-b border-gray-100 pb-1">
            <span class="text-gray-800">${item.categoria}</span>
            <span class="font-bold text-sm text-blue-600">${item.porcentaje.toFixed(1)}%</span>
        </div>
    `).join('') : '<p class="text-sm text-gray-500">No hay pagos fijos registrados.</p>';
    document.getElementById('top-gastos-fijos').innerHTML = `<h4 class="text-md font-semibold text-gray-700">Top ${topFijos.length} Fijos:</h4>` + topFijosHTML;

    // --- CÁLCULO IPC y GRÁFICOS ---
    
    // El IPC utiliza el total real de EGRESOS del mes anterior
    let totalEgresosAnterior = movimientosMesAnterior
        .filter(m => m.tipo === 'egreso')
        .reduce((sum, m) => sum + m.monto, 0);

    calcularYMostrarIPC(totalEgresos, totalEgresosAnterior);
    generarGraficoEgresos(egresosPorCategoria);
    generarGraficoIngresos(ingresosPorCategoria); 
}

async function obtenerMovimientosPorMes(mesRef) {
    const q = query(
        collection(db, MOVIMIENTOS_COLLECTION),
        where("mes_ref", "==", mesRef),
        orderBy("fecha", "desc")
    );
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    } catch (e) {
        console.error("Error al ejecutar consulta. Asegúrate de tener el índice compuesto en Firebase: mes_ref (asc), fecha (desc).", e);
        return [];
    }
}

function cargarOpcionesDeMes() {
    // La variable 'selectMesFiltro' ya está definida globalmente
    const selector = selectMesFiltro; 
    selector.innerHTML = ''; // Limpiamos las opciones

    const hoy = new Date();
    let ultimoMesGuardado = "";
    
    // --- 1. GENERAR MESES FUTUROS Y ACTUALES ---
    // Recorre desde MESES_FUTUROS_PLANIFICACION (18) hasta el mes actual (i=0)
    for (let i = MESES_FUTUROS_PLANIFICACION; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
        const anio = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const mesRef = `${anio}-${mes}`;
        
        const nombreMes = d.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
        const option = new Option(nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1), mesRef);
        selector.add(option);
        
        if (i === 0) {
            ultimoMesGuardado = mesRef;
        }
    }
    
    // --- 2. GENERAR MESES PASADOS (HISTORIA) ---
    // Recorre desde el mes anterior (i=1) hasta el límite histórico (12)
    for (let i = 1; i <= MESES_PASADOS_HISTORICO; i++) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const anio = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const mesRef = `${anio}-${mes}`;
        
        const nombreMes = d.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
        const option = new Option(nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1), mesRef);
        selector.add(option);
    }

    return ultimoMesGuardado;
}


function calcularYMostrarIPC(totalActual, totalAnterior) {
    const ipcValorDisplay = document.getElementById('ipc-valor');
    
    if (totalAnterior === 0 || totalActual === 0) {
        ipcValorDisplay.textContent = 'N/A';
        ipcValorDisplay.className = 'font-semibold text-gray-600';
        return;
    }
    
    const ipc = ((totalActual / totalAnterior) - 1) * 100;
    
    ipcValorDisplay.textContent = `${ipc.toFixed(2)}%`;
    
    if (ipc > 5) { 
        ipcValorDisplay.className = 'font-semibold text-danger';
    } else if (ipc > 0) {
        ipcValorDisplay.className = 'font-semibold text-amber-500';
    } else {
        ipcValorDisplay.className = 'font-semibold text-success';
    }
}

// --- GRÁFICOS ---
function generarGraficoEgresos(egresosPorCategoria) { 
    if (myChartEgresos) { myChartEgresos.destroy(); }
    const categorias = Object.keys(egresosPorCategoria).map(key => CATEGORIA_LABEL_MAP[key] || key);
    const montos = Object.values(egresosPorCategoria);
    const ctx = document.getElementById('graficoGastos')?.getContext('2d');
    
    if (!ctx) return; // Salir si el contexto no está disponible

    myChartEgresos = new Chart(ctx, {
        type: 'doughnut', 
        data: {
            labels: categorias,
            datasets: [{
                data: montos,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', 
                    '#5c5c5c', '#1A79C2', '#C21A79', '#79C21A', '#800080', '#008080'
                ],
                hoverOffset: 10
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } }, title: { display: false } } }
    });
}

function generarGraficoIngresos(ingresosPorCategoria) { 
    if (myChartIngresos) { myChartIngresos.destroy(); }
    const categorias = Object.keys(ingresosPorCategoria).map(key => CATEGORIA_LABEL_MAP[key] || key);
    const montos = Object.values(ingresosPorCategoria);
    const ctx = document.getElementById('graficoIngresos')?.getContext('2d');
    
    if (!ctx) return; // Salir si el contexto no está disponible

    myChartIngresos = new Chart(ctx, {
        type: 'pie', 
        data: {
            labels: categorias,
            datasets: [{
                data: montos,
                backgroundColor: [
                    '#059669', '#1D4ED8', '#FFCE56', '#4BC0C0', '#9966FF'
                ],
                hoverOffset: 10
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } }, title: { display: false } } }
    });
}


// --- LÓGICA DE BÚSQUEDA EN TABLA ---

function filtrarTabla() {
    const filtro = busquedaInput.value.toLowerCase().trim();
    const filas = document.querySelectorAll('#lista-movimientos tr');

    filas.forEach(fila => {
        // Ignorar la fila de 'Cargando datos...' si existe
        if (fila.querySelector('td[colspan="6"]')) return; 

        const categoriaYDetalleText = fila.cells[2] ? fila.cells[2].textContent.toLowerCase() : '';
        const detalleDesktopText = fila.cells[3] ? fila.cells[3].textContent.toLowerCase() : '';

        if (categoriaYDetalleText.includes(filtro) || detalleDesktopText.includes(filtro)) {
            fila.style.display = ''; 
        } else {
            fila.style.display = 'none'; 
        }
    });
}

busquedaInput.addEventListener('keyup', filtrarTabla); 
busquedaInput.addEventListener('search', filtrarTabla); 

// --- INICIALIZACIÓN Y EVENTOS ---

async function inicializarDashboard() {
    await cargarCategoriasFijas(); 
    inicializarCategoriasDropdown();
    fechaInput.value = obtenerFechaFormateada(0);
    const mesInicial = cargarOpcionesDeMes();
    if (mesInicial) {
        cargarMovimientos(mesInicial);
    }
}

btnAplicarFiltro.addEventListener('click', () => {
    cargarMovimientos(selectMesFiltro.value);
});




document.addEventListener('DOMContentLoaded', inicializarDashboard);