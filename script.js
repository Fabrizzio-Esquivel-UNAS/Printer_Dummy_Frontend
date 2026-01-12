// --- REQUEST FILES MAPPING ---
const REQUEST_FILES = {
    restaurant: 'Requests/dataOrderRestaurant.json',
    notaVenta: 'Requests/dataNotadeVenta.json',
    factura: 'Requests/dataFactura.json',
    boleta: 'Requests/dataBoleta.json'
};

// --- CONFIGURACIÓN API ---
// Se determina dinámicamente al conectar
let API_URL = '';

let currentPlatform = 'unknown'; // 'windows', 'android', 'ios'

// --- INTERCEPCIÓN DE CONSOLA (LOGS) ---
// Captura logs de consola (incluso los del Bridge) y los muestra en la UI
(function() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    function formatArgs(args) {
        return args.map(arg => {
            if (typeof arg === 'object') {
                try { return JSON.stringify(arg); } catch(e) { return String(arg); }
            }
            return String(arg);
        }).join(' ');
    }

    console.log = function(...args) {
        originalLog.apply(console, args);
        // Evitamos recursión si log() llamara a console.log (actualmente no lo hace, pero por seguridad)
        logToUI(formatArgs(args), 'info', true);
    };

    console.error = function(...args) {
        originalError.apply(console, args);
        logToUI(formatArgs(args), 'error', true);
    };

    console.warn = function(...args) {
        originalWarn.apply(console, args);
        logToUI(formatArgs(args), 'warning', true);
    };
})();

// --- FUNCIONES DE ESTADO E INICIO ---

function checkNativeBridge() {
    // Verificar si existe el objeto inyectado por el WebView
    if (window.NativeAgent) {
        const btnContainer = document.getElementById('mobile-start-container');
        if (btnContainer) {
            btnContainer.style.display = 'block';
        }
        // Usamos console.log para que aparezca en UI y DevTools
        console.log("[Frontend] Entorno móvil nativo detectado: Bridge disponible.");
    }
}

// Escuchar evento de inyección asíncrona (Más robusto)
window.addEventListener('NativeAgentReady', () => {
    console.log("[Event] Evento 'NativeAgentReady' recibido.");
    checkNativeBridge();
});

async function iniciarAgenteMovil() {
    if (!window.NativeAgent) {
        alert("Error crítico: No se detectó el Bridge Nativo (window.NativeAgent).");
        return;
    }

    log("📡 Solicitando inicio del Servidor Local en el dispositivo...", 'info');
    
    try {
        // Llamada al Native Bridge (Dart/Flutter)
        // Bloqueante hasta que el servidor local reporta éxito
        const respuestaBridge = await window.NativeAgent.start();
        
        console.log("Respuesta Bridge:", respuestaBridge);

        if (respuestaBridge.success) {
            const mobileUrl = respuestaBridge.url; // Ej: http://localhost:5050
            log(`✅ Agente Móvil iniciado correctamente en ${mobileUrl}`, 'success');
            
            // Actualizar el input y conectar
            document.getElementById('server-url').value = mobileUrl;
            conectarAgent();
        } else {
            log(`❌ Error iniciando agente móvil: ${respuestaBridge.error}`, 'error');
            alert(`Error del Agente: ${respuestaBridge.error}`);
        }

    } catch (e) {
        log(`❌ Excepción al comunicar con Bridge: ${e.message}`, 'error');
        console.error(e);
    }
}

async function conectarAgent() {
    const urlInput = document.getElementById('server-url');
    let baseUrl = urlInput.value.trim();
    
    // Validar formato básico
    if (!baseUrl.startsWith('http')) {
        baseUrl = 'http://' + baseUrl;
        urlInput.value = baseUrl;
    }
    
    // Remover slash final si existe
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }

    API_URL = `${baseUrl}/api/v1`;
    log(`Intentando conectar a ${API_URL}...`);
    
    await verificarEstado();
}

async function verificarEstado() {
    if (!API_URL) return;

    const statusText = document.getElementById('status-text');
    const statusContainer = document.getElementById('status-container');
    const statusIndicator = document.getElementById('status-indicator');

    statusText.innerText = "Conectando...";
    statusContainer.className = '';

    try {
        const response = await fetch(`${API_URL}/status`);
        if (response.ok) {
            const data = await response.json();
            
            // Actualizar UI de estado
            statusText.innerText = `Online (${data.platform})`;
            statusContainer.className = 'status-online';
            statusIndicator.innerText = '●';
            
            currentPlatform = data.platform ? data.platform.toLowerCase() : 'unknown';
            log(`Agente conectado: Versión ${data.version} en ${data.host} (${currentPlatform})`, 'success');

            // --- Bridge Logic ---
            const bridgeContainer = document.getElementById('bridge-config-container');
            if (bridgeContainer) {
                bridgeContainer.classList.remove('hidden');
                bridgeContainer.style.display = 'flex'; // Asegurar layout flex
                const bridgeInput = document.getElementById('bridge-url');
                const bridgeBtn = document.getElementById('btn-bridge');
                const bridgeBadge = document.getElementById('bridge-status-badge');

                if (data.bridgeTarget) {
                    bridgeInput.value = data.bridgeTarget;
                    bridgeInput.disabled = true;
                    bridgeBtn.innerText = "Desactivar";
                    bridgeBtn.style.backgroundColor = "#ef4444"; 
                    bridgeBtn.onclick = () => toggleBridge(false);
                    bridgeBadge.style.display = 'block';
                    bridgeBadge.innerText = "EN PUENTE";
                    bridgeBadge.title = `Redirigiendo a: ${data.bridgeTarget}`;
                } else {
                     bridgeInput.disabled = false;
                     bridgeBtn.innerText = "Activar";
                     bridgeBtn.style.backgroundColor = "#2563eb";
                     bridgeBtn.onclick = () => toggleBridge(true);
                     bridgeBadge.style.display = 'none';
                }
            }

            // Actualizar UI según plataforma
            actualizarUIPorPlataforma();
            
            // Cargar impresoras
            listarImpresoras();
        } else {
            throw new Error("Respuesta de estado fallida");
        }
    } catch (e) {
        statusText.innerText = "Offline";
        statusContainer.className = 'status-offline';
        statusIndicator.innerText = '○';
        currentPlatform = 'unknown';
        log("No se pudo conectar con el agente local.", 'error');
        
        document.getElementById('printer-list-container').innerHTML = '<p style="text-align:center; color:#ef4444">Agente desconectado.</p>';
        limpiarSelectImpresoras();
        
        const bridgeContainer = document.getElementById('bridge-config-container');
        if (bridgeContainer) {
            bridgeContainer.classList.add('hidden');
            bridgeContainer.style.display = 'none';
        }
    }
}

function actualizarUIPorPlataforma() {
    const isMobile = currentPlatform === 'android' || currentPlatform === 'ios';
    
    // Sincronizar clases con el body para que las reglas CSS del index funcionen
    const body = document.getElementById('app-body');
    if (body) {
        body.classList.remove('platform-mobile', 'platform-desktop');
        if (isMobile) {
            body.classList.add('platform-mobile');
        } else if (currentPlatform !== 'unknown') {
            body.classList.add('platform-desktop');
        }
    }

    const mobileElements = document.querySelectorAll('.mobile-only');
    
    mobileElements.forEach(el => {
        el.style.display = isMobile ? 'block' : 'none'; 
    });
}

// --- PUENTE / BRIDGE ---

async function toggleBridge(enable) {
    if (!API_URL) return;
    
    const bridgeInput = document.getElementById('bridge-url');
    let targetUrl = null;

    if (enable) {
        targetUrl = bridgeInput.value.trim();
        if (!targetUrl) {
            alert("Ingrese la URL del Nodo Maestro (ej. http://192.168.1.50:5050)");
            return;
        }
        if (!targetUrl.startsWith('http')) {
            targetUrl = 'http://' + targetUrl;
        }
    }

    log(`${enable ? 'Activando' : 'Desactivando'} Modo Puente...`, 'info');

    try {
        const response = await fetch(`${API_URL}/bridge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUrl: targetUrl })
        });

        const data = await response.json();

        if (data.success) {
            log(data.message, 'success');
            // Refresh completly to update UI
            verificarEstado();
        } else {
            log(`Error Bridge: ${data.message || 'Desconocido'}`, 'error');
            alert(`Error: ${data.message || 'Falló el cambio de modo'}`);
        }
    } catch (e) {
        log(`Excepción al cambiar modo Bridge: ${e.message}`, 'error');
    }
}

// --- GESTIÓN DE IMPRESORAS ---

async function listarImpresoras() {
    const container = document.getElementById('printer-list-container');
    const select = document.getElementById('printer-select');
    
    // Guardar selección actual si existe
    const currentSelection = select.value;

    try {
        const response = await fetch(`${API_URL}/printers`);
        const data = await response.json();

        if (data.success) {
            // Renderizar Lista (Administración)
            renderPrinterList(data.printers);
            
            // Renderizar Select (Pruebas)
            renderPrinterSelect(data.printers, currentSelection);
        } else {
            container.innerHTML = `<p>Error al obtener lista: ${data.message || 'Desconocido'}</p>`;
        }
    } catch (e) {
        log("Error de red al listar impresoras", 'error');
        container.innerHTML = `<p>Error de conexión.</p>`;
    }
}

function renderPrinterList(printers) {
    const container = document.getElementById('printer-list-container');
    container.innerHTML = '';

    if (printers.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#64748b;">No hay impresoras configuradas.</p>';
        return;
    }

    const isMobile = currentPlatform === 'android' || currentPlatform === 'ios';

    printers.forEach(p => {
        const card = document.createElement('div');
        card.className = 'printer-card';
        
        // Determinar badges
        let badgesHtml = `<span class="badge badge-${p.type === 'NETWORK' ? 'network' : (p.type === 'BLUETOOTH' ? 'bt' : 'driver')}">${p.type}</span>`;
        if (p.isDefault) badgesHtml += ` <span class="badge badge-default">DEFAULT</span>`;

        // Acciones disponibles
        let actionsHtml = `
            <div class="actions-row">
                ${!p.isDefault ? `<button onclick="setPredeterminada('${p.name}')" class="secondary-btn btn-sm" title="Marcar como predeterminada">★</button>` : ''}
                <button onclick="verificarImpresora('${p.name}')" class="secondary-btn btn-sm" title="Verificar estado">❓ Info</button>
        `;

        if (isMobile) {
            // Acciones exclusivas móvil
            actionsHtml += `
                <button onclick="eliminarImpresora('${p.name}')" class="danger-btn btn-sm" title="Eliminar">🗑</button>
            `;
        }
        
        actionsHtml += `</div>`;

        card.innerHTML = `
            <div class="printer-info">
                <h3>${p.name}</h3>
                <div class="printer-meta">
                    ${badgesHtml}
                    <span>${p.target || 'N/A'}</span>
                    <span>${p.status || 'UNKNOWN'}</span>
                </div>
            </div>
            ${actionsHtml}
        `;
        
        container.appendChild(card);
    });
}

function renderPrinterSelect(printers, currentVal) {
    const select = document.getElementById('printer-select');
    select.innerHTML = '<option value="">Seleccione una impresora...</option>';
    
    printers.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.text = `${p.name} ${p.isDefault ? '(Default)' : ''}`;
        if (p.name === currentVal) opt.selected = true;
        select.appendChild(opt);
    });
    
    // Si no hay seleccion, seleccionar la default automáticamente
    if (!select.value) {
        const def = printers.find(p => p.isDefault);
        if (def) select.value = def.name;
    }
}

async function setPredeterminada(name) {
    log(`Estableciendo '${name}' como default...`);
    try {
        const res = await fetch(`${API_URL}/printers/default`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ printer: name })
        });
        const data = await res.json();
        if (data.success) {
            log(data.message, 'success');
            listarImpresoras();
        } else {
            throw new Error(data.message);
        }
    } catch (e) {
        log(`Error: ${e.message}`, 'error');
    }
}

async function verificarImpresora(name) {
    log(`Verificando estado de '${name}'...`);
    try {
        const res = await fetch(`${API_URL}/printers/${name}`);
        const data = await res.json();
        if (data.success) {
            log(`✅ ${name}: ${data.printer.message || 'Lista'}`, 'success');
        } else {
            log(`❌ ${name}: ${data.message}`, 'error');
        }
    } catch (e) {
        log(`Error verificación: ${e.message}`, 'error');
    }
}

// --- FUNCIONES MÓVILES (SCAN & CRUD) ---

async function escanear(type) {
    const resultsDiv = document.getElementById('scan-results');
    const statusDiv = document.getElementById('scan-status');
    statusDiv.innerText = `Escaneando ${type}... por favor espere.`;
    resultsDiv.innerHTML = '';
    
    try {
        const res = await fetch(`${API_URL}/printers/scan?type=${type}`);
        
        if (res.status === 501) {
            statusDiv.innerText = "Esta función no está soportada en Desktop.";
            return;
        }

        const data = await res.json();
        
        if (data.success) {
            statusDiv.innerText = `Se encontraron ${data.devices.length} dispositivos.`;
            data.devices.forEach(dev => {
                const item = document.createElement('div');
                item.className = 'scan-item';
                /* Se usa encodeURIComponent para pasar parámetros seguros */
                item.onclick = () => prellenarModal(dev.model || dev.name, dev.type, dev.address);
                item.innerHTML = `
                    <div>
                        <strong>${dev.model || 'Desconocido'}</strong>
                        <small>${dev.address}</small>
                    </div>
                    <span class="badge badge-${dev.type === 'NETWORK' ? 'network' : 'bt'}">${dev.type}</span>
                `;
                resultsDiv.appendChild(item);
            });
        } else {
            statusDiv.innerText = `Error: ${data.message}`;
        }
    } catch (e) {
        statusDiv.innerText = `Error de escaneo: ${e.message}`;
    }
}

function prellenarModal(name, type, target) {
    document.getElementById('reg-name').value = name;
    document.getElementById('reg-type').value = type;
    document.getElementById('reg-target').value = target;
    mostrarModalRegistro();
}

async function guardarImpresora() {
    const name = document.getElementById('reg-name').value;
    const type = document.getElementById('reg-type').value;
    const target = document.getElementById('reg-target').value;
    
    if (!name || !target) {
        alert("Todos los campos son obligatorios");
        return;
    }
    
    log(`Guardando impresora '${name}'...`);
    try {
        const res = await fetch(`${API_URL}/printers`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: name,
                type: type,
                target: target,
                isDefault: false // Se establece como default explícitamente después si se desea
            })
        });
        const data = await res.json();
        if (data.success) {
            log('Impresora guardada correctamente', 'success');
            cerrarModal();
            listarImpresoras();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (e) {
        log(`Error al guardar: ${e.message}`, 'error');
    }
}

async function eliminarImpresora(name) {
    if(!confirm(`¿Seguro que desea eliminar la impresora '${name}'?`)) return;
    
    try {
        const res = await fetch(`${API_URL}/printers/${name}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            log(`Impresora '${name}' eliminada`, 'success');
            listarImpresoras();
        } else {
            alert(data.message);
        }
    } catch (e) {
        log(`Error al eliminar: ${e.message}`, 'error');
    }
}

// --- UI HELPERS ---

function toggleScan() {
    const area = document.getElementById('scan-area');
    area.classList.toggle('hidden');
    document.getElementById('scan-results').innerHTML = '';
    document.getElementById('scan-status').innerText = '';
}

function mostrarModalRegistro() {
    document.getElementById('modal-registro').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal-registro').classList.remove('active');
    // Limpiar campos
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-target').value = '';
}

function limpiarSelectImpresoras() {
    document.getElementById('printer-select').innerHTML = '<option>Sin conexión</option>';
}

function log(msg, type = 'info') {
    // Wrapper compatible con código antiguo
    logToUI(msg, type, false);
}

function logToUI(msg, type = 'info', fromConsole = false) {
    const logDiv = document.getElementById('log-output');
    if (!logDiv) return;

    // Si viene de consola, le damos un estilo visual ligeramente distinto si se desea,
    // o simplemente lo procesamos. Aquí filtramos mensajes repetidos si es necesario.
    
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    if (fromConsole) entry.style.fontStyle = 'italic';
    
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${fromConsole ? '⚙ ' : ''}${msg}`;
    logDiv.prepend(entry);
}

// --- IMPRESIÓN ---

async function imprimir(tipo) {
    const printerName = document.getElementById('printer-select').value;
    
    const itemPath = REQUEST_FILES[tipo];
    if (!itemPath) return log(`No existe mapeo para '${tipo}'`, 'error');

    log(`Cargando plantilla ${tipo}...`);

    try {
        // Cargar localmente el JSON
        const fileResponse = await fetch(itemPath);
        if (!fileResponse.ok) throw new Error("Error cargando archivo local");
        
        const payload = await fileResponse.json();

        // Asignar impresora seleccionada
        if (printerName) {
            payload.printer = printerName;
        } else {
            log("⚠️ No se seleccionó impresora. Se usa configuración del JSON.", 'warning');
        }

        // Enviar a API
        const res = await fetch(`${API_URL}/print`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        // Manejo de respuesta universal
        let data; 
        try { data = await res.json(); } catch(e) { throw new Error(`Error parsing JSON: ${res.status}`); }

        if (res.ok && data.success) {
            log(`✅ Impresión correcta: ${data.message}`, 'success');
        } else {
            // Manejar errores estructurados (4xx, 5xx)
            // La documentación dice que siempre vuelve success: false y error: CODE
            log(`❌ Error (${data.error || res.status}): ${data.message}`, 'error');
        }

    } catch (e) {
        log(`Excepción al imprimir: ${e.message}`, 'error');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en entorno movil con bridge
    checkNativeBridge();
    // No conectamos automáticamente, esperamos acción del usuario
    log("Frontend listo. Configure la URL del agente y presione Conectar.", 'info');
});

