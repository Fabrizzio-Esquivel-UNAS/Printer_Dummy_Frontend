// === MODULE: Native Bridge ===
// Maneja la comunicación con el bridge nativo en plataformas móviles

function checkNativeBridge() {
    // Verificar si existe el objeto inyectado por el WebView
    if (window.NativeAgent) {
        const btnContainer = document.getElementById('mobile-start-container');
        if (btnContainer) {
            btnContainer.style.display = 'block';
        }
        console.log("[Frontend] Entorno móvil nativo detectado: Bridge disponible.");
    }
}

// Escuchar evento de inyección asíncrona
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
        const respuestaBridge = await window.NativeAgent.start();
        
        console.log("Respuesta Bridge:", respuestaBridge);

        if (respuestaBridge.success) {
            const mobileUrl = respuestaBridge.url;
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
