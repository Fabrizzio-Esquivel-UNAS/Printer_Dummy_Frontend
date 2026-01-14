// === MODULE: Printer Management ===
// Gestiona la lista de impresoras, escaneo y operaciones CRUD

async function listarImpresoras() {
    const container = document.getElementById('printer-list-container');
    const select = document.getElementById('printer-select');
    
    const currentSelection = select.value;

    try {
        const response = await fetch(`${API_URL}/printers`);
        const data = await response.json();

        if (data.success) {
            renderPrinterList(data.printers);
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
        
        let badgesHtml = `<span class="badge badge-${p.type === 'NETWORK' ? 'network' : (p.type === 'BLUETOOTH' ? 'bt' : 'driver')}">${p.type}</span>`;
        if (p.isDefault) badgesHtml += ` <span class="badge badge-default">DEFAULT</span>`;

        let actionsHtml = `
            <div class="actions-row">
                ${!p.isDefault ? `<button onclick="setPredeterminada('${p.name}')" class="secondary-btn btn-sm" title="Marcar como predeterminada">★</button>` : ''}
                <button onclick="verificarImpresora('${p.name}')" class="secondary-btn btn-sm" title="Verificar estado">❓ Info</button>
        `;

        if (isMobile) {
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
                isDefault: false
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
