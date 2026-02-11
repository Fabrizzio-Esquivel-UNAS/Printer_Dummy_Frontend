// === MODULE: Printing & Preview ===
// Maneja solicitudes de impresión, vista previa y carga de plantillas

async function handleRequestTypeChange() {
    const select = document.getElementById('request-select');
    const customContainer = document.getElementById('custom-json-container');
    const customText = document.getElementById('custom-json-text');

    if (select.value === 'custom') {
        customContainer.classList.remove('hidden');
        if (!customText.value.trim()) {
            customText.value = JSON.stringify({
                "printer": "",
                "paperSize": "80mm",
                "commands": [
                    { "type": "text", "value": "TICKET PERSONALIZADO", "align": "center", "bold": true, "width": 1, "height": 1 },
                    { "type": "feed", "value": 1 },
                    { "type": "cut" }
                ]
            }, null, 2);
        }
    } else {
        customContainer.classList.add('hidden');
    }
}

async function getPayload() {
    const type = document.getElementById('request-select').value;

    if (type === 'custom') {
        const text = document.getElementById('custom-json-text').value;
        try {
            return JSON.parse(text);
        } catch (e) {
            log("❌ JSON inválido en área de texto.", 'error');
            throw e;
        }
    } else {
        const itemPath = REQUEST_FILES[type];
        if (!itemPath) {
            log(`No existe mapeo para '${type}'`, 'error');
            throw new Error(`Invalid type: ${type}`);
        }

        log(`Cargando plantilla ${type}...`);
        const response = await fetch(itemPath);
        if (!response.ok) throw new Error("Error cargando archivo local");
        return await response.json();
    }
}

async function ejecutarImpresion() {
    const printerSelect = document.getElementById('printer-select');
    const printerName = printerSelect.value;

    let payload;
    try {
        payload = await getPayload();
    } catch (e) { return; }

    if (printerName) {
        payload.printer = printerName;
    } else {
        log("⚠ Se usará la impresora definida en el JSON (si existe).", 'warning');
    }

    log(`Enviando impresión...`);

    try {
        const res = await fetch(`${API_URL}/print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        let data;
        try { data = await res.json(); } catch (e) { throw new Error(`Error parsing JSON: ${res.status}`); }

        if (res.ok && data.success) {
            log(`✅ Impresión correcta: ${data.message}`, 'success');
        } else {
            log(`❌ Error (${data.error || res.status}): ${data.message}`, 'error');
        }

    } catch (e) {
        log(`Excepción al imprimir: ${e.message}`, 'error');
    }
}

async function generarVistaPrevia() {
    let payload;
    try {
        payload = await getPayload();
    } catch (e) { return; }

    delete payload.printer;

    log("Solicitando vista previa...", 'info');

    try {
        const res = await fetch(`${API_URL}/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        let data;
        try { data = await res.json(); } catch (e) { throw new Error(`Invalid response: ${res.status}`); }

        if (res.ok && data.success) {
            log(`✅ Vista previa generada.`, 'success');
            mostrarPrevisualizacion(data.previewBase64);
        } else {
            log(`❌ Error Vista Previa: ${data.message}`, 'error');
        }
    } catch (e) {
        log(`Excepción preview: ${e.message}`, 'error');
    }
}

function mostrarPrevisualizacion(base64) {
    const container = document.getElementById('preview-container');
    const placeholder = document.getElementById('preview-image-placeholder');

    container.classList.remove('hidden');

    placeholder.innerHTML = `
        <div style="background: white; padding: 10px; border-radius: 4px; display: inline-block;">
            <img src="data:image/png;base64,${base64}" alt="Vista Previa" 
                 style="max-width:100%; border:1px solid #ccc; min-height: 50px; display: block;">
        </div>
    `;
}
