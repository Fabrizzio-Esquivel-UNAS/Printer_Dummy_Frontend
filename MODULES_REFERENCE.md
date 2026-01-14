// ============================================================
// FRONTEND MODULAR STRUCTURE - SCRIPT.JS DEPRECATED
// ============================================================
// 
// El archivo script.js ha sido dividido en módulos independientes
// para mejor mantenibilidad y escalabilidad.
//
// MÓDULOS CREADOS:
// ────────────────────────────────────────────────────────────
//
// 1. modules/config.js
//    - Configuración global y constantes
//    - REQUEST_FILES, API_URL, currentPlatform
//
// 2. modules/logger.js
//    - Sistema de logging y captura de consola
//    - Funciones: log(), logToUI()
//
// 3. modules/nativeBridge.js
//    - Comunicación con bridge nativo (móvil)
//    - Funciones: checkNativeBridge(), iniciarAgenteMovil()
//
// 4. modules/agent.js
//    - Conexión con el agente local
//    - Funciones: conectarAgent(), verificarEstado(), 
//      actualizarUIPorPlataforma(), limpiarSelectImpresoras()
//
// 5. modules/bridge.js
//    - Modo puente (bridge) para nodos maestros
//    - Funciones: toggleBridge()
//
// 6. modules/printers.js
//    - Gestión completa de impresoras
//    - Funciones: listarImpresoras(), renderPrinterList(),
//      setPredeterminada(), verificarImpresora(), escanear(),
//      guardarImpresora(), eliminarImpresora()
//
// 7. modules/printing.js
//    - Impresión y vista previa de solicitudes
//    - Funciones: handleRequestTypeChange(), getPayload(),
//      ejecutarImpresion(), generarVistaPrevia(),
//      mostrarPrevisualizacion()
//
// 8. modules/uiHelpers.js
//    - Funciones auxiliares de interfaz
//    - Funciones: toggleScan(), mostrarModalRegistro(),
//      cerrarModal()
//
// 9. modules/init.js
//    - Punto de entrada e inicialización
//    - Event listener: DOMContentLoaded
//
// ────────────────────────────────────────────────────────────
//
// ORDEN DE CARGA (en index.html):
// 1. config.js        (dependencias: ninguna)
// 2. logger.js        (dependencias: config)
// 3. nativeBridge.js  (dependencias: logger)
// 4. agent.js         (dependencias: logger, printers, config)
// 5. bridge.js        (dependencias: logger, agent)
// 6. printers.js      (dependencias: logger, config, uiHelpers)
// 7. printing.js      (dependencias: logger, config)
// 8. uiHelpers.js     (dependencias: ninguna)
// 9. init.js          (dependencias: nativeBridge, logger)
//
// ============================================================
