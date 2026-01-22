// === MODULE: UI Helpers ===
// Funciones auxiliares para manipulación de la interfaz

function toggleSection(contentId, btn) {
    const content = document.getElementById(contentId);
    if (!content) return;
    
    const isHidden = content.classList.toggle('hidden');
    btn.innerText = isHidden ? '▶' : '▼';
}

function toggleScan() {
    const area = document.getElementById('scan-area');
    area.classList.toggle('hidden');
    document.getElementById('scan-results').innerHTML = '';
    document.getElementById('scan-status').innerText = '';
}

function iniciarEscaneo() {
    const area = document.getElementById('scan-area');
    area.classList.remove('hidden');
    document.getElementById('scan-results').innerHTML = '';
    document.getElementById('scan-status').innerText = '';
    escanear('network');
}

function mostrarModalRegistro() {
    document.getElementById('modal-registro').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal-registro').classList.remove('active');
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-target').value = '';
}
