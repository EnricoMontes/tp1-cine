# SignalCine

Sistema web de un cine: cartelera, compra de entradas y candy con elección de butacas en tiempo real, programa de puntos, panel de administración y validación de entradas por QR.

Trabajo Práctico 1 de **Programación IV** (UTN FRA, comisión A342-2) · Enrico Montes.

- **App deployada:** https://cine-progra-4.web.app
- **Repositorio:** https://github.com/EnricoMontes/tp1-cine
- **Documento de requerimientos:** [docs/REQUERIMIENTOS.md](docs/REQUERIMIENTOS.md) (los requerimientos de la consigna, las ambigüedades y cómo se resolvió cada una)

Este README explica la **arquitectura y las decisiones técnicas**.

---

## Stack

| Parte | Tecnología |
|---|---|
| Frontend | Angular 22.1 (componentes standalone, signals, control de flujo `@if`/`@for`) · TypeScript 6.0 |
| Base de datos, autenticación y archivos | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Hosting | Firebase Hosting |
| PWA | `@angular/pwa` (service worker + manifest) |
| Librerías externas | `qrcode` (QR de la entrada) · `jspdf` (PDF de la entrada y del reporte) · `xlsx` (Excel del reporte) |

## Cómo correrlo

```bash
npm install
npx ng serve          # http://localhost:4200
```

Deploy:

```bash
npx ng build
firebase deploy --only hosting
```

### Usuarios de prueba

| Rol | Mail | Contraseña |
|---|---|---|
| Cliente | enrumontes+prueba1@gmail.com | 1234567 |
| Administrador | enrumontes+admin@gmail.com | 1234567 |
| Empleado | enrumontes+empleado@gmail.com | 1234567 |

También se puede comprar **sin cuenta** (compra anónima).

---

## Qué se puede hacer

**Cualquier visitante**
- Ver la cartelera con las **3 películas más vendidas** arriba, la sección **Próximamente** y buscar películas por nombre o por género.
- Ver el detalle de una película: funciones, **reseñas** con estrellas y **puntaje promedio**.
- Comprar en 3 pasos: **Entradas → Butacas → Pago**.
  1. Elegir **combos** (destacados), entradas General / Accesible / VIP y **candy** por categoría.
  2. Elegir las butacas en el mapa. Las ocupadas se actualizan **en tiempo real**.
  3. Pagar (pago simulado) y recibir la entrada con **QR** y en **PDF**.

**Cliente registrado**
- **Cupones automáticos:** bienvenida en la primera compra y mayores de 50, además de cupones con código.
- **Puntos:** 1 por cada peso pagado. Se **canjean** por entradas o productos gratis, con historial de canjes.
- **Cancelar** una compra hasta 2 horas antes. El total pasa a **crédito**, que se usa junto con la tarjeta.
- **Mis compras** (paginado), **Mis películas** (lo que vio, con su calificación) y **reseñas**.
- **Alerta de estreno:** aviso en el home cuando salen las entradas de una película de Próximamente.

**Empleado** (`/empleado`)
- Escanea el QR con el celular, o escribe el código, y **valida la entrada** o **entrega el candy**. Cada uno sirve una sola vez.

**Administrador** (`/admin`)
- **Películas:** ABM con géneros, póster en Supabase Storage, preventa y buscador.
- **Salas:** las 8 salas con su mapa de butacas.
- **Funciones:**
  - alta con **asignación automática de sala**;
  - repetición por días de la semana ("lunes, martes y viernes a las 18 hs");
  - buscador y paginado.
- **Candy:** ABM de productos y combos, con los puntos que cuesta cada recompensa.
- **Cupones:** porcentaje del de bienvenida y del de mayores de 50, y cupones con código.
- **Reportes:** facturación por día con **exportación a PDF y Excel**, gráfico de películas más vistas (semana / mes) y candy más vendido.
- **Actividad:** log de quién creó funciones, cambió precios o validó entradas, con fecha y hora.

---

## Arquitectura

### Estructura de carpetas

```
src/app/
├── componentes/     una carpeta por pantalla o pieza de UI
├── servicios/       acceso a Supabase y estado compartido (signals)
├── guards/          protección de rutas
├── modelos/         interfaces de TypeScript (forma de los datos)
├── validadores/     validadores custom de formularios (registro, pago, fechas)
├── pipes/           pipe custom (filtro de películas)
├── directivas/      directiva custom (appResaltar)
├── app.routes.ts    tabla de rutas
└── app.config.ts    providers (router, service worker)
```

Siguiendo la convención de la cátedra: componentes **standalone** (sin `NgModule`), archivos sin sufijo `.component` y nombres en español.

### Componentes y rutas

Todas las rutas usan **lazy loading** (`loadComponent`): el código de cada pantalla se descarga recién cuando se entra.

| Ruta | Componente | Protección |
|---|---|---|
| `/home` | `Home` → usa `CardPelicula` (hijo con `input()` / `output()`) | pública |
| `/peliculas/:id` | `DetallePelicula` (funciones y reseñas) | pública |
| `/funciones/:id/entradas` | `ElegirEntradas` (paso 1: entradas, combos y candy) | pública |
| `/funciones/:id/butacas` | `ElegirButacas` (paso 2) → usa `MapaButacas` | pública |
| `/checkout` | `Checkout` (paso 3: cupones, puntos, crédito y pago) | pública |
| `/login`, `/registro` | `Login`, `Registro` | `canDeactivate` en registro |
| `/perfil` | `MiPerfil` | `canActivate` (logueado) |
| `/admin` → `peliculas`, `salas`, `funciones`, `candy`, `cupones`, `reportes`, `actividad` | `Admin` con rutas hijas | `canMatch` + `canActivateChild` (rol admin) |
| `/empleado` y `/empleado/:codigo` (adonde lleva el QR) | `Empleado` | `canMatch` (rol empleado) |
| `**` | `Error` (404) | — |

**Componentes reutilizados:**
- `MapaButacas` se usa en el admin (solo para ver) y en la compra (para elegir), según los `input()` que le pasa cada padre.
- `PasosCompra` muestra en qué paso de la compra está el usuario.

### Servicios

| Servicio | Para qué |
|---|---|
| `Supabase` | crea **un solo** cliente de Supabase para toda la app |
| `Auth` | registro, login, logout; guarda el usuario y su perfil (rol, puntos, crédito) en **signals** |
| `Peliculas`, `Salas`, `Funciones` | consultas a cada tabla |
| `Compras` | compra, Mis compras, cancelación, validación de entradas y candy, y **suscripción en tiempo real** a las butacas vendidas |
| `Carrito` | estado de la compra en curso (función, cantidades, combos, candy, butacas), compartido entre los 3 pasos; también las reglas de preventa |
| `Cupones`, `Candy`, `Resenias`, `Alertas` | cupones, productos/combos, reseñas y alertas de estreno |
| `EntradaPdf` | genera el QR y el PDF de la entrada |
| `Actividades`, `Reportes` | log de actividad y reporte de ventas del admin |

Los servicios usan `@Service()` e `inject()`. Los componentes reciben los servicios por el constructor, como en las clases.

### Guards

| Guard | Tipo | Qué hace |
|---|---|---|
| `authGuard` | `canActivate` | si no está logueado, lo manda a `/login` |
| `adminGuard` / `empleadoGuard` | `canMatch` | si no tiene el rol, la ruta "no existe" y cae en el 404 |
| `adminChildGuard` | `canActivateChild` | vuelve a chequear el rol en cada ruta hija de `/admin` |
| `formGuard` | `canDeactivate` | pregunta antes de salir del registro con datos sin guardar |

Los guards esperan a que se cargue la sesión (`auth.sesionCargada`). Sin eso, al apretar F5 el guard correría antes de que Supabase devuelva el usuario, y echaría a alguien que sí está logueado.

### Base de datos (Supabase)

| Tabla | Contenido |
|---|---|
| `perfiles` | datos del registro + rol, puntos y crédito; unida a `auth.users` |
| `peliculas`, `generos`, `peliculas_generos` | películas (con preventa y entradas vendidas) y sus géneros (N a N) |
| `salas`, `butacas` | 8 salas con formato fijo y 532 butacas cada una |
| `funciones` | película + sala + inicio/fin + formato + idioma |
| `compras`, `compra_entradas` | cada compra (cupón, puntos, crédito usado, validación, entrega del candy) y sus butacas |
| `productos`, `combos`, `compra_productos`, `compra_combos` | candy, combos y lo comprado de cada uno |
| `cupones`, `configuracion`, `canjes` | cupones, puntos de la entrada gratis e historial de canjes |
| `resenias`, `alertas`, `actividad` | reseñas, alertas de estreno y log de actividad |

**Funciones SQL** (se llaman con `supabase.rpc`). Corren con `security definer` y controlan todo en la base:

| Función | Qué hace |
|---|---|
| `comprar_entradas` | calcula precios (VIP, preventa, combos, candy), aplica canje, cupón y crédito, suma puntos y guarda todo junto |
| `validar_entrada` / `entregar_candy` | solo empleados; cada una sirve una vez por compra |
| `cancelar_compra` | solo el dueño, hasta 2 h antes; libera butacas y acredita crédito |
| `reporte_ventas` | solo admin; devuelve las ventas para los reportes |

Además:
- **Storage:** bucket `peliculas` para los pósters.
- **Realtime:** `compra_entradas` publica sus inserts. El mapa de butacas escucha los de su función.
- **RLS (Row Level Security):**
  - Lo público (películas, salas, funciones, candy, reseñas) se lee sin cuenta.
  - Para escribir hay que estar logueado.
  - Cada usuario ve solo sus compras, canjes y alertas.
  - Qué usuario entra a cada panel lo controlan los guards.

---

## Decisiones técnicas

**Standalone y no módulos.** Es el modelo actual de Angular y el que se usa en la cursada: cada componente declara lo que usa en su `imports: []`, y no hace falta un `NgModule` que agrupe todo.

**Signals para el estado.**
- **Qué es un signal:** todo lo que se muestra en pantalla y cambia (listas, "cargando", errores, usuario, carrito) es un `signal()`. Cuando cambia, Angular actualiza solo lo que lo lee.
- **`computed()` para los valores derivados:** totales del carrito, descuentos, promedio de reseñas, top 3, facturación por día y paginados (con `slice`).
- **Signals compartidos:** un signal en un servicio (`Auth`, `Carrito`) lo ven todos los componentes, porque el servicio es único.

**Reactive Forms con validadores custom** (`validadores/`):
- fecha de nacimiento;
- claves que coinciden;
- enteros;
- tarjeta no vencida;
- fecha y hora reales.

**Fechas y horas sin calendario** (mail 28/02, "que no implique tanto tiempo de búsqueda"):
- Se escriben solo los números y la barra o los dos puntos se ponen solos (`15041995` → `15/04/1995`).
- Los horarios típicos y los días de la semana se eligen con botones.

**Las reglas importantes se validan en la base, no solo en Angular.** Lo que valida el front se puede saltear, y dos usuarios pueden hacer lo mismo al mismo tiempo:
- **Una butaca no se vende dos veces:** índice único en `compra_entradas`. Es *parcial*: no cuenta las entradas canceladas, así una butaca liberada se puede volver a vender.
- **Dos funciones no se pisan en la misma sala, con 30 min de margen:** restricción `exclude using gist` sobre el rango `[inicio, fin + 30 min)`.
- **La compra es una sola función SQL:** si algo falla, no queda nada a medias. **El precio lo calcula la base**: Angular solo dice qué quiere comprar.

**Asignación automática de sala.**
- **Para una función:** el sistema calcula el fin con la duración, busca las salas del formato, descarta las que se pisan (contando los 30 min) y asigna la primera libre.
- **Para funciones repetidas:** un `for` recorre los días marcados y crea cada una igual. Al final avisa en qué fechas no había sala.

**QR y PDF de la entrada.**
- **El código:** el código de la compra es un UUID que genera Postgres (`gen_random_uuid()`); no se puede adivinar.
- **El QR:** `qrcode` lo convierte en un QR con un link a `/empleado/<código>`. El empleado lo escanea con la cámara del celular y se abre la pantalla de validación con el código cargado.
- **El PDF:** `jspdf` arma el PDF con los datos, el candy y el QR.

**Reportes.**
- **Datos:** la facturación por día se agrupa en Angular con `computed`.
- **Excel:** con `xlsx` (`json_to_sheet` → `book_new` → `writeFile`).
- **PDF:** con `jspdf`.
- **Gráficos:** barras de CSS, cuyo ancho es la cantidad dividida la más grande.

**Pago simulado.** La consigna no pide un medio de pago real. Los datos de la tarjeta se validan, pero no se guardan ni se envían.

**Directiva y pipes.**
- `appResaltar`: directiva de atributo con `ElementRef`, `Renderer2` y `@HostListener`, que resalta la tarjeta de la película.
- Pipe custom `filtroPeliculas`: un solo buscador por nombre o género. Se usa en el home y en el admin.
- Pipes nativas: `date`, `currency` y `number`.

### Cómo se interpretó la consigna

Resumen; el detalle está en [docs/REQUERIMIENTOS.md](docs/REQUERIMIENTOS.md).

| Tema | Decisión |
|---|---|
| Filas J y K (mail 12/02) | Las dos son accesibles, de 2 + 10 + 2. Cada sala tiene 20 filas (A–T) y 532 butacas. |
| Salas | 8 salas, 2 de cada formato. La función va en una sala de su formato. |
| Precio VIP | Precio de la película + 50%. Se ve antes de pagar. |
| Un QR, dos usos | Validar la entrada y entregar el candy, una vez cada uno. |
| Cupones | Bienvenida y mayores de 50 automáticos, más cupones con código. Uno por compra. |
| Edad | El registrado menor no puede comprar; el anónimo acepta una declaración de edad. |
| Combos | Precio fijo e incluyen una entrada general. La entrada del combo también se puede canjear con puntos. |
| Cancelación | Hasta 2 h antes. Libera las butacas, acredita el total como crédito y ajusta los puntos. |
| Preventa | Abre 7 días antes del estreno; precio de preventa hasta el día del estreno. |
| Mapa del cine (mail 30/01) | No se implementó: el mismo mail dice que "no tienen luz verde aún". |

### Nombre

**SignalCine**: por los *signals* de Angular, que se usan en toda la app para el estado, y por la idea de una señal que llega a la pantalla del cine.
