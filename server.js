// server.js
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const path = require('path');
const fs = require('fs');

// Configuración
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Variables globales
let comandas = [];
let historial = [];
let mesasHabilitadas = {};

// Cargar historial y mesas habilitadas al iniciar
function cargarDatos() {
  if (fs.existsSync('./data/historial.json')) {
    historial = JSON.parse(fs.readFileSync('./data/historial.json'));
  }
  if (fs.existsSync('./data/mesas.json')) {
    mesasHabilitadas = JSON.parse(fs.readFileSync('./data/mesas.json'));
  } else {
    for (let i = 1; i <= 20; i++) {
      mesasHabilitadas[i] = true;
    }
    fs.writeFileSync('./data/mesas.json', JSON.stringify(mesasHabilitadas));
  }
}
cargarDatos();

// Rutas del servidor
app.post('/pedido', (req, res) => {
  const pedido = req.body;
  if (!mesasHabilitadas[pedido.mesa]) {
    return res.status(403).send({ mensaje: 'Mesa deshabilitada' });
  }

  pedido.fecha = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  pedido.id = Date.now();
  pedido.estado = 'Pendiente';

  comandas.push(pedido);
  io.emit('nuevaComanda', pedido);

  res.status(200).send({ mensaje: 'Pedido recibido' });
});

app.get('/mesas', (req, res) => {
  res.json(mesasHabilitadas);
});

app.post('/mesas', (req, res) => {
  mesasHabilitadas = req.body;
  fs.writeFileSync('./data/mesas.json', JSON.stringify(mesasHabilitadas));
  res.status(200).send({ mensaje: 'Estado de mesas actualizado' });
});

app.get('/historial', (req, res) => {
  res.json(historial);
});

// Manejo de conexiones de Socket.IO
io.on('connection', (socket) => {
  console.log('Usuario conectado');
  socket.emit('comandasActuales', comandas);

  // Escuchar cuando se actualiza una comanda, incluido el nombre del camarero
  socket.on('actualizarComanda', (comandaActualizada) => {
    const index = comandas.findIndex(c => c.id === comandaActualizada.id);
    if (index !== -1) {
      comandas[index] = comandaActualizada;
      io.emit('actualizarComanda', comandas[index]);
    }
  });

  socket.on('platoCompletado', ({ idComanda, idPlato }) => {
    const comanda = comandas.find(c => c.id === idComanda);
    if (comanda) {
      const plato = comanda.platos.find(p => p.id === idPlato);
      if (plato) {
        plato.completado = !plato.completado;
        io.emit('actualizarComanda', comanda);
      }
    }
  });

  socket.on('comandaEnPreparacion', (idComanda) => {
    const comanda = comandas.find(c => c.id === idComanda);
    if (comanda) {
      comanda.enPreparacion = !comanda.enPreparacion;
      io.emit('actualizarComanda', comanda);
    }
  });

  socket.on('comandaCompletada', (idComanda) => {
    const comanda = comandas.find(c => c.id === idComanda);
    if (comanda) {
      comanda.completada = true;
      io.emit('actualizarComanda', comanda);
      io.emit('eliminarComandaCocina', idComanda);

      const comandaParaHistorial = { ...comanda, camarero: comanda.camarero || "Sin asignar" };
      historial.push(comandaParaHistorial);
      fs.writeFileSync('./data/historial.json', JSON.stringify(historial));
    }
  });

  socket.on('borrarComanda', (idComanda) => {
    const index = comandas.findIndex(c => c.id === idComanda);
    if (index !== -1) {
      const comandaBorrada = comandas.splice(index, 1)[0];
      historial.push(comandaBorrada);
      fs.writeFileSync('./data/historial.json', JSON.stringify(historial));
      io.emit('eliminarComanda', idComanda);
    }
  });
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});



