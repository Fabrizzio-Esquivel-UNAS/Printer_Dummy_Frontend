// === MODULE: Bridge Mode ===
// Maneja el modo puente (bridge) para conectar con nodos maestros

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
            verificarEstado();
        } else {
            log(`Error Bridge: ${data.message || 'Desconocido'}`, 'error');
            alert(`Error: ${data.message || 'Falló el cambio de modo'}`);
        }
    } catch (e) {
        log(`Excepción al cambiar modo Bridge: ${e.message}`, 'error');
    }
}
