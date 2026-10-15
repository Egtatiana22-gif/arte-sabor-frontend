import { useState } from 'react';
import './App.css';

// API del backend Java de Arte y Sabor.
const API_URL = 'http://localhost:8080/arte-y-sabor-api/reservas';

// Horarios originales de Arte y Sabor.
const HORARIOS = [
  { valor: '07:00', texto: '7:00 a. m.' },
  { valor: '09:00', texto: '9:00 a. m.' },
  { valor: '11:00', texto: '11:00 a. m.' },
  { valor: '14:00', texto: '2:00 p. m.' },
  { valor: '16:00', texto: '4:00 p. m.' },
  { valor: '17:00', texto: '5:00 p. m.' },
];

const HORARIOS_LIMITADOS = [
  { valor: '09:00', texto: '9:00 a. m.' },
  { valor: '11:00', texto: '11:00 a. m.' },
  { valor: '14:00', texto: '2:00 p. m.' },
  { valor: '16:00', texto: '4:00 p. m.' },
];
// Experiencias disponibles en el formulario.
const EXPERIENCIAS = [
  { valor: 'Mesa / Café + Lectura', texto: '☕ Mesa / Café + Lectura' },
  { valor: 'Taller de Crochet', texto: '🧶 Taller de Crochet' },
  { valor: 'Taller de Pintura', texto: '🎨 Taller de Pintura' },
  { valor: 'Creación de Pulseras', texto: '✨ Creación de Pulseras' },
  {
    valor: 'Experiencia con nuestro café y comida',
    texto: '☕ Experiencia con café y comida',
  },
  { valor: 'Club de Lectura', texto: '📖 Club de Lectura' },
  { valor: 'Celebración / Evento', texto: '🎉 Celebración / Evento' },
  { valor: 'Otra', texto: '💬 Otra experiencia' },
];

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Obtiene una fecha local en formato YYYY-MM-DD.
function obtenerFechaLocal(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

// Convierte la fecha a un texto legible para el usuario.
function formatearFecha(fecha) {
  if (!fecha) return 'Sin seleccionar';

  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function esFechaDisponible(fecha) {
  if (!fecha) return false;

  const seleccionada = new Date(`${fecha}T12:00:00`);
  const hoy = obtenerFechaLocal();

  // No permite fechas pasadas ni domingos.
  return fecha >= hoy && seleccionada.getDay() !== 0;
}

// Los sábados tienen disponibilidad limitada.
function esFechaLimitada(fecha) {
  if (!fecha) return false;

  const diaSemana = new Date(`${fecha}T12:00:00`).getDay();

  return diaSemana === 6;
}

// Comprueba que la hora elegida todavía esté disponible si la fecha es hoy.
function esHoraPasada(fecha, hora) {
  if (fecha !== obtenerFechaLocal()) return false;

  const [horas, minutos] = hora.split(':').map(Number);
  const ahora = new Date();

  return horas * 60 + minutos <= ahora.getHours() * 60 + ahora.getMinutes();
}

function App() {
  const ahora = new Date();

  const [mesVisible, setMesVisible] = useState(
    new Date(ahora.getFullYear(), ahora.getMonth(), 1),
  );

  const [formulario, setFormulario] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    personas: '',
    fecha: '',
    hora: '',
    experiencia: '',
    otraExperiencia: '',
    mensaje: '',
  });

  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState({ tipo: '', mensaje: '' });
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [modalGestion, setModalGestion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [reservaGuardada, setReservaGuardada] = useState(false);

  function manejarCambio(evento) {
  const { name } = evento.target;
  let { value } = evento.target;

  if (name === 'nombre') {
    value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]/g, '');
  }

  if (name === 'telefono') {
    value = value.replace(/\D/g, '').slice(0, 10);
  }

  setFormulario((anterior) => ({
    ...anterior,
    [name]: value,
    ...(name === 'fecha' ? { hora: '' } : {}),
    ...(name === 'experiencia' && value !== 'Otra'
      ? { otraExperiencia: '' }
      : {}),
  }));

  setErrores((anteriores) => ({
    ...anteriores,
    [name]: '',
    ...(name === 'fecha' ? { hora: '' } : {}),
    ...(name === 'experiencia' ? { otraExperiencia: '' } : {}),
  }));

  setEstado({ tipo: '', mensaje: '' });
}
  // Cambia el mes del calendario.
  function cambiarMes(direccion) {
    setMesVisible((anterior) => {
      const siguiente = new Date(
        anterior.getFullYear(),
        anterior.getMonth() + direccion,
        1,
      );

      const inicioMesActual = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        1,
      );

      if (siguiente < inicioMesActual) return anterior;

      return siguiente;
    });
  }

  // Selecciona una fecha desde el calendario.
  function seleccionarFecha(fecha) {
    if (!esFechaDisponible(fecha)) return;

    setFormulario((anterior) => ({
      ...anterior,
      fecha,
      hora: '',
    }));

    setErrores((anteriores) => ({
      ...anteriores,
      fecha: '',
      hora: '',
    }));

    setEstado({ tipo: '', mensaje: '' });
  }

  // Genera los días del mes y las celdas vacías iniciales.
  function obtenerDiasCalendario() {
    const anio = mesVisible.getFullYear();
    const mes = mesVisible.getMonth();
    const primerDia = new Date(anio, mes, 1).getDay();
    const cantidadDias = new Date(anio, mes + 1, 0).getDate();

    return [
      ...Array(primerDia).fill(null),
      ...Array.from({ length: cantidadDias }, (_, indice) => {
        const dia = indice + 1;
        const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        return {
          dia,
          fecha,
          disponible: esFechaDisponible(fecha),
        };
      }),
    ];
  }

  // Valida los campos antes de mostrar el resumen de la reserva.
  function validarFormulario() {
    const nuevosErrores = {};

    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = 'Escribe tu nombre completo.';
    } else if (formulario.nombre.trim().length > 80) {
      nuevosErrores.nombre = 'El nombre no puede superar los 80 caracteres.';
    }

    if (!/^3\d{9}$/.test(formulario.telefono.trim())) {
      nuevosErrores.telefono = 'Ingresa un celular colombiano de 10 dígitos que empiece por 3.';
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo.trim())
    ) {
      nuevosErrores.correo = 'Ingresa un correo electrónico válido.';
    }

    if (!formulario.personas) {
      nuevosErrores.personas = 'Selecciona el número de personas.';
    }

    if (!formulario.fecha) {
      nuevosErrores.fecha = 'Selecciona una fecha en el calendario.';
    } else if (!esFechaDisponible(formulario.fecha)) {
      nuevosErrores.fecha = 'Selecciona una fecha futura disponible, de lunes a sábado.';
    }

    if (!formulario.hora) {
      nuevosErrores.hora = 'Selecciona un horario.';
    } else if (esHoraPasada(formulario.fecha, formulario.hora)) {
      nuevosErrores.hora = 'Selecciona una hora posterior a la actual.';
    }

    if (!formulario.experiencia) {
      nuevosErrores.experiencia = 'Selecciona el tipo de experiencia.';
    }

    if (
      formulario.experiencia === 'Otra' &&
      !formulario.otraExperiencia.trim()
    ) {
      nuevosErrores.otraExperiencia = 'Describe brevemente tu experiencia.';
    }

    if (formulario.mensaje.length > 3000) {
      nuevosErrores.mensaje = 'El mensaje no puede superar los 3000 caracteres.';
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  }

  // Abre el resumen para que la persona revise los datos antes de guardar.
  function manejarEnvio(evento) {
    evento.preventDefault();
    setEstado({ tipo: '', mensaje: '' });

    if (!validarFormulario()) {
      setEstado({
        tipo: 'error',
        mensaje: 'Revisa los campos señalados antes de continuar.',
      });
      return;
    }

    setModalConfirmacion(true);
  }

  // Guarda la reserva mediante el endpoint existente del backend Java.
  async function confirmarReserva() {
    if (guardando) return;

    setGuardando(true);
    setEstado({ tipo: '', mensaje: '' });

    const datos = new URLSearchParams();

    datos.append('nombre', formulario.nombre.trim());
    datos.append('telefono', formulario.telefono.trim());
    datos.append('correo', formulario.correo.trim());
    datos.append('personas', formulario.personas);
    datos.append('fecha', formulario.fecha);
    datos.append('hora', formulario.hora);

    const experiencia =
      formulario.experiencia === 'Otra'
        ? `Otra: ${formulario.otraExperiencia.trim()}`
        : formulario.experiencia;

    datos.append('experiencia', experiencia);
    datos.append('mensaje', formulario.mensaje.trim());

    try {
      const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: datos.toString(),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok || resultado.creada !== true) {
        throw new Error(
          resultado.mensaje || 'No fue posible registrar la reserva.',
        );
      }

      setReservaGuardada(true);
      setEstado({
        tipo: 'exito',
        mensaje: resultado.mensaje || '¡Tu reserva fue confirmada correctamente!',
      });
    } catch (error) {
      setEstado({
        tipo: 'error',
        mensaje:
          error.message ||
          'No fue posible conectar con el servidor. Comprueba que el backend esté activo.',
      });
    } finally {
      setGuardando(false);
    }
  }

  // Limpia el formulario después de terminar la reserva.
  function reiniciarFormulario() {
    setFormulario({
      nombre: '',
      telefono: '',
      correo: '',
      personas: '',
      fecha: '',
      hora: '',
      experiencia: '',
      otraExperiencia: '',
      mensaje: '',
    });

    setErrores({});
    setEstado({ tipo: '', mensaje: '' });
    setReservaGuardada(false);
    setModalConfirmacion(false);
    setMesVisible(new Date(ahora.getFullYear(), ahora.getMonth(), 1));
  }

  const diasCalendario = obtenerDiasCalendario();

  return (
    <main className="pagina-reservas" id="inicio">
      <header className="encabezado">
        <a className="marca" href="#inicio" aria-label="Arte y Sabor, inicio">
          <span className="marca-icono" aria-hidden="true">☕</span>
          <span>
            <strong>Arte y Sabor</strong>
            <small>Cafetería artesanal</small>
          </span>
        </a>

        <nav aria-label="Navegación principal">
          <a href="#inicio">Inicio</a>
          <a href="#reservacion" className="enlace-activo">Reservaciones</a>
          <a href="#experiencias">Experiencias</a>
          <a href="#informacion">Información</a>
        </nav>
      </header>

      <section className="portada">
        <div className="portada-contenido">
          <span className="etiqueta">ARTE Y SABOR</span>
          <h1>Reserva tu momento</h1>
          <p>
            Elige el día, el horario y la experiencia que quieres
            disfrutar con nosotros.
          </p>
          <a href="#reservacion" className="boton-portada">
            Reservar mi momento
          </a>
        </div>

        <div className="portada-decoracion" aria-hidden="true">
          <span>☕</span>
          <p>Un momento para ti</p>
        </div>
      </section>

      <section className="seccion-reservas" id="reservacion">
        <div className="introduccion">
          <span className="etiqueta">TE ESTAMOS ESPERANDO</span>
          <h2>Prepara tu experiencia</h2>
          <p>
            Selecciona una fecha disponible y completa los datos
            para preparar tu visita a Arte y Sabor.
          </p>
        </div>

        {estado.mensaje && (
          <p
            className={`mensaje mensaje-${estado.tipo}`}
            role="status"
            aria-live="polite"
          >
            {estado.mensaje}
          </p>
        )}

        <div className="reserva-principal">
          <section className="calendario-contenedor" aria-labelledby="titulo-calendario">
            <div className="titulo-reserva">
              <span>01</span>
              <div>
                <h3 id="titulo-calendario">Elige tu fecha</h3>
                <p>Selecciona un día disponible para tu reserva.</p>
              </div>
            </div>

            <div className="calendario">
              <div className="calendario-header">
                <button
                  type="button"
                  className="btn-mes"
                  aria-label="Mes anterior"
                  onClick={() => cambiarMes(-1)}
                  disabled={
                    mesVisible.getFullYear() === ahora.getFullYear() &&
                    mesVisible.getMonth() === ahora.getMonth()
                  }
                >
                  ‹
                </button>

                <h4>
                  {MESES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
                </h4>

                <button
                  type="button"
                  className="btn-mes"
                  aria-label="Mes siguiente"
                  onClick={() => cambiarMes(1)}
                >
                  ›
                </button>
              </div>

              <div className="dias-semana">
                {DIAS_SEMANA.map((dia, indice) => (
                  <span key={`${dia}-${indice}`}>{dia}</span>
                ))}
              </div>

              <div className="dias-calendario">
                {diasCalendario.map((dia, indice) => {
                  if (!dia) {
                    return <span className="dia-vacio" key={`vacio-${indice}`} />;
                  }

                  const seleccionado = formulario.fecha === dia.fecha;

                  return (
                    <button
                      type="button"
                      key={dia.fecha}
                      className={[
                        'dia-calendario',
                        dia.disponible ? 'disponible' : 'bloqueado',
                        seleccionado ? 'seleccionado' : '',
                      ].filter(Boolean).join(' ')}
                      disabled={!dia.disponible}
                      onClick={() => seleccionarFecha(dia.fecha)}
                      aria-label={`${dia.dia} de ${MESES[mesVisible.getMonth()]}`}
                      aria-pressed={seleccionado}
                    >
                      {dia.dia}
                    </button>
                  );
                })}
              </div>

              <div className="leyenda-calendario">
                <span><i className="punto disponible" /> Disponible</span>
                <span><i className="punto bloqueado" /> No disponible</span>
              </div>

              {formulario.fecha && (
                <p className="fecha-seleccionada">
                  Fecha elegida: <strong>{formatearFecha(formulario.fecha)}</strong>
                </p>
              )}

              {errores.fecha && <small className="error">{errores.fecha}</small>}
            </div>

            <div className="nota-calendario">
              <span aria-hidden="true">🕐</span>
              <p>Atendemos de lunes a sábado, de 7:00 a. m. a 5:00 p. m.</p>
            </div>
          </section>

          <section className="formulario-contenedor" aria-labelledby="titulo-formulario">
            <div className="titulo-reserva">
              <span>02</span>
              <div>
                <h3 id="titulo-formulario">Cuéntanos sobre tu reserva</h3>
                <p>Completa los datos para preparar tu experiencia.</p>
              </div>
            </div>

            <form className="formulario" onSubmit={manejarEnvio} noValidate>
              <div className="campos">
                <div className="campo">
                  <label htmlFor="nombre">Nombre completo *</label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    maxLength={80}
                    autoComplete="name"
                    placeholder="Tu nombre"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    aria-invalid={Boolean(errores.nombre)}
                    required
                  />
                  {errores.nombre && <small className="error">{errores.nombre}</small>}
                </div>

                <div className="campo">
                  <label htmlFor="telefono">Teléfono *</label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel"
                    placeholder="3000000000"
                    value={formulario.telefono}
                    onChange={manejarCambio}
                    aria-invalid={Boolean(errores.telefono)}
                    required
                  />
                  {errores.telefono && <small className="error">{errores.telefono}</small>}
                </div>

                <div className="campo">
                  <label htmlFor="correo">Correo electrónico *</label>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    maxLength={120}
                    autoComplete="email"
                    placeholder="tucorreo@email.com"
                    value={formulario.correo}
                    onChange={manejarCambio}
                    aria-invalid={Boolean(errores.correo)}
                    required
                  />
                  {errores.correo && <small className="error">{errores.correo}</small>}
                </div>

                <div className="campo">
                  <label htmlFor="personas">Número de personas *</label>
                  <select
                    id="personas"
                    name="personas"
                    value={formulario.personas}
                    onChange={manejarCambio}
                    aria-invalid={Boolean(errores.personas)}
                    required
                  >
                    <option value="">Selecciona</option>
                    {Array.from({ length: 10 }, (_, indice) => indice + 1).map((cantidad) => (
                      <option key={cantidad} value={cantidad}>
                        {cantidad} {cantidad === 1 ? 'persona' : 'personas'}
                      </option>
                    ))}
                    <option value="mas-de-10">Más de 10 personas</option>
                  </select>
                  {errores.personas && <small className="error">{errores.personas}</small>}
                </div>

                <div className="campo campo-completo">
                  <label htmlFor="hora">Horario *</label>
                  {!formulario.fecha ? (
                    <p className="mensaje-horarios">Selecciona primero una fecha en el calendario.</p>
                  ) : (
                    <div className="horarios">
                  {(esFechaLimitada(formulario.fecha)
                    ? HORARIOS_LIMITADOS
                    : HORARIOS
                  ).map((hora) => {
                    const deshabilitada = esHoraPasada(
                      formulario.fecha,
                      hora.valor,
                    );

                    return (
                      <button
                        type="button"
                        key={hora.valor}
                        className={`horario ${
                          formulario.hora === hora.valor
                            ? 'horario-seleccionado'
                            : ''
                        }`}
                        disabled={deshabilitada}
                        onClick={() => {
                          setFormulario((anterior) => ({
                            ...anterior,
                            hora: hora.valor,
                          }));

                          setErrores((anteriores) => ({
                            ...anteriores,
                            hora: '',
                          }));
                        }}
                      >
                        {hora.texto}
                      </button>
                    );
                  })}
                </div>
                  )}
                  {errores.hora && <small className="error">{errores.hora}</small>}
                </div>

                <div className="campo campo-completo">
                  <label htmlFor="experiencia">Tipo de experiencia *</label>
                  <select
                    id="experiencia"
                    name="experiencia"
                    value={formulario.experiencia}
                    onChange={manejarCambio}
                    aria-invalid={Boolean(errores.experiencia)}
                    required
                  >
                    <option value="">Selecciona una experiencia</option>
                    {EXPERIENCIAS.map((experiencia) => (
                      <option key={experiencia.valor} value={experiencia.valor}>
                        {experiencia.texto}
                      </option>
                    ))}
                  </select>
                  {errores.experiencia && <small className="error">{errores.experiencia}</small>}
                </div>

                {formulario.experiencia === 'Otra' && (
                  <div className="campo campo-completo">
                    <label htmlFor="otraExperiencia">Cuéntanos qué tienes en mente *</label>
                    <input
                      id="otraExperiencia"
                      name="otraExperiencia"
                      type="text"
                      maxLength={500}
                      placeholder="Describe brevemente tu idea"
                      value={formulario.otraExperiencia}
                      onChange={manejarCambio}
                      aria-invalid={Boolean(errores.otraExperiencia)}
                      required
                    />
                    {errores.otraExperiencia && (
                      <small className="error">{errores.otraExperiencia}</small>
                    )}
                  </div>
                )}

                <div className="campo campo-completo">
                  <label htmlFor="mensaje">Mensaje adicional (opcional)</label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    rows={4}
                    maxLength={3000}
                    placeholder="¿Hay algo que debamos saber sobre tu reserva?"
                    value={formulario.mensaje}
                    onChange={manejarCambio}
                    aria-invalid={Boolean(errores.mensaje)}
                  />
                  {errores.mensaje && <small className="error">{errores.mensaje}</small>}
                </div>
              </div>

              <button className="boton-enviar" type="submit" disabled={guardando || reservaGuardada}>
                Revisar reservación <span aria-hidden="true">→</span>
              </button>

              <p className="nota-formulario">
                Verifica los datos antes de confirmar. Tu reserva se registra al finalizar la confirmación.
              </p>
            </form>
          </section>
        </div>
      </section>

      <section className="informacion-reserva" id="informacion">
        <article className="info-item">
          <span aria-hidden="true">☕</span>
          <div>
            <h3>Un momento para ti</h3>
            <p>Disfruta de un café, una conversación o una experiencia creativa.</p>
          </div>
        </article>
        <article className="info-item">
          <span aria-hidden="true">🕐</span>
          <div>
            <h3>Nuestro horario</h3>
            <p>Lunes a sábado, de 7:00 a. m. a 5:00 p. m.</p>
          </div>
        </article>
        <article className="info-item">
          <span aria-hidden="true">📍</span>
          <div>
            <h3>Estamos en Bogotá</h3>
            <p>Un espacio pensado para compartir, crear y disfrutar.</p>
          </div>
        </article>
      </section>

      <section className="tu-momento" id="experiencias">
        <div className="tu-momento-texto">
          <span className="etiqueta">ARTE Y SABOR</span>
          <h2>Tu momento, a tu manera</h2>
          <p>
            Una mesa para conversar, un taller para crear, un café para disfrutar
            o simplemente un espacio para hacer una pausa.
          </p>
        </div>

        <div className="momentos-grid">
          <article className="momento">
            <span aria-hidden="true">☕</span>
            <h3>Café</h3>
            <p>Disfruta nuestros sabores artesanales.</p>
          </article>
          <article className="momento">
            <span aria-hidden="true">🎨</span>
            <h3>Arte</h3>
            <p>Dale espacio a tu creatividad.</p>
          </article>
          <article className="momento">
            <span aria-hidden="true">🧶</span>
            <h3>Creatividad</h3>
            <p>Aprende y crea algo nuevo.</p>
          </article>
          <article className="momento">
            <span aria-hidden="true">✨</span>
            <h3>Experiencias</h3>
            <p>Comparte momentos especiales.</p>
          </article>
        </div>
      </section>

      <footer className="pie">
        <h3>Arte y Sabor</h3>
        <p>
          Gracias por ser parte de este espacio donde el café, el arte y la creatividad se encuentran. ☕🧶
        </p>
        <p>📍 Bogotá, Colombia · 🕐 Lunes a sábado · 7:00 a. m. - 5:00 p. m.</p>
        <p>© {new Date().getFullYear()} Arte y Sabor · Todos los derechos reservados</p>
      </footer>

      {modalConfirmacion && (
        <div
          className="modal-fondo"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !guardando) {
              setModalConfirmacion(false);
            }
          }}
        >
          <section
            className="modal-contenido"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmacion"
          >
            <button
              type="button"
              className="modal-cerrar"
              aria-label="Cerrar"
              onClick={() => setModalConfirmacion(false)}
              disabled={guardando}
            >
              ×
            </button>

            <div className="modal-icono" aria-hidden="true">
              {reservaGuardada ? '✓' : '☕'}
            </div>

            <h2 id="titulo-confirmacion">
              {reservaGuardada ? '¡Reserva confirmada!' : 'Revisa tu reserva'}
            </h2>

            <p>
              {reservaGuardada
                ? 'Tu solicitud se registró correctamente en Arte y Sabor.'
                : 'Verifica que los datos estén correctos antes de confirmar.'}
            </p>

            <dl className="resumen-reserva">
              <div><dt>Nombre</dt><dd>{formulario.nombre}</dd></div>
              <div><dt>Teléfono</dt><dd>{formulario.telefono}</dd></div>
              <div><dt>Correo</dt><dd>{formulario.correo}</dd></div>
              <div><dt>Personas</dt><dd>{formulario.personas === 'mas-de-10' ? 'Más de 10' : formulario.personas}</dd></div>
              <div><dt>Fecha</dt><dd>{formatearFecha(formulario.fecha)}</dd></div>
              <div><dt>Hora</dt><dd>{formulario.hora}</dd></div>
              <div>
                <dt>Experiencia</dt>
                <dd>
                  {formulario.experiencia === 'Otra'
                    ? `Otra: ${formulario.otraExperiencia}`
                    : formulario.experiencia}
                </dd>
              </div>
              {formulario.mensaje && (
                <div><dt>Mensaje</dt><dd>{formulario.mensaje}</dd></div>
              )}
            </dl>

            {!reservaGuardada ? (
              <div className="botones-confirmacion">
                <button
                  type="button"
                  className="btn-modal-secundario"
                  onClick={() => setModalConfirmacion(false)}
                  disabled={guardando}
                >
                  Editar reserva
                </button>
                <button
                  type="button"
                  className="btn-modal-principal"
                  onClick={confirmarReserva}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Confirmar reserva'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-modal-principal"
                onClick={reiniciarFormulario}
              >
                Aceptar
              </button>
            )}
          </section>
        </div>
      )}

      {modalGestion && (
        <div className="modal-fondo" role="presentation" onMouseDown={(evento) => {
          if (evento.target === evento.currentTarget) setModalGestion(false);
        }}>
          <section
            className="modal-contenido modal-gestion"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-gestion"
          >
            <button
              type="button"
              className="modal-cerrar"
              aria-label="Cerrar"
              onClick={() => setModalGestion(false)}
            >
              ×
            </button>
            <div className="modal-icono" aria-hidden="true">☕</div>
            <h2 id="titulo-gestion">¿Necesitas gestionar tu reserva?</h2>
            <p>
              Puedes consultar, cancelar o modificar una reserva desde el módulo de gestión.
            </p>
            <button
              type="button"
              className="btn-modal-principal"
              onClick={() => {
                setModalGestion(false);
                setEstado({
                  tipo: 'error',
                  mensaje: 'El módulo de gestión de reservas todavía debe integrarse en esta versión de React.',
                });
                document.getElementById('reservacion')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Aceptar
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;