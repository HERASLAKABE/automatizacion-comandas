// public/js/cliente.js

let pedido = {
    mesa: obtenerNumeroDeMesa(),
    platos: [],
    fecha: new Date().toLocaleString()
  };
  
  const menuData = {
    entrantes: [
      { id: 1, nombre: 'Bruschetta', precio: 5 },
      { id: 2, nombre: 'Calamares Fritos', precio: 7 }
    ],
    principales: [
      { id: 3, nombre: 'Lasagna', precio: 12 },
      { id: 4, nombre: 'Risotto', precio: 11 }
    ],
    segundos: [
      { id: 5, nombre: 'Filete de Ternera', precio: 15 },
      { id: 6, nombre: 'Salmón al Horno', precio: 14 }
    ],
    postres: [
      { id: 7, nombre: 'Tiramisú', precio: 6 },
      { id: 8, nombre: 'Panna Cotta', precio: 5 }
    ],
    bebidas: [
      {
        id: 9,
        nombre: 'Botella de Agua Mineral',
        opciones: ['500ml', '1l', '1.5l'],
        precio: { '500ml': 1.5, '1l': 2.5, '1.5l': 3.5 }
      },
      { id: 10, nombre: 'Refresco', precio: 2 }
    ]
  };
  
  // Objeto para almacenar las cantidades y comentarios seleccionados
  let seleccionados = {};
  
  function obtenerNumeroDeMesa() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mesa') || 'Desconocida';
  }
  
  function verificarEstadoMesa() {
    const mesa = pedido.mesa;
    fetch('/mesas')
      .then(response => response.json())
      .then(mesas => {
        if (!mesas[mesa]) {
          // La mesa está deshabilitada
          mostrarMensajeMesaDeshabilitada(mesa);
        } else {
          // La mesa está habilitada, mostrar las categorías
          document.getElementById('categorias').style.display = 'block';
        }
      })
      .catch(error => {
        console.error('Error al obtener el estado de las mesas:', error);
        alert('Ocurrió un error al verificar el estado de la mesa. Por favor, inténtelo de nuevo.');
      });
  }
  
  function mostrarMensajeMesaDeshabilitada(mesa) {
    const contenido = document.getElementById('contenido');
    contenido.innerHTML = `
      <div class="mensaje-desactivado">
        <h2>Lo sentimos, pero en estos momentos la mesa ${mesa} está deshabilitada u ocupada.</h2>
        <p>Espere a que se libere o si tiene cualquier duda consulte con el personal de la barra. ¡Muchas gracias!</p>
      </div>
    `;
    // Ocultar las categorías y el botón de finalizar pedido
    document.getElementById('categorias').style.display = 'none';
    document.getElementById('volver').style.display = 'none';
    document.getElementById('finalizar').style.display = 'none';
  }
  
  function mostrarMenu(categoria) {
    const menuDiv = document.getElementById('menu');
    menuDiv.innerHTML = '';
    const platos = menuData[categoria];
    platos.forEach(plato => {
      const cantidadSeleccionada = seleccionados[plato.id]?.cantidad || 0;
      const comentarioSeleccionado = seleccionados[plato.id]?.comentario || '';
      const opcionSeleccionada = seleccionados[plato.id]?.opcionSeleccionada || '';
      let opcionesHTML = '';
      if (plato.opciones) {
        opcionesHTML = `
          <div>
            ${plato.opciones.map(opcion => `
              <button onclick="seleccionarOpcion(${plato.id}, '${opcion}')">${opcion}</button>
            `).join('')}
          </div>
          <p id="opcion-seleccionada-${plato.id}" class="opcion-seleccionada">${opcionSeleccionada ? `Opción seleccionada: ${opcionSeleccionada}` : ''}</p>
        `;
      }
      const platoDiv = document.createElement('div');
      platoDiv.className = 'plato';
      platoDiv.innerHTML = `
        <h3>${plato.nombre}</h3>
        <p>Precio: €${plato.precio}</p>
        ${opcionesHTML}
        <div>
          <button onclick="cambiarCantidad(${plato.id}, -1)">-</button>
          <span id="cantidad-${plato.id}">${cantidadSeleccionada}</span>
          <button onclick="cambiarCantidad(${plato.id}, 1)">+</button>
        </div>
        ${mostrarBotonComentario(plato)}
      `;
      menuDiv.appendChild(platoDiv);
    });
    document.getElementById('categorias').style.display = 'none';
    document.getElementById('volver').style.display = 'inline-block';
  }
  
  function volverAInicio() {
    document.getElementById('menu').innerHTML = '';
    document.getElementById('categorias').style.display = 'block';
    document.getElementById('volver').style.display = 'none';
  }
  
  function cambiarCantidad(idPlato, cambio) {
    if (!seleccionados[idPlato]) {
      seleccionados[idPlato] = { cantidad: 0, comentario: '', opcionSeleccionada: '' };
    }
    seleccionados[idPlato].cantidad += cambio;
    if (seleccionados[idPlato].cantidad < 0) {
      seleccionados[idPlato].cantidad = 0;
    }
    const cantidadSpan = document.getElementById(`cantidad-${idPlato}`);
    if (cantidadSpan) {
      cantidadSpan.textContent = seleccionados[idPlato].cantidad;
    }
  }
  
  function agregarComentario(idPlato) {
    const comentario = prompt('Escribe un comentario (máximo 4 palabras):');
    if (comentario && comentario.split(' ').length <= 4) {
      if (!seleccionados[idPlato]) {
        seleccionados[idPlato] = { cantidad: 0, comentario: '', opcionSeleccionada: '' };
      }
      seleccionados[idPlato].comentario = `(${comentario})`;
      const comentarioP = document.getElementById(`comentario-${idPlato}`);
      if (comentarioP) {
        comentarioP.textContent = seleccionados[idPlato].comentario;
      }
    } else {
      alert('El comentario debe tener máximo 4 palabras.');
    }
  }
  
  function seleccionarOpcion(idPlato, opcion) {
    if (!seleccionados[idPlato]) {
      seleccionados[idPlato] = { cantidad: 0, comentario: '', opcionSeleccionada: '' };
    }
    seleccionados[idPlato].opcionSeleccionada = opcion;
    const opcionP = document.getElementById(`opcion-seleccionada-${idPlato}`);
    if (opcionP) {
      opcionP.textContent = `Opción seleccionada: ${opcion}`;
    }
  }
  
  function mostrarBotonComentario(plato) {
    const platosConComentario = [5, 6]; // IDs del Filete y el Salmón
    if (platosConComentario.includes(plato.id)) {
      const comentarioSeleccionado = seleccionados[plato.id]?.comentario || '';
      return `
        <button onclick="agregarComentario(${plato.id})">Agregar comentario</button>
        <p id="comentario-${plato.id}" class="comentario">${comentarioSeleccionado}</p>
      `;
    } else {
      return ''; // No mostrar el botón para otros platos
    }
  }
  
  function finalizarPedido() {
    // Construir el pedido con los platos seleccionados
    pedido.platos = [];
    for (const idPlato in seleccionados) {
      const cantidad = seleccionados[idPlato].cantidad;
      if (cantidad > 0) {
        let platoEncontrado = null;
        let categoriaEncontrada = '';
        // Buscar el plato en el menú
        for (const categoria in menuData) {
          const plato = menuData[categoria].find(p => p.id == idPlato);
          if (plato) {
            platoEncontrado = { ...plato };
            categoriaEncontrada = categoria;
            break;
          }
        }
        if (platoEncontrado) {
          const comentario = seleccionados[idPlato].comentario || '';
          let precioPlato = platoEncontrado.precio;
          if (platoEncontrado.opciones) {
            const opcionSeleccionada = seleccionados[idPlato].opcionSeleccionada;
            if (opcionSeleccionada && platoEncontrado.opciones.includes(opcionSeleccionada)) {
              precioPlato = platoEncontrado.precio[opcionSeleccionada];
              platoEncontrado.nombre += ` (${opcionSeleccionada})`;
            } else {
              alert(`Debes seleccionar una opción para ${platoEncontrado.nombre}.`);
              return; // Salir si no se ha seleccionado una opción
            }
          }
          pedido.platos.push({
            id: platoEncontrado.id,
            nombre: platoEncontrado.nombre,
            cantidad: cantidad,
            precio: precioPlato,
            comentario: comentario
          });
        }
      }
    }
  
    if (pedido.platos.length === 0) {
      alert('No ha seleccionado ningún plato.');
      return;
    }
  
    // Calcular el precio total
    let total = 0;
    let resumen = '';
    pedido.platos.forEach(plato => {
      total += plato.precio * plato.cantidad;
      resumen += `${plato.nombre} x${plato.cantidad} - €${(plato.precio * plato.cantidad).toFixed(2)}\n`;
      if (plato.comentario) {
        resumen += `Comentario: ${plato.comentario}\n`;
      }
    });
    resumen += `\nTotal: €${total.toFixed(2)}\nFecha: ${pedido.fecha}`;
  
    // Mostrar resumen
    alert(`Muchas gracias por realizar el pedido, en pocos minutos, podrás disfrutar de la comida.\n\nResumen del pedido:\n${resumen}`);
  
    // Enviar el pedido al servidor
    fetch('/pedido', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pedido)
    })
      .then(response => {
        if (!response.ok) {
          // Si la respuesta no es OK, verificar el código de estado
          if (response.status === 403) {
            return response.json().then(data => {
              alert(`Lo sentimos, pero en estos momentos la mesa ${pedido.mesa} está deshabilitada u ocupada. Espere a que se libere o si tiene cualquier duda consulte con el personal de la barra. ¡Muchas gracias!`);
            });
          } else {
            // Otro error
            throw new Error('Error en la solicitud');
          }
        }
        return response.json();
      })
      .then(data => {
        if (data && data.mensaje === 'Pedido recibido') {
          // Reiniciar el pedido
          pedido = {
            mesa: obtenerNumeroDeMesa(),
            platos: [],
            fecha: new Date().toLocaleString()
          };
          seleccionados = {};
          volverAInicio();
          // Limpiar cantidades y comentarios
          document.querySelectorAll('.plato').forEach(platoDiv => {
            platoDiv.querySelector('span[id^="cantidad-"]').textContent = '0';
            const comentarioP = platoDiv.querySelector('p.comentario');
            if (comentarioP) comentarioP.textContent = '';
          });
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Ocurrió un error al enviar el pedido. Por favor, inténtelo de nuevo.');
      });
  }
  
  // Al cargar la página, verificar el estado de la mesa
  window.onload = function() {
    verificarEstadoMesa();
  };
  