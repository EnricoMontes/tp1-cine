# SignalCine · Documentación técnica

Trabajo Práctico 1 de **Programación IV** (UTN FRA, comisión A342-2) · Enrico Montes.

Este documento explica **cómo está construido** el sistema: stack, arquitectura, base de datos y **por qué** se tomó cada decisión técnica. Qué hace el sistema (requerimientos, alcances y reglas de negocio) está en [FUNCIONAL.md](FUNCIONAL.md).

**Índice**
1. [Stack](#1-stack)
2. [Arquitectura del frontend](#2-arquitectura-del-frontend)
3. [Base de datos (Supabase)](#3-base-de-datos-supabase)
4. [Decisiones técnicas](#4-decisiones-técnicas)
5. [Recuperatorio: cómo se resolvió cada punto](#5-recuperatorio-cómo-se-resolvió-cada-punto)
6. [Deploy y PWA](#6-deploy-y-pwa)

---

## 1. Stack

| Parte | Tecnología | Por qué |
|---|---|---|
| Frontend | Angular 22.1 · TypeScript 6.0 | Es lo que se usa en la materia: componentes standalone, signals y control de flujo `@if` / `@for` |
| Base de datos | Supabase (PostgreSQL) | Pedido de la consigna. Al ser Postgres, las reglas importantes se pueden poner en la base (restricciones, funciones, RLS) |
| Autenticación | Supabase Auth | Mail y contraseña; la sesión queda guardada y sobrevive a un F5 |
| Archivos | Supabase Storage | Pósters de las películas (bucket `peliculas`) y fotos del candy (bucket `candy`) |
| Tiempo real | Supabase Realtime | Butacas ocupadas y notificaciones en vivo, sin recargar |
| Tareas programadas | `pg_cron` (extensión de Postgres) | Vencer los turnos de la lista de espera cada minuto |
| Hosting | Firebase Hosting | Visto en clase; sirve la app compilada con HTTPS |
| PWA | `@angular/pwa` (service worker + manifest) | Pedido de la consigna |
| Librerías | `qrcode` · `jspdf` · `xlsx` | QR de la entrada · PDF de la entrada y del reporte · Excel del reporte |

---

## 2. Arquitectura del frontend

### 2.1 Estructura de carpetas

```
src/app/
├── componentes/     una carpeta por pantalla o pieza de UI
├── servicios/       acceso a Supabase y estado compartido (signals)
├── guards/          protección de rutas
├── modelos/         interfaces de TypeScript (forma de los datos)
├── validadores/     validadores custom de formularios (registro, pago, fechas)
├── pipes/           pipes custom (filtro de películas, duración)
├── directivas/      directiva custom (appResaltar)
├── app.routes.ts    tabla de rutas
└── app.config.ts    providers (router, service worker)
```

Siguiendo la convención de la cátedra: componentes **standalone** (sin `NgModule`), archivos sin sufijo `.component` y nombres en español.

### 2.2 Rutas y componentes

Todas las rutas usan **lazy loading** (`loadComponent`): el código de cada pantalla se descarga recién cuando se entra.

| Ruta | Componente | Protección |
|---|---|---|
| `/` | `Home` → usa `CardPelicula` (hijo con `input()` / `output()`) | pública |
| `/cartelera`, `/candy` | `Cartelera`, `CandyBar` | pública |
| `/peliculas/:id` | `DetallePelicula` (funciones y reseñas) | pública |
| `/funciones/:id/entradas` | `ElegirEntradas` (paso 1: entradas, combos, candy y lista de espera si está agotada) | pública |
| `/funciones/:id/butacas` | `ElegirButacas` (paso 2) → usa `MapaButacas` | pública |
| `/checkout` | `Checkout` (paso 3: cupones, puntos, crédito y pago) | pública |
| `/registro` | `Registro` | `canDeactivate` |
| `/proponer` | `Proponer` | `canActivate` (logueado) |
| `/perfil` | `MiPerfil` (compras, notificaciones, listas de espera, películas vistas) | `canActivate` (logueado) |
| `/admin` → `peliculas`, `funciones`, `candy`, `cupones`, `reportes`, `propuestas`, `usuarios`, `roles`, `actividad` | `Admin` con rutas hijas | `canMatch` + `canActivateChild` (por sección) |
| `/empleado` y `/empleado/:codigo` (adonde lleva el QR) | `Empleado` | `canMatch` (rol empleado) |
| `**` | `Error` (404) | — |

**El login no tiene ruta.** Es un panel lateral (`LoginPanel`, que adentro usa el formulario `Login`) que se abre con el ícono de usuario desde cualquier pantalla. Su estado (`loginAbierto`) vive en el servicio `Auth`.

**Componentes reutilizados:**
- `MapaButacas`: recibe las butacas, las ocupadas y las elegidas por `input()` y avisa cuál se tocó con `output()`.
- `CardPelicula`: la tarjeta de película del home y la cartelera.
- `PasosCompra` y `CabeceraFuncion`: el indicador de pasos y la cabecera con el póster en los 3 pasos de la compra.

### 2.3 Servicios

| Servicio | Para qué |
|---|---|
| `Supabase` | crea **un solo** cliente de Supabase para toda la app |
| `Auth` | registro, login, logout. Guarda el usuario y su perfil (rol, rol del panel, puntos, crédito) en **signals**, y calcula las secciones del panel que puede usar |
| `Peliculas`, `Salas`, `Funciones` | consultas a cada tabla; `Funciones` también cancela funciones |
| `Compras` | compra, Mis compras, cancelación, validación de entradas y candy, y **suscripción en tiempo real** a las butacas vendidas |
| `Carrito` | estado de la compra en curso (función, cantidades, combos, candy, butacas), compartido entre los 3 pasos; también las reglas de preventa |
| `Cupones`, `Candy`, `Resenias`, `Alertas` | cupones, productos y combos, reseñas y alertas de estreno |
| `EntradaPdf` | genera el QR y el PDF de la entrada |
| `Actividades`, `Reportes`, `Usuarios` | log de actividad, reporte de ventas y usuarios (admin) |
| `Notificaciones` | la campanita: trae las notificaciones, **escucha las nuevas en tiempo real** y las muestra también como notificación del sistema |
| `Propuestas`, `Roles`, `ListaEspera` | los puntos del recuperatorio |

Los servicios usan `@Service()` e `inject()`. Los componentes reciben los servicios por el constructor, como en las clases.

### 2.4 Guards

| Guard | Tipo | Qué hace |
|---|---|---|
| `authGuard` | `canActivate` | si no está logueado, **abre el panel lateral de login** y guarda adónde quería ir; al ingresar lo lleva ahí |
| `adminGuard` | `canMatch` | entra el admin o quien tenga un rol del panel; si no, la ruta "no existe" y cae en el 404 |
| `adminChildGuard` | `canActivateChild` | mira **qué sección** es la ruta hija (`reportes`, `funciones`…) y deja pasar solo si el rol la incluye; si no, lo manda a la primera sección que sí puede usar |
| `empleadoGuard` | `canMatch` | solo el rol empleado |
| `formGuard` | `canDeactivate` | pregunta antes de salir del registro con datos sin guardar |

Los guards esperan a que se cargue la sesión (`auth.sesionCargada`). Sin eso, al apretar F5 el guard correría antes de que Supabase devuelva el usuario, y echaría a alguien que sí está logueado.

---

## 3. Base de datos (Supabase)

### 3.1 Tablas

| Tabla | Contenido |
|---|---|
| `perfiles` | datos del registro + rol, rol del panel (`rol_id`), puntos y crédito; unida a `auth.users` |
| `peliculas`, `generos`, `peliculas_generos` | películas (con preventa y entradas vendidas) y sus géneros (N a N) |
| `salas`, `butacas` | 8 salas con formato fijo y 532 butacas cada una |
| `funciones` | película + sala + inicio/fin + formato + idioma; `cancelada_en` y `motivo_cancelacion` si el cine la canceló |
| `compras`, `compra_entradas` | cada compra (cupón, puntos, crédito usado, validación, entrega del candy) y sus butacas |
| `productos`, `combos`, `compra_productos`, `compra_combos` | candy, combos y lo comprado de cada uno |
| `cupones`, `configuracion`, `canjes` | cupones, puntos de la entrada gratis e historial de canjes |
| `resenias`, `alertas`, `actividad` | reseñas, alertas de estreno y log de actividad |
| `notificaciones` | avisos para cada usuario (función cancelada, propuesta resuelta, lugar liberado) |
| `propuestas` | películas propuestas por los clientes y su estado |
| `roles` | roles del panel: nombre y secciones (`text[]`) |
| `lista_espera` | quién espera en cada función y su estado (`esperando → avisado → compro / vencido`) |

### 3.2 Funciones SQL

Se llaman con `supabase.rpc`. Corren con `security definer` y controlan todo en la base.

| Función | Qué hace |
|---|---|
| `comprar_entradas` | calcula precios (VIP, preventa, combos, candy), aplica canje, cupón y crédito, suma puntos y guarda todo junto. Rechaza funciones canceladas y butacas reservadas por la lista de espera |
| `validar_entrada` / `entregar_candy` | solo empleados; cada una sirve una vez por compra |
| `cancelar_compra` | solo el dueño, hasta 2 h antes; libera butacas, acredita crédito y avisa a la lista de espera |
| `cancelar_funcion` | cancela una función completa de forma atómica (ver 5.1) |
| `reporte_ventas` | devuelve las ventas agrupadas por día y película para los reportes |
| `traer_usuarios` / `cambiar_rol` / `asignar_rol_panel` | solo admin; usuarios, rol y rol del panel (nunca el propio) |
| `puede_acceder(seccion)` | ¿el usuario logueado puede usar esa sección del panel? La usan las demás funciones |
| `proponer_pelicula` / `traer_propuestas` / `aceptar_propuesta` / `rechazar_propuesta` | propuestas de películas |
| `anotarme_espera` / `estado_espera` / `mis_esperas` / `espera_por_funcion` | lista de espera |
| `procesar_lista_espera` | el "motor" de la lista de espera: vence turnos y da turnos nuevos. No se puede llamar desde el navegador |
| `lugares_disponibles` | butacas libres de una función, sin contar las reservadas por turnos de otros |

### 3.3 Storage, Realtime, RLS y tareas programadas

- **Storage:** bucket `peliculas` para los pósters y `candy` para las fotos de productos y combos.
- **Realtime:** `compra_entradas` publica sus inserts y el mapa de butacas escucha los de su función. `notificaciones` publica sus inserts y la campanita escucha los del usuario.
- **RLS (Row Level Security):**
  - Lo público (películas, salas, funciones, candy, reseñas, roles) se lee sin cuenta o con cualquier cuenta.
  - Cada usuario ve solo sus compras, canjes, alertas, notificaciones, propuestas y listas de espera.
  - Para escribir hay que estar logueado. Lo sensible pasa por funciones SQL que revisan el rol, y algunas tablas no tienen permiso de escritura directa (`notificaciones`, `propuestas`, inserts de `lista_espera`).
  - `roles` solo la escribe el admin. Al registrarse nadie se puede poner un rol ni un rol del panel.
- **`pg_cron`:** el job `lista-espera` corre `procesar_lista_espera()` cada minuto.

---

## 4. Decisiones técnicas

**Standalone y no módulos.** Es el modelo actual de Angular y el que se usa en la cursada: cada componente declara lo que usa en su `imports: []`, y no hace falta un `NgModule` que agrupe todo.

**Signals para el estado.**
- **Qué es un signal:** todo lo que se muestra en pantalla y cambia (listas, "cargando", errores, usuario, carrito, notificaciones) es un `signal()`. Cuando cambia, Angular actualiza solo lo que lo lee.
- **`computed()` para los valores derivados:** totales del carrito, descuentos, promedio de reseñas, top 3, facturación por día, paginados, notificaciones sin leer y secciones del panel permitidas.
- **Signals compartidos:** un signal en un servicio (`Auth`, `Carrito`, `Notificaciones`) lo ven todos los componentes, porque el servicio es único.
- **`effect()`:** en `App`, cuando cambia el usuario logueado, empieza o deja de escuchar sus notificaciones.

**Reactive Forms con validadores custom** (`validadores/`): fecha de nacimiento, claves que coinciden, enteros, tarjeta no vencida, y fecha y hora reales.

**Fechas y horas sin calendario** (mail 28/02, "que no implique tanto tiempo de búsqueda"):
- Se escriben solo los números y la barra o los dos puntos se ponen solos (`15041995` → `15/04/1995`).
- Los horarios típicos y los días de la semana se eligen con botones.

**Las reglas importantes se validan en la base, no solo en Angular.** Lo que valida el front se puede saltear, y dos usuarios pueden hacer lo mismo al mismo tiempo:
- **Una butaca no se vende dos veces:** índice único en `compra_entradas`. Es *parcial*: no cuenta las entradas canceladas, así una butaca liberada se puede volver a vender.
- **Dos funciones no se pisan en la misma sala, con 30 min de margen:** restricción `exclude using gist` sobre el rango `[inicio, fin + 30 min)`. Solo mira las funciones **no canceladas**.
- **La compra es una sola función SQL:** si algo falla, no queda nada a medias. **El precio lo calcula la base**: Angular solo dice qué quiere comprar.
- **Errores propios:** las funciones usan `raise exception` con un texto en castellano; Angular lo reconoce por el código `P0001` y lo muestra tal cual.

**Asignación automática de sala.**
- **Para una función:** el sistema calcula el fin con la duración, busca las salas del formato, descarta las que se pisan (contando los 30 min) y asigna la primera libre.
- **Para funciones repetidas:** un `for` recorre los días marcados y crea cada una igual. Al final avisa en qué fechas no había sala.

**QR y PDF de la entrada.**
- **El código:** el código de la compra es un UUID que genera Postgres (`gen_random_uuid()`); no se puede adivinar.
- **El QR:** `qrcode` lo convierte en un QR con un link a `/empleado/<código>`. El empleado lo escanea con la cámara del celular y se abre la pantalla de validación con el código cargado.
- **El PDF:** `jspdf` arma el PDF con los datos, el candy y el QR.

**Reportes.**
- **Datos:** la base agrupa las ventas por día y película (la API de Supabase devuelve como mucho 1000 filas por consulta). Angular arma la facturación por día con `computed`.
- **Excel:** con `xlsx` (`json_to_sheet` → `book_new` → `writeFile`).
- **PDF:** con `jspdf`.
- **Gráficos:** barras de CSS, cuyo ancho es la cantidad dividida la más grande.

**Pago simulado.** La consigna no pide un medio de pago real. Los datos de la tarjeta se validan, pero no se guardan ni se envían.

**Directiva y pipes.**
- `appResaltar`: directiva de atributo con `ElementRef`, `Renderer2` y `@HostListener`, que resalta la tarjeta de la película.
- Pipes custom: `filtroPeliculas` (un solo buscador por nombre o género, en el home y en el admin) y `duracion` (128 → "2 h 8 min").
- Pipes nativas: `date`, `currency` y `number`, con **formato argentino**: `registerLocaleData(localeEsAr)` + `LOCALE_ID = 'es-AR'` en `app.config.ts` ($ 15.850, 4,5 estrellas, días en castellano). Los textos armados a mano (PDF, log) usan `toLocaleString('es-AR')`.

---

## 5. Recuperatorio: cómo se resolvió cada punto

### 5.1 Cancelación de funciones (atómica)

- **Todo en una función de Postgres (`cancelar_funcion`).** Una función de Postgres corre entera dentro de **una transacción**: si algo falla en el medio, Postgres deshace todo (rollback). Por eso "se acredita a todos o a nadie". Si se hiciera desde Angular con un `update` por compra, un corte de internet en la mitad dejaría a unos con crédito y a otros sin.
- **Qué hace, en orden:**
  1. Revisa el permiso.
  2. **Traba la función** (`select … for update`).
  3. Recorre las compras pagadas con un `for … loop`. Por cada una: la cancela, libera sus butacas, acredita el total como crédito, ajusta los puntos e inserta una notificación.
  4. Revierte los contadores de "más vendidos".
  5. Marca la función como cancelada y lo anota en el log.
  6. Devuelve un resumen en `jsonb`.
- **Concurrencia:** `comprar_entradas` lee la función con `for share`. Si justo se está cancelando, la compra **espera** a que termine y después ve la función cancelada y la rechaza. Así nadie compra "en el medio".
- **La función no se borra:** se marca con `cancelada_en` y el motivo. La cartelera filtra con `.is('cancelada_en', null)`.

### 5.2 Notificaciones

- Tabla `notificaciones` **sin policy de insert**: las crean solo las funciones de la base, así nadie le puede inventar una notificación a otro.
- La campanita del header usa **Supabase Realtime** (`postgres_changes` filtrado por `usuario_id`). Las notificaciones sin leer son un `computed`.
- Las nuevas también se muestran con la **Notification API** del navegador: con el service worker (`showNotification`) en producción, o con `new Notification()` en desarrollo.

### 5.3 Propuestas de películas

- **"Una a la vez" lo garantiza la base:** un **índice único parcial**, `unique (usuario_id) where estado = 'pendiente'`. Aunque alguien se saltee Angular, la segunda pendiente da error `23505`.
- **Aceptar** navega a `/admin/peliculas?propuesta=ID`. El ABM de películas lee el *query param* con `queryParamMap`, trae la propuesta y precarga el formulario con `patchValue`. Al guardar la película llama a `aceptar_propuesta(id, pelicula_id)`.

### 5.4 Roles configurables

- **Datos:** tabla `roles` con `secciones text[]` y un `check` que limita las secciones posibles (`usuarios` y `roles` no están, así un rol nunca puede dar permisos). `perfiles.rol_id` apunta al rol (`on delete set null`).
- **Front:** `Auth` trae el perfil con el join `roles(*)` y calcula `seccionesPanel` con un `computed`. Las pestañas del panel se dibujan con `@for` + `@if (auth.puede(...))`. `adminChildGuard` usa `childRoute.routeConfig.path` para saber qué sección es y redirige con `createUrlTree`.
- **Base:** `puede_acceder(seccion)` reemplazó a "solo el admin" en `reporte_ventas`, `cancelar_funcion` y las funciones de propuestas. Así esconder una pestaña no es la única protección.
- **Seguridad:** las policies de `roles` solo dejan escribir al admin, y la de insert de `perfiles` exige `rol_id is null`. Nadie se puede dar un rol a sí mismo.

### 5.5 Lista de espera

- **Estados:** `esperando → avisado → compro / vencido`. Un índice único parcial evita estar dos veces activo en la misma función.
- **Reserva:** `lugares_disponibles(funcion, usuario)` = butacas − vendidas − **turnos activos de otros**. `comprar_entradas` y `anotarme_espera` usan esa cuenta.
- **El motor, `procesar_lista_espera()`:**
  1. Cierra las listas de funciones empezadas o canceladas.
  2. Vence los turnos de más de 15 minutos.
  3. Da turno a los primeros de la fila (`order by creado_en, id`) mientras haya butacas sin reservar, e inserta la notificación.
- **Cuándo corre:**
  - al cancelar una compra (`cancelar_compra` lo llama), y
  - **cada minuto con `pg_cron`**, así el turno vencido pasa al siguiente aunque nadie toque nada.

  Tiene el `execute` revocado para los usuarios: solo lo corre la base.
- **Posición en la fila:** se calcula comparando de a pares `(creado_en, id) < (creado_en, id)`. Si dos se anotaron en el mismo instante, desempata el id.

---

## 6. Deploy y PWA

```bash
npm install
npx ng serve                       # desarrollo: http://localhost:4200
npx ng build                       # compila a dist/cine/browser
firebase deploy --only hosting     # sube a https://cine-progra-4.web.app
```

- **PWA:** `@angular/pwa` agrega el `manifest.webmanifest` (nombre, íconos, colores) y el service worker (`ngsw-config.json`), que guarda la app en caché para que cargue rápido y se pueda instalar. En desarrollo el service worker está apagado (`enabled: !isDevMode()`).
- **Ojo con la caché:** después de un deploy, la PWA puede mostrar la versión anterior hasta que se recarga (Ctrl + Shift + R) o se cierran todas las pestañas.
- **Firebase Hosting:** `firebase.json` reescribe todas las URLs a `index.html`. Así una ruta de Angular (ej. `/perfil`) funciona aunque se entre directo o se aprete F5.
