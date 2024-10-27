// public/js/cocina.js

// Lista de IDs de bebidas
const idsBebidas = [9, 10]; // Ajusta estos IDs según los que hayas asignado a las bebidas

let socket = io();
let comandas = [];

socket.on('connect', () => {
  socket.on('comandasActuales', (data) => {
    comandas = data;
    actualizarComandas();
  });

  socket.on('nuevaComanda', (comanda) => {
    comandas.push(comanda);
    actualizarComandas();
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
      
      // Filtrar los platos para excluir las bebidas
      const platosSinBebidas = comanda.platos.filter(plato => !idsBebidas.includes(plato.id));
      
      // Si no hay platos después de filtrar, no mostrar la comanda
      if (platosSinBebidas.length === 0) {
        return; // Saltar a la siguiente comanda
      }
  
      div.innerHTML = `
        <h3>Mesa ${comanda.mesa}</h3>
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
  // Prevenir que el evento se propague al contenedor de la comanda
  event.stopPropagation();
  socket.emit('platoCompletado', { idComanda, idPlato });
}

function marcarEnPreparacion(idComanda) {
  socket.emit('comandaEnPreparacion', idComanda);
}
