// public/js/cocina.js

// Inicializar el sonido de notificación
const notificationSound = new Audio('/sounds/notification.mp3');

const idsBebidas = [9, 10]; // Ajusta estos IDs según los que hayas asignado a las bebidas

let socket = io();
let comandas = [];

// Escuchar eventos de socket.io
socket.on('connect', () => {
  socket.on('comandasActuales', (data) => {
    comandas = data;
    actualizarComandas();
  });

  socket.on('nuevaComanda', (comanda) => {
    comandas.push(comanda);
    actualizarComandas();
    notificationSound.play(); // Reproduce el sonido cuando llega una nueva comanda
  });

  socket.on('actualizarComanda', (comandaActualizada) => {
    const index = comandas.findIndex(c => c.id === comandaActualizada.id);
    if (index !== -1) {
      comandas[index] = comandaActualizada;
      actualizarComandas();
    }
  });

  socket.on('eliminarComandaCocina', (idComanda) => {
    comandas = comandas.filter(c => c.id !== idComanda);
    actualizarComandas();
  });
});

function actualizarComandas() {
  const grid = document.getElementById('grid-comandas');
  grid.innerHTML = '';
  comandas.forEach(comanda => {
    const div = document.createElement('div');
    div.className = 'comanda' + (comanda.enPreparacion ? ' en-preparacion' : '');
    div.addEventListener('click', () => marcarEnPreparacion(comanda.id));

    const platosSinBebidas = comanda.platos.filter(plato => !idsBebidas.includes(plato.id));
    
    if (platosSinBebidas.length === 0) {
      return;
    }

    div.innerHTML = `
      <h3>Mesa ${comanda.mesa} - Atendido por: ${comanda.camarero || "Sin asignar"}</h3>
      <p>Fecha: ${comanda.fecha}</p>
      <ul>
        ${platosSinBebidas.map(plato => `
          <li class="plato ${plato.completado ? 'completado' : ''}" onclick="marcarPlato(event, ${comanda.id}, ${plato.id})">
            ${plato.nombre} x${plato.cantidad}
            ${plato.comentario ? `<span class="comentario">${plato.comentario}</span>` : ''}
          </li>
        `).join('')}
      </ul>
    `;
    grid.appendChild(div);
  });
}

function marcarPlato(event, idComanda, idPlato) {
  event.stopPropagation();
  socket.emit('platoCompletado', { idComanda, idPlato });
}

function marcarEnPreparacion(idComanda) {
  socket.emit('comandaEnPreparacion', idComanda);
}


