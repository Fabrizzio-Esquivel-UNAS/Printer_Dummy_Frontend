// === MODULE: UI Helpers ===
// Funciones auxiliares para manipulación de la interfaz

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
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-target').value = '';
}
