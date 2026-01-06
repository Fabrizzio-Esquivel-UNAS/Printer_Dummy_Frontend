// --- REQUEST FILES MAPPING ---
// Mapeo de identificadores de botones a archivos JSON en la carpeta Requests
const REQUEST_FILES = {
    restaurant: 'Requests/dataOrderRestaurant.json',
    notaVenta: 'Requests/dataNotadeVenta.json',
    factura: 'Requests/dataFactura.json',
    boleta: 'Requests/dataBoleta.json'
};

// --- CONFIGURACIÓN API ---
const API_URL = 'http://localhost:5050/api/v1';

// --- FUNCIONES PRINCIPALES ---

async function verificarEstado() {
    const statusText = document.getElementById('status-text');
    const statusContainer = document.getElementById('status-container');
    const statusIndicator = document.getElementById('status-indicator');

    statusText.innerText = "Verificando...";
    statusContainer.className = '';

    try {
        const response = await fetch(`${API_URL}/status`);
        if (response.ok) {
            const data = await response.json();
            statusText.innerText = `Online (v${data.version})`;
            statusContainer.className = 'status-online';
            statusIndicator.innerText = '●';
            log(`Agente conectado: ${data.agent}`, 'success');
            listarImpresoras();
        } else {
            throw new Error("Respuesta no exitosa");
        }
    } catch (e) {
        statusText.innerText = "Offline";
        statusContainer.className = 'status-offline';
        statusIndicator.innerText = '○';
        log("No se pudo conectar con el agente local.", 'error');
        limpiarImpresoras();
    }
}

async function listarImpresoras() {
    const select = document.getElementById('printer-select');
    select.innerHTML = '<option value="">Cargando...</option>';

    try {
        const response = await fetch(`${API_URL}/list`);
        const data = await response.json();
        
        select.innerHTML = '';
        if (data.success && data.printers.length > 0) {
            // Se agrega una opción vacía por defecto si se desea obligar a seleccionar,
            // pero el requerimiento no lo especifica. Asumimos la primera como seleccionada.
            data.printers.forEach(p => {
                const option = document.createElement('option');
                option.value = p.name;
                
                let label = p.name;
                if (p.isDefault) label += ' (Predeterminado)';
                if (p.isOffline) label += ' [OFFLINE]';
                
                option.text = label;
                select.appendChild(option);
            });
            log(`Se encontraron ${data.printers.length} impresoras.`, 'info');
        } else {
            const option = document.createElement('option');
            option.text = "No se encontraron impresoras";
            option.value = "";
            select.appendChild(option);
        }
    } catch (e) {
        select.innerHTML = '<option value="">Error al cargar</option>';
        log("Error al listar impresoras.", 'error');
    }
}

async function imprimir(tipo) {
    const printerName = document.getElementById('printer-select').value;
    
    // 1. Obtener la ruta del archivo JSON correspondiente
    const itemPath = REQUEST_FILES[tipo];
    if (!itemPath) {
        log(`Error: No existe mapeo para el tipo '${tipo}'`, 'error');
        return;
    }

    log(`Cargando plantilla desde ${itemPath}...`, 'info');

    let payload = null;

    // 2. Cargar el JSON desde el archivo local
    try {
        const fileResponse = await fetch(itemPath);
        if (!fileResponse.ok) {
            throw new Error(`No se pudo cargar el archivo ${itemPath}`);
        }
        payload = await fileResponse.json();
    } catch (e) {
        log(`❌ Error cargando plantilla local: ${e.message}`, 'error');
        return;
    }

    // 3. Asignar impresora si el usuario seleccionó una
    if (printerName) {
        payload.printer = printerName;
    } else {
        log("⚠️ No se seleccionó impresora. Se usará la configuración del JSON o predeterminada.", 'info');
    }

    // 4. Enviar a la API
    log(`Enviando solicitud de impresión...`, 'info');

    try {
        const response = await fetch(`${API_URL}/print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            // Si falla el parseo de JSON, asumimos error genérico del servidor
            throw new Error(`Error del servidor (${response.status})`);
        }

        if (response.ok && result.success) {
            log("✅ Impresión enviada correctamente", 'success');
        } else {
            const msg = result.message || result.error || "Error desconocido";
            log(`❌ Error de impresión (${response.status}): ${msg}`, 'error');
        }
    } catch (e) {
        log(`❌ Error al imprimir: ${e.message}`, 'error');
        console.error(e);
    }
}

// --- UTILIDADES ---
function log(msg, type = 'info') {
    const logDiv = document.getElementById('log-output');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${msg}`;
    logDiv.prepend(entry);
}

function limpiarImpresoras() {
    document.getElementById('printer-select').innerHTML = '<option>Sin conexión</option>';
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    verificarEstado();
});
