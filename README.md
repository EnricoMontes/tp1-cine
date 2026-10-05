# SignalCine

Sistema web de un cine: cartelera, compra de entradas con elección de butacas en tiempo real y panel de administración de películas, salas y funciones.

Trabajo Práctico 1 de **Programación IV** (UTN FRA, comisión A342-2) · Enrico Montes.

- **App deployada:** https://cine-progra-4.web.app
- **Repositorio:** https://github.com/EnricoMontes/tp1-cine

> Este README explica la **arquitectura y las decisiones técnicas**. El análisis de la consigna (requerimientos numerados, ambigüedades y cómo se resolvieron) está en un documento aparte.

---

## Stack

| Parte | Tecnología |
|---|---|
| Frontend | Angular 22.1 (componentes standalone, signals, control de flujo `@if`/`@for`) · TypeScript 6.0 |
| Base de datos, autenticación y archivos | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Hosting | Firebase Hosting |
| PWA | `@angular/pwa` (service worker + manifest) |
| Tests | Vitest (el que trae Angular CLI) |

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
- Ver la cartelera y la sección **Próximamente**, y buscar películas por nombre o género.
- Ver el detalle de una película con sus funciones.
- Comprar entradas en 3 pasos: **Entradas → Butacas → Pago**.
  1. Elegir cuántas entradas de cada tipo (General, Accesible, VIP), con el precio de cada una y las butacas que quedan.
  2. Elegir las butacas en el mapa de la sala. Las ocupadas se actualizan **en tiempo real**.
  3. Pagar (pago simulado) y recibir el código de la compra.
- Registrarse e iniciar sesión.

**Administrador** (`/admin`)
- ABM de películas, con géneros y póster subido a Supabase Storage.
- Ver las salas y su mapa de butacas.
- Crear funciones: el sistema **asigna la sala automáticamente**.

---

## Arquitectura

### Estructura de carpetas

```
src/app/
├── componentes/     una carpeta por pantalla o pieza de UI
├── servicios/       acceso a Supabase y estado compartido (signals)
├── guards/          protección de rutas
├── modelos/         interfaces de TypeScript (forma de los datos)
├── validadores/     validadores custom de formularios
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
| `/peliculas/:id` | `DetallePelicula` | pública |
| `/funciones/:id/entradas` | `ElegirEntradas` (paso 1) | pública |
| `/funciones/:id/butacas` | `ElegirButacas` (paso 2) → usa `MapaButacas` | pública |
| `/checkout` | `Checkout` (paso 3) | pública |
| `/login`, `/registro` | `Login`, `Registro` | `canDeactivate` en registro |
| `/perfil` | `MiPerfil` | `canActivate` (logueado) |
| `/admin` → `peliculas`, `salas`, `funciones` | `Admin` con rutas hijas | `canMatch` + `canActivateChild` (rol admin) |
| `/empleado` | `Empleado` | `canMatch` (rol empleado) |
| `**` | `Error` (404) | — |

**Componentes reutilizados:** `MapaButacas` se usa en el panel de admin (solo para ver) y en la compra (para elegir), según los `input()` que le pasa cada padre. `PasosCompra` muestra en qué paso de la compra está el usuario.

### Servicios

| Servicio | Para qué |
|---|---|
| `Supabase` | crea **un solo** cliente de Supabase para toda la app |
| `Auth` | registro, login, logout; guarda el usuario y su perfil (con el rol) en **signals** |
| `Peliculas`, `Salas`, `Funciones` | consultas a cada tabla |
| `Compras` | butacas ocupadas, compra (función de la base) y **suscripción en tiempo real** |
| `Carrito` | estado de la compra en curso (función, cantidades, butacas), compartido entre los 3 pasos |

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
| `perfiles` | datos del registro + rol (`cliente` / `empleado` / `admin`), unida a `auth.users` |
| `peliculas`, `generos`, `peliculas_generos` | películas y sus géneros (relación N a N) |
| `salas` | 8 salas, cada una con un formato fijo |
| `butacas` | 532 butacas por sala (`fila`, `numero`, `columna`, `tipo`) |
| `funciones` | película + sala + inicio/fin + formato + idioma |
| `compras`, `compra_entradas` | cada compra y sus butacas vendidas |

- **Storage:** bucket `peliculas` para los pósters.
- **Realtime:** la tabla `compra_entradas` publica sus inserts. El mapa de butacas escucha los de su función y marca como ocupada cada butaca que se vende.
- **RLS (Row Level Security):**
  - Las tablas públicas (películas, salas, butacas, funciones) se pueden leer sin cuenta.
  - Para escribir hay que estar logueado.
  - Cada usuario ve solo sus compras.
  - Qué usuario entra a cada panel lo controlan los guards.

---

## Decisiones técnicas

**Standalone y no módulos.** Es el modelo actual de Angular y el que se usa en la cursada: cada componente declara lo que usa en su `imports: []`, y no hace falta un `NgModule` que agrupe todo.

**Signals para el estado.** Todo lo que se muestra en pantalla y cambia (listas, "cargando", errores, usuario logueado, carrito) es un `signal()`. Cuando cambia con `.set()` o `.update()`, Angular actualiza solo las partes del template que lo leen. `computed()` se usa para valores derivados, como el total del carrito o el mapa agrupado por filas. Un signal en un servicio (`Auth`, `Carrito`) se comparte entre todos los componentes, porque el servicio es único.

**Reactive Forms con validadores custom.** Registro, login, ABMs y pago usan `FormGroup` / `FormControl`. Los validadores propios están en `validadores/`:
- fecha de nacimiento válida;
- claves que coinciden;
- números enteros;
- tarjeta no vencida.

El registro pide todos los datos de la consigna, incluidos tipo de sangre y color de ojos.

**Las reglas importantes se validan en la base, no solo en Angular.** Lo que valida el front se puede saltear, y además dos usuarios pueden hacer lo mismo al mismo tiempo:
- **Una butaca no se vende dos veces:** `unique (funcion_id, butaca_id)` en `compra_entradas`.
- **Dos funciones no se pisan en la misma sala, con 30 minutos entre una y otra:** una restricción `exclude using gist` sobre el rango `[inicio, fin + 30 min)` de cada sala.
- **La compra se hace con una función SQL** (`comprar_entradas`, llamada con `rpc`) que guarda la compra y todas sus entradas juntas: si una butaca ya se vendió, no queda nada a medias. **El precio lo calcula la base**: Angular solo dice qué butacas quiere, así nadie puede cambiar el precio desde el navegador.

**Asignación automática de sala.** El admin elige película, formato, idioma y horario. El sistema:
1. calcula el fin con la duración de la película;
2. busca las salas de ese formato;
3. descarta las que tienen una función que se pisa con ese horario, contando los 30 minutos;
4. asigna la primera sala libre.

Si no hay ninguna libre, lo avisa.

**Fechas sin zona horaria.** Las funciones usan `timestamp` (sin zona): el cine está en una sola ciudad, y así la hora que carga el admin es la misma que se guarda y se muestra. Con `timestamptz`, Postgres no deja usar "fin + 30 minutos" dentro de la restricción.

**Pago simulado.** La consigna no pide integrar un medio de pago real. Los datos de la tarjeta se validan, pero no se guardan ni se envían: lo que se guarda es la compra.

**Directiva y pipes.**
- `appResaltar`: directiva de atributo con `ElementRef`, `Renderer2` y `@HostListener`. Agranda y resalta la tarjeta de la película al pasar el mouse.
- Pipe custom `filtroPeliculas`: un solo buscador que filtra por nombre o por género.
- Pipes nativas `date` y `currency` para fechas y precios.

### Cómo se interpretó la consigna

| Tema | Decisión |
|---|---|
| Filas J y K (mail 12/02) | Las dos filas pasan a ser **accesibles**, con 2 + 10 + 2 butacas cada una. El mismo mail habla de "filas J y K adaptadas para discapacidad". Cada sala queda con 20 filas (A–T, sin Ñ) y **532 butacas**: 420 normales, 28 accesibles y 84 VIP. |
| Salas y formatos | **8 salas, 2 de cada formato** (2D, 3D, 4D, 5D). El formato de cada sala es fijo y la función tiene que ir en una sala de su formato. |
| Precio VIP (filas R, S, T) | El precio de la película **+50%**. Se ve antes de pagar, como pide la consigna. |
| Tipos de entrada | **General, Accesible y VIP**. Cada tipo solo deja elegir butacas de su tipo y no se pueden sacar más de las que quedan libres. Máximo 10 por compra. |
| Restricción de edad | Usuario registrado: se calcula la edad con su fecha de nacimiento y, si es menor, no puede comprar. Compra anónima: tiene que aceptar una declaración de edad. La confirmación aclara que los menores deben ir con un adulto. |
| Próximamente | Las películas que no se estrenaron se muestran aparte, sin funciones ni venta. Solo se programan funciones de películas en cartelera. |
| Pantalla con el mapa del cine (mail 30/01) | No se implementó: el mismo mail dice que "no tienen luz verde aún", así que no es un pedido aprobado. |

### Nombre

**SignalCine**: por los *signals* de Angular, que se usan en toda la app para el estado, y por la idea de una señal que llega a la pantalla del cine.
