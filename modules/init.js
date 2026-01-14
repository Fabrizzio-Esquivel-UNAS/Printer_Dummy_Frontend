// === MODULE: App Initialization ===
// Punto de entrada y lógica de inicialización

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en entorno móvil con bridge
    checkNativeBridge();
    // No conectamos automáticamente, esperamos acción del usuario
    log("Frontend listo. Configure la URL del agente y presione Conectar.", 'info');
});
