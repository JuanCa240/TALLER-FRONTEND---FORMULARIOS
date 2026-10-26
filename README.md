# Taller: Formularios con validaciones

Formulario de registro de usuario hecho solo con HTML, CSS y JavaScript (sin librerías ni frameworks).

## Estructura

```
registro/
├── index.html        Formulario final (niveles 2 a 5)
├── estilos.css
├── app.js            Eventos, errores en pantalla, correo asíncrono, teléfonos, envío con fetch
├── validaciones.js   Módulo con todas las reglas (funciones puras)
├── nativo/           Nivel 1: validación solo con HTML, sin JavaScript
└── README.md
```

## Cómo ejecutarlo

`app.js` usa módulos de JavaScript, que no funcionan abriendo el archivo con doble clic. Abre la carpeta en VS Code y usa **Live Server** sobre `index.html`. La versión `nativo/index.html` no necesita servidor.

---

## Nivel 1 · HTML puro con validación nativa

**¿Qué pasa si borras el atributo `name` de un campo y envías? ¿Por qué?**

Ese campo no viaja en la petición. Al enviar, el navegador arma el cuerpo con pares `name=valor` y deja fuera los controles que no tienen `name`. El `id` sirve para enlazar la etiqueta (`for`) y para el JavaScript, pero no para el envío. Se puede comprobar en DevTools › Red: el campo sin `name` desaparece del cuerpo.

**La expresión de la contraseña: `(?=.*[A-Za-z])(?=.*\d).{8,}`**

- `(?=.*[A-Za-z])`: mirada hacia adelante que exige que, en algún punto del texto, haya al menos una letra. No consume caracteres.
- `(?=.*\d)`: lo mismo, pero exige al menos un dígito.
- `.{8,}`: ahora sí consume el texto: 8 o más caracteres cualquiera.

Como las dos miradas se comprueban desde el inicio y no consumen texto, el orden de letras y números no importa. En el atributo `pattern`, el navegador exige que toda la cadena cumpla la expresión.

## Nivel 2 · Estilos de error y mensajes propios

**Cambia `:user-invalid` por `:invalid`: ¿cuál es la diferencia y cuál es mejor?**

`:invalid` se aplica en cuanto el campo es inválido, incluso al cargar la página: todos los campos `required` vacíos aparecen en rojo antes de que la persona haya escrito nada. `:user-invalid` espera a que la persona interactúe con el campo (por ejemplo, al salir de él o al intentar enviar). Es mejor `:user-invalid`: no regaña al usuario antes de tiempo y solo muestra el error cuando ya tiene sentido corregirlo.

> En la versión final (`index.html`) el marcado de error se hace con `[aria-invalid="true"]`, como pide el nivel 4. `:user-invalid` se usa en `nativo/`.

## Nivel 3 · Envío con fetch + FormData

**¿Por qué se escucha `submit` en el formulario y no `click` en el botón?**

El evento `submit` se dispara por cualquier forma de enviar: clic en el botón, tecla Enter dentro de un campo o envío por código. Un `click` en el botón solo cubre la primera. Si se escuchara `click`, enviar con Enter se saltaría la validación y el `preventDefault()`, y el formulario recargaría la página.

**Error simulado (URL `/no-existe`)**

La respuesta llega con estado 404. Como `fetch` solo falla con errores de red, el código revisa `res.ok` y lanza un error propio para entrar al `catch`. La persona ve «No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.», el botón se reactiva y los datos siguen en el formulario.

## Nivel 4 · Validación avanzada en JavaScript puro

**¿Qué ventaja tiene que las reglas sean funciones puras?**

Una función pura solo depende de lo que recibe y no toca el DOM ni el servidor. Por eso se puede reutilizar en cualquier formulario, probar con un simple `console.log` o una prueba automática sin abrir una página, y combinar (`[requerido(), longitud(3, 60)]`) sin efectos secundarios inesperados. Además, la misma lógica se podría ejecutar en el backend.

**¿Por qué «el correo ya existe» no se puede hacer solo con atributos HTML?**

Los atributos HTML solo conocen el valor de ese campo y reglas fijas (obligatorio, formato, rango). Saber si un correo ya está registrado exige consultar datos que están en el servidor, y eso requiere código que pregunte (fetch), espere la respuesta y muestre el resultado.

## Nivel 5 · Seguridad y usabilidad

### Parte A · La validación del frontend no es seguridad

**Qué demuestra:** que todo lo que se valida en el navegador se puede saltar. Con DevTools se borran `min` y `max`, y con `fetch` desde la consola se envía una petición directa sin pasar por el formulario. El servidor recibe lo que llegue.

**Resultado de mis pruebas** (completar con lo observado):

- Edad 5 sin `min`/`max`: _¿llegó al servidor? ¿qué respondió?_
- `fetch` desde la consola con `email: 'no-es-correo'` y `edad: -3`: _¿qué respondió?_

**Qué debe hacer el backend:**

1. Revalidar todo con el mismo esquema de reglas, sin confiar en el frontend.
2. Usar **consultas parametrizadas**: el texto SQL y los datos viajan por separado. El motor de base de datos recibe primero la consulta con marcadores (`SELECT * FROM usuarios WHERE email = ?`) y después los valores, que trata siempre como datos, nunca como código. Así, un texto como `' OR '1'='1` se busca literalmente como un correo raro y no cambia la consulta. Por eso la validación del navegador no protege contra SQL injection: la defensa está en cómo el servidor arma la consulta.

### Parte B · Mostrar datos sin abrir la puerta a XSS

- Con `innerHTML`, escribir `<b>Ana</b>` como nombre hace que el navegador interprete el texto como HTML: «Ana» aparece en negrita. Si en vez de `<b>` se escribiera una etiqueta con código, ese código se ejecutaría en el navegador de quien vea la página (XSS).
- Con `textContent`, el texto se muestra tal cual: se ve `<b>Ana</b>` con las etiquetas visibles y nada se interpreta.

**Revisión del código:** el único `innerHTML` está en la creación de las filas de teléfono (`app.js`) y solo interpola `${id}`, que genera el propio código. El saludo del registro usa `textContent`.

### Parte C · Prueba de usabilidad con un compañero

> Completar con las observaciones reales de la prueba (con ratón y solo con teclado) y las correcciones aplicadas. Al menos dos.

| Observación | Campo | Problema | Corrección aplicada |
|-------------|-------|----------|---------------------|
| 1 |  |  |  |
| 2 |  |  |  |

---

## Lista de verificación de entrega

- [ ] Carpeta `registro/` con `index.html`, `estilos.css`, `app.js` y `validaciones.js`.
- [ ] Ninguna librería ni framework.
- [ ] README con la tabla de usabilidad y las respuestas de cada nivel.
- [ ] Enlace al repositorio enviado antes del plazo.
