// === MODULE: Agent Connection ===
// Maneja la conexión con el agente local

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
                bridgeContainer.style.display = 'flex';
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

function limpiarSelectImpresoras() {
    document.getElementById('printer-select').innerHTML = '<option>Sin conexión</option>';
}
