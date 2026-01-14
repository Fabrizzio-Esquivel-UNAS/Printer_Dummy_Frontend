// === MODULE: Logger ===
// Intercepta logs de consola y los muestra en la UI

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

function log(msg, type = 'info') {
    // Wrapper compatible
    logToUI(msg, type, false);
}

function logToUI(msg, type = 'info', fromConsole = false) {
    const logDiv = document.getElementById('log-output');
    if (!logDiv) return;

    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    if (fromConsole) entry.style.fontStyle = 'italic';
    
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${fromConsole ? '⚙ ' : ''}${msg}`;
    logDiv.prepend(entry);
}
