// public/js/barra.js

// Lista de IDs de bebidas
const idsBebidas = [9, 10]; // Ajusta estos IDs según los que hayas asignado a las bebidas

let socket = io();
let comandas = [];

function mostrarComandas() {
  document.getElementById('contenido').innerHTML = '<h2>Comandas</h2><div id="grid-comandas" class="grid-comandas"></div>';
  actualizarComandas();
}

function mostrarMesas() {
  fetch('/mesas')
    .then(response => response.json())
    .then(mesas => {
      let contenido = '<h2>Mesas</h2><div id="mesas">';
      for (let i = 1; i <= 20; i++) {
        contenido += `
          <div>
            <label>Mesa ${i}</label>
            <input type="checkbox" id="mesa-${i}" ${mesas[i] ? 'checked' : ''}>
          </div>
        `;
      }
      contenido += '</div><button onclick="guardarMesas()">Guardar</button>';
      document.getElementById('contenido').innerHTML = contenido;
    });
}

function mostrarHistorial() {
  fetch('/historial')
    .then(response => response.json())
    .then(historial => {
      let contenido = '<h2>Historial</h2>';
      historial.forEach(comanda => {
        let total = comanda.platos.reduce((acc, plato) => acc + (plato.precio * plato.cantidad), 0);
        contenido += `
          <div class="comanda">
            <h3>Mesa ${comanda.mesa}</h3>
            <p>Fecha: ${comanda.fecha}</p>
            <ul>
              ${comanda.platos.map(plato => `
                <li>${plato.nombre} x${plato.cantidad} - €${(plato.precio * plato.cantidad).toFixed(2)}</li>
              `).join('')}
            </ul>
            <p>Total: €${total.toFixed(2)}</p>
          </div>
        `;
      });
      document.getElementById('contenido').innerHTML = contenido;
    });
}

function guardarMesas() {
  let mesas = {};
  for (let i = 1; i <= 20; i++) {
    mesas[i] = document.getElementById(`mesa-${i}`).checked;
  }
  fetch('/mesas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(mesas)
  })
    .then(response => response.json())
    .then(data => {
      alert('Estado de mesas actualizado.');
    });
}

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

  socket.on('eliminarComanda', (idComanda) => {
    comandas = comandas.filter(c => c.id !== idComanda);
    actualizarComandas();
  });
});

function actualizarComandas() {
    const grid = document.getElementById('grid-comandas');
    if (!grid) return;
    grid.innerHTML = '';
    comandas.forEach(comanda => {
      const div = document.createElement('div');
      div.className = 'comanda' + (comanda.completada ? ' completada' : '');
      let total = comanda.platos.reduce((acc, plato) => acc + (plato.precio * plato.cantidad), 0);
      div.innerHTML = `
        <h3>Mesa ${comanda.mesa}</h3>
        <p>Fecha: ${comanda.fecha}</p>
        ${comanda.enPreparacion ? '<p class="en-preparacion">(En preparación)</p>' : ''}
        <ul>
          ${comanda.platos.map(plato => `
            <li class="plato ${plato.completado ? 'completado' : ''} ${idsBebidas.includes(plato.id) ? 'bebida' : ''}" onclick="marcarPlato(${comanda.id}, ${plato.id})">
              ${plato.nombre} x${plato.cantidad}
              ${plato.comentario ? `<span class="comentario">${plato.comentario}</span>` : ''}
            </li>
          `).join('')}
        </ul>
        <p>Total: €${total.toFixed(2)}</p>
        <button onclick="marcarComandaCompletada(${comanda.id})">Marcar Comanda Completada</button>
        <button onclick="borrarComanda(${comanda.id})">Borrar Comanda</button>
      `;
      grid.appendChild(div);
    });
  }
  

function marcarPlato(idComanda, idPlato) {
  socket.emit('platoCompletado', { idComanda, idPlato });
}

function marcarComandaCompletada(idComanda) {
  socket.emit('comandaCompletada', idComanda);
}

function borrarComanda(idComanda) {
  if (confirm('¿Estás seguro de que deseas borrar esta comanda?')) {
    socket.emit('borrarComanda', idComanda);
  }
}

// Mostrar comandas al cargar
mostrarComandas();
