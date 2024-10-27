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
// Middleware
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
    // Si no existe el archivo de mesas, inicializar todas las mesas como habilitadas
    for (let i = 1; i <= 20; i++) {
      mesasHabilitadas[i] = true;
    }
    fs.writeFileSync('./data/mesas.json', JSON.stringify(mesasHabilitadas));
  }
}
cargarDatos();

// Rutas del servidor
// Ruta para recibir pedidos del cliente
app.post('/pedido', (req, res) => {
  const pedido = req.body;

  // Verificar si la mesa está habilitada
  if (!mesasHabilitadas[pedido.mesa]) {
    return res.status(403).send({ mensaje: 'Mesa deshabilitada' });
  }

  pedido.id = Date.now();
  pedido.estado = 'Pendiente';
  comandas.push(pedido);

  // Emitir el pedido a las interfaces de barra y cocina
  io.emit('nuevaComanda', pedido);

  res.status(200).send({ mensaje: 'Pedido recibido' });
});

// Ruta para obtener el estado de las mesas
app.get('/mesas', (req, res) => {
  res.json(mesasHabilitadas);
});

// Ruta para actualizar el estado de las mesas
app.post('/mesas', (req, res) => {
  mesasHabilitadas = req.body;
  // Guardar en archivo
  fs.writeFileSync('./data/mesas.json', JSON.stringify(mesasHabilitadas));
  res.status(200).send({ mensaje: 'Estado de mesas actualizado' });
});

// Ruta para obtener el historial
app.get('/historial', (req, res) => {
  res.json(historial);
});

// Manejo de conexiones de Socket.IO
io.on('connection', (socket) => {
  console.log('Usuario conectado');

  // Enviar las comandas actuales al conectar
  socket.emit('comandasActuales', comandas);

  // Escuchar cuando se marca un plato como completado
  socket.on('platoCompletado', ({ idComanda, idPlato }) => {
    const comanda = comandas.find(c => c.id === idComanda);
    if (comanda) {
      const plato = comanda.platos.find(p => p.id === idPlato);
      if (plato) {
        plato.completado = !plato.completado; // Alternar el estado de completado
        io.emit('actualizarComanda', comanda);
      }
    }
  });

  // Escuchar cuando una comanda se marca como en preparación
  socket.on('comandaEnPreparacion', (idComanda) => {
    const comanda = comandas.find(c => c.id === idComanda);
    if (comanda) {
      comanda.enPreparacion = !comanda.enPreparacion; // Alternar el estado
      io.emit('actualizarComanda', comanda);
    }
  });

  // Escuchar cuando se marca una comanda como completada
  socket.on('comandaCompletada', (idComanda) => {
    const comanda = comandas.find(c => c.id === idComanda);
    if (comanda) {
      comanda.completada = true;
      // Emitir actualización a las interfaces
      io.emit('actualizarComanda', comanda);
      // Eliminar la comanda de la interfaz de cocina
      io.emit('eliminarComandaCocina', idComanda);
    }
  });

  // Escuchar cuando se borra una comanda
  socket.on('borrarComanda', (idComanda) => {
    const index = comandas.findIndex(c => c.id === idComanda);
    if (index !== -1) {
      const comandaBorrada = comandas.splice(index, 1)[0];
      // Agregar al historial
      historial.push(comandaBorrada);
      fs.writeFileSync('./data/historial.json', JSON.stringify(historial));
      // Emitir evento para eliminar la comanda de las interfaces
      io.emit('eliminarComanda', idComanda);
    }
  });
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
