// app.js
import { reglas, validarCampo, validarFormulario, validarTelefono } from './validaciones.js';

const form = document.querySelector('#registro');
const boton = form.querySelector('button[type="submit"]');
const mensaje = document.querySelector('#mensaje');
const saludo = document.querySelector('#saludo');
const lista = document.querySelector('#telefonos');
const btnAgregar = document.querySelector('#agregar-telefono');
const MAX_TELEFONOS = 3;

const leerDatos = () => Object.fromEntries(new FormData(form));

/* ---------- Mostrar errores ---------- */

// Cada campo tiene un <p id="{id}-error"> enlazado con aria-describedby
function pintar(campo, texto, { invalido = Boolean(texto) } = {}) {
  const error = document.getElementById(`${campo.id}-error`);
  campo.setAttribute('aria-invalid', invalido ? 'true' : 'false');
  if (error) error.textContent = texto ?? '';
}

const mostrarError = (nombre, texto) => pintar(form.elements[nombre], texto);

/* ---------- Correo: validación asíncrona ---------- */

// Simula al servidor: estos correos ya están registrados
const registrados = ['ana@mail.com', 'admin@mail.com'];
const MSG_COMPROBANDO = 'Comprobando disponibilidad…';
const MSG_OCUPADO = 'Este correo ya tiene una cuenta. ¿Quieres iniciar sesión?';
let correoOcupado = null; // último correo que el "servidor" dijo que ya existe

const correoDisponible = (email) =>
  new Promise((ok) => setTimeout(() => ok(!registrados.includes(email.toLowerCase())), 600));

function debounce(fn, ms) {
  let espera;
  return (...args) => {
    clearTimeout(espera);
    espera = setTimeout(() => fn(...args), ms);
  };
}

// Reglas del módulo + el resultado de la consulta asíncrona
function errorDeCampo(nombre, datos) {
  const error = validarCampo(nombre, datos);
  if (!error && nombre === 'email' && correoOcupado === datos.email.toLowerCase()) {
    return MSG_OCUPADO;
  }
  return error;
}

const revisarCorreo = debounce(async (email) => {
  console.log('Comprobando correo:', email); // se ejecuta una sola vez al dejar de escribir
  const campo = form.elements.email;
  if (validarCampo('email', { email })) { // primero el formato
    const error = document.getElementById('email-error');
    if (error.textContent === MSG_COMPROBANDO) error.textContent = '';
    return;
  }
  pintar(campo, MSG_COMPROBANDO, { invalido: false });
  const libre = await correoDisponible(email);
  if (campo.value !== email) return; // la persona siguió escribiendo: otra comprobación viene en camino
  if (libre) {
    correoOcupado = null;
    pintar(campo, null);
  } else {
    correoOcupado = email.toLowerCase();
    pintar(campo, MSG_OCUPADO);
  }
}, 500);

form.elements.email.addEventListener('input', (e) => revisarCorreo(e.target.value));

/* ---------- Validar al salir del campo y al corregir ---------- */

function revalidar(campo) {
  if (!campo.name) return;
  if (campo.name === 'telefono') {
    pintar(campo, validarTelefono(campo.value));
    return;
  }
  const datos = leerDatos();
  mostrarError(campo.name, errorDeCampo(campo.name, datos));
  // Si cambió la contraseña y ya hay confirmación, se vuelve a comparar
  if (campo.name === 'password' && datos.confirmar) {
    mostrarError('confirmar', validarCampo('confirmar', datos));
  }
}

// Al salir del campo (focusout), no a cada tecla
form.addEventListener('focusout', (e) => revalidar(e.target));

// Si el campo ya estaba en error, se actualiza mientras la persona lo corrige
const siEstabaMal = (e) => {
  if (e.target.getAttribute('aria-invalid') === 'true') revalidar(e.target);
};
form.addEventListener('input', siEstabaMal);
form.addEventListener('change', siEstabaMal);

/* ---------- Teléfonos dinámicos ---------- */

let contadorTelefonos = 0; // ids únicos aunque se quiten filas

function renumerarTelefonos() {
  [...lista.children].forEach((fila, i) => {
    fila.querySelector('label').textContent = `Teléfono ${i + 1}`;
    fila.querySelector('.quitar').setAttribute('aria-label', `Quitar teléfono ${i + 1}`);
  });
  btnAgregar.disabled = lista.children.length >= MAX_TELEFONOS;
}

btnAgregar.addEventListener('click', () => {
  if (lista.children.length >= MAX_TELEFONOS) return;
  const id = `tel-${++contadorTelefonos}`;
  const fila = document.createElement('div');
  fila.className = 'telefono';
  // innerHTML es seguro aquí: el único dato interpolado (${id}) lo genera este código,
  // no lo escribe la persona. Nunca se usa innerHTML con texto del usuario (ver nivel 5).
  fila.innerHTML = `
    <label for="${id}">Teléfono</label>
    <div class="fila-input">
      <input id="${id}" name="telefono" type="tel" inputmode="tel"
             autocomplete="tel" aria-describedby="${id}-error">
      <button type="button" class="quitar">Quitar</button>
    </div>
    <p id="${id}-error" class="error" aria-live="polite"></p>`;
  lista.append(fila);
  renumerarTelefonos();
  fila.querySelector('input').focus();
});

// Delegación de eventos: un solo listener para todos los botones «Quitar»
lista.addEventListener('click', (e) => {
  if (!e.target.matches('.quitar')) return;
  e.target.closest('.telefono').remove();
  renumerarTelefonos();
  btnAgregar.focus();
});

/* ---------- Envío ---------- */

function limpiarFormulario() {
  form.reset();
  lista.replaceChildren();
  btnAgregar.disabled = false;
  correoOcupado = null;
  for (const nombre of Object.keys(reglas)) mostrarError(nombre, null);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensaje.textContent = '';
  mensaje.className = '';
  saludo.textContent = '';

  // 1. Validar todo y mostrar todos los errores
  const datos = leerDatos();
  const errores = validarFormulario(datos);
  if (!errores.email && correoOcupado === datos.email.toLowerCase()) errores.email = MSG_OCUPADO;
  for (const nombre of Object.keys(reglas)) mostrarError(nombre, errores[nombre]);
  for (const tel of form.querySelectorAll('[name="telefono"]')) {
    pintar(tel, validarTelefono(tel.value));
  }

  // 2. Llevar el foco al primer campo con error
  const primero = form.querySelector('[aria-invalid="true"]');
  if (primero) {
    primero.focus();
    return;
  }

  // 3. Enviar sin recargar y bloquear el doble envío
  boton.disabled = true;
  boton.textContent = 'Enviando…';
  try {
    // El correo se revisa otra vez justo antes de enviar
    const libre = await correoDisponible(datos.email);
    if (!libre) {
      correoOcupado = datos.email.toLowerCase();
      mostrarError('email', MSG_OCUPADO);
      form.elements.email.focus();
      return;
    }

    const fd = new FormData(form);
    const cuerpo = Object.fromEntries(fd);
    cuerpo.telefono = fd.getAll('telefono'); // varios campos con el mismo name
    delete cuerpo.confirmar;                 // la confirmación no se envía

    const res = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); // fetch no falla con 404 o 500
    const creado = await res.json();

    mensaje.textContent = `¡Cuenta creada! Id: ${creado.id}`;
    mensaje.className = 'ok';
    // textContent muestra el texto tal cual: <b>Ana</b> no se interpreta como HTML
    saludo.textContent = `Hola, ${cuerpo.nombre}`;
    limpiarFormulario();
  } catch (err) {
    console.error('Error al enviar el formulario:', err);
    mensaje.textContent = 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.';
    mensaje.className = 'fallo';
    // Los datos escritos se conservan para que la persona reintente
  } finally {
    boton.disabled = false;
    boton.textContent = 'Crear cuenta';
  }
});
