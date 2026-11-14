# SignalCine · Documentación funcional

Trabajo Práctico 1 de **Programación IV** (UTN FRA, comisión A342-2) · Enrico Montes.

Este documento explica **qué hace el sistema** desde el lado del negocio:
- **todos los requerimientos** de la cadena de mails de la consigna y del mail del recuperatorio;
- las **ambigüedades** entre un mail y otro, y **cómo se resolvió cada una**;
- las **reglas de negocio**.

Cómo está construido (arquitectura, stack y decisiones técnicas) está en [TECNICO.md](TECNICO.md).

**Índice**
1. [Actores](#1-actores)
2. [Qué puede hacer cada uno](#2-qué-puede-hacer-cada-uno)
3. [Requerimientos funcionales](#3-requerimientos-funcionales)
4. [Requerimientos del recuperatorio](#4-requerimientos-del-recuperatorio)
5. [Requerimientos no funcionales y fuera de alcance](#5-requerimientos-no-funcionales-y-fuera-de-alcance)
6. [Ambigüedades y cómo se resolvieron](#6-ambigüedades-y-cómo-se-resolvieron)
7. [Reglas de negocio](#7-reglas-de-negocio)

---

## 1. Actores

| Actor | Cómo entra | Qué puede hacer |
|---|---|---|
| **Anónimo** | sin cuenta | ver cartelera y reseñas, comprar entradas y candy |
| **Cliente registrado** | inicia sesión en el panel lateral (ícono de usuario) | lo anterior + cupones automáticos, puntos y canje, crédito, cancelar compras, reseñas, "Mis películas", alertas de estreno, **proponer películas**, **listas de espera** y **notificaciones** |
| **Empleado** | cuenta con rol `empleado` | validar la entrada y entregar el candy con el QR o el código escrito a mano |
| **Usuario con rol del panel** | cliente o empleado al que el admin le dio un rol configurable (ej. "Solo reportes") | entra al panel de administración, pero **solo a las secciones de su rol** |
| **Administrador** | cuenta con rol `admin` | todo el panel: películas, funciones (y su cancelación), candy y combos, cupones, reportes, propuestas, usuarios, roles y log de actividad |

---

## 2. Qué puede hacer cada uno

**Cualquier visitante**
- Ver la cartelera con las **3 películas más vendidas** arriba, la sección **Próximamente** y buscar por nombre o género.
- Ver el detalle de una película: funciones, **reseñas** con estrellas y **puntaje promedio**.
- Comprar en 3 pasos: **Entradas → Butacas → Pago**.
  1. Elegir **combos** (destacados), entradas General / Accesible / VIP y **candy** por categoría.
  2. Elegir las butacas en el mapa. Las ocupadas se actualizan **en tiempo real**.
  3. Pagar (pago simulado) y recibir la entrada con **QR** y en **PDF**.

**Cliente registrado**
- Si antes había comprado **sin cuenta** con el mismo mail y el cine canceló esa función, al registrarse ya tiene ese crédito.
- **Cupones automáticos:** bienvenida en la primera compra y mayores de 50, además de cupones con código.
- **Puntos:** 1 por cada peso pagado. Se **canjean** por entradas, productos o combos, con historial de canjes.
- **Cancelar** una compra hasta 2 horas antes. El total pasa a **crédito**, que se usa junto con la tarjeta.
- **Mis compras** (paginado), **Mis películas** (lo que vio, con su calificación) y **reseñas**.
- **Alerta de estreno:** aviso en el home cuando salen las entradas de una película de Próximamente.
- **Proponer una película** que no está en la cartelera (*recuperatorio*).
- **Lista de espera** en funciones agotadas, con aviso cuando se libera un lugar (*recuperatorio*).
- **Notificaciones** en la campanita del header: función cancelada, propuesta resuelta, lugar liberado (*recuperatorio*).

**Empleado** (`/empleado`)
- Escanea el QR con el celular, o escribe el código, y **valida la entrada** o **entrega el candy**. Cada uno sirve una sola vez.

**Administrador** (`/admin`)
- **Películas:** ABM con géneros, póster en Supabase Storage, preventa y buscador. También se abre precargada al aceptar una propuesta.
- **Funciones:** alta con **asignación automática de sala** y repetición por días de la semana. Listado por película, con los días desplegables. **Cancelar función** y ver cuánta gente hay **en espera** en cada una.
- **Candy:** ABM de productos y combos, con su foto y los puntos que cuesta cada recompensa.
- **Cupones:** porcentaje del de bienvenida y del de mayores de 50, cupones con código y puntos de la entrada gratis.
- **Reportes:** facturación por día con **exportación a PDF y Excel**, películas más vistas (semana / mes) y candy más vendido.
- **Propuestas:** las películas que piden los clientes, para aceptarlas o rechazarlas.
- **Usuarios:** cambiar el rol (cliente / empleado / admin) y asignar un **rol del panel**.
- **Roles:** crear roles que entran solo a ciertas secciones del panel.
- **Actividad:** log de quién creó funciones, cambió precios, validó entradas, canceló funciones, etc., con fecha y hora.

---

## 3. Requerimientos funcionales

Cada requerimiento tiene un ID (`RF-nn`) y la fecha del mail que lo pide.

### 3.1 Películas y cartelera

| ID | Requerimiento | Mail |
|---|---|---|
| RF-01 | Una película tiene nombre, sinopsis, duración e imagen | 01/01 |
| RF-02 | Una película puede tener varios géneros | 16/01 |
| RF-03 | Restricción de edad: +18, +13 o ninguna | 12/02 |
| RF-04 | El admin elige qué películas aparecen en la página | 01/01 |
| RF-05 | El home muestra primero las 3 películas más vendidas | 16/01 |
| RF-06 | El listado tiene un buscador | 16/01 |
| RF-07 | El buscador filtra por género | 16/01 |
| RF-08 | Sección "Próximamente" con los estrenos de las próximas semanas | 08/03 |
| RF-09 | Alerta para avisar cuando salen las entradas de una película de "Próximamente" | 08/03 |

### 3.2 Salas y funciones

| ID | Requerimiento | Mail |
|---|---|---|
| RF-10 | Varias salas, todas con la misma forma | 01/01 |
| RF-11 | 20 filas con letras y 3 columnas de 4, 20 y 4 butacas | 01/01 |
| RF-12 | Filas J y K accesibles, con 2, 10 y 2 butacas | 12/02 |
| RF-13 | Filas R, S y T VIP: más caras y marcadas distinto | 10/03 |
| RF-14 | Formato de la función: 2D, 3D, 4D o 5D | 01/01 |
| RF-15 | Idioma: castellano o subtitulada | 01/01 |
| RF-16 | El admin define los horarios de cada película | 01/01 |
| RF-17 | Entre una función y la siguiente en la misma sala, al menos 30 minutos | 01/01 |
| RF-18 | Nunca dos funciones en la misma sala al mismo tiempo | 06/02 |
| RF-19 | Asignación automática de sala ("lunes, martes y viernes a las 18 hs") | 06/02 |

### 3.3 Usuarios

| ID | Requerimiento | Mail |
|---|---|---|
| RF-20 | Registro con mail, nombre, apellido, fecha de nacimiento, tipo de sangre, color de ojos y días de vacaciones | 01/01 |
| RF-21 | Se puede comprar sin registrarse | 01/01 |
| RF-22 | Un menor no puede comprar entradas de películas con restricción | 12/02 |
| RF-23 | La entrada de una película restringida aclara que los menores van con un adulto | 12/02 |

### 3.4 Compra de entradas

| ID | Requerimiento | Mail |
|---|---|---|
| RF-24 | Elección de butacas en el mapa de la sala | 01/01 |
| RF-25 | Butacas ocupadas en tiempo real | 12/02 |
| RF-26 | Butacas accesibles resaltadas | 12/02 |
| RF-27 | Butacas VIP marcadas; el usuario sabe que es VIP antes de pagar | 10/03 |
| RF-28 | PDF con los datos de la entrada y el QR | 01/01 |
| RF-29 | Cancelar hasta 2 horas antes de la función | 10/03 |
| RF-30 | La cancelación no devuelve dinero: acredita crédito | 10/03 |
| RF-31 | El crédito se ve en el perfil y se combina con otros medios de pago | 10/03 |

### 3.5 Candy

| ID | Requerimiento | Mail |
|---|---|---|
| RF-32 | ABM de productos del candy | 30/01 |
| RF-33 | Productos agrupados en categorías | 30/01 |
| RF-34 | El candy se compra junto con la entrada | 30/01 |
| RF-35 | Se retira con el mismo QR de la entrada | 30/01 |
| RF-36 | Combos (entrada + pochoclos + bebida) a precio fijo configurable | 03/03 |
| RF-37 | Los combos aparecen destacados en la compra | 03/03 |

### 3.6 Cupones, puntos, preventa

| ID | Requerimiento | Mail |
|---|---|---|
| RF-38 | Cupón de 20% en la primera compra por registrarse | 01/01 |
| RF-39 | El porcentaje del cupón de bienvenida es configurable | 30/01 |
| RF-40 | Cupones para mayores de 50 años | 30/01 |
| RF-41 | 1 punto por cada peso gastado (usuarios registrados) | 03/03 |
| RF-42 | Los puntos se canjean por entradas gratis o productos del candy | 03/03 |
| RF-43 | El admin configura cuántos puntos cuesta cada recompensa | 03/03 |
| RF-44 | El perfil muestra los puntos y el historial de canjes | 03/03 |
| RF-45 | Los puntos no se transfieren entre usuarios | 03/03 |
| RF-46 | Preventa 7 días antes del estreno a precio especial, configurable por película | 08/03 |

### 3.7 Reseñas

| ID | Requerimiento | Mail |
|---|---|---|
| RF-47 | Calificar con estrellas y dejar un comentario corto | 16/01 |
| RF-48 | Las reseñas se ven antes de sacar las entradas | 16/01 |
| RF-49 | Puntuación promedio de cada película | 16/01 |
| RF-50 | "Mis películas": historial con pósters, fechas y la calificación propia | 08/03 |

### 3.8 Administración

| ID | Requerimiento | Mail |
|---|---|---|
| RF-51 | Un admin controla salas, funciones, butacas y productos | 06/02 |
| RF-52 | Reporte de facturación por día y entradas vendidas | 28/02 |
| RF-53 | Exportar la facturación a PDF y a Excel | 10/03 |
| RF-54 | Gráfico de películas más vistas por semana y por mes | 10/03 |
| RF-55 | Producto del candy que más se vende | 10/03 |
| RF-56 | Log de actividad: quién creó qué función, quién cambió un precio, quién validó un QR, con fecha y hora | 10/03 |

### 3.9 Empleados

| ID | Requerimiento | Mail |
|---|---|---|
| RF-57 | Empleados que escanean el QR para validar entradas y candy | 06/02 |
| RF-58 | El código se puede ingresar a mano | 06/02 |
| RF-59 | Una vez validada la entrada o entregada la comida, el QR deja de funcionar | 06/02 |

**Alta de empleados:** la persona se registra en la página y el admin le cambia el rol a `empleado` en la pestaña **Usuarios**. Las salas y las butacas son fijas (A-01, A-02), así que el admin no las edita.

---

## 4. Requerimientos del recuperatorio

Mail del recuperatorio del primer parcial ("Por el retraso del proyecto, agrego unos puntos más").

### 4.1 Propuestas de películas

| ID | Requerimiento |
|---|---|
| RF-60 | Los clientes proponen películas que **no están en la cartelera**: título, descripción y por qué la quieren en el cine |
| RF-61 | Cada cliente tiene **una propuesta a la vez** |
| RF-62 | El admin ve las propuestas y las **acepta o rechaza** |
| RF-63 | Al aceptar una, se abre la pantalla de **crear película con los datos enviados** |

### 4.2 Roles configurables

| ID | Requerimiento |
|---|---|
| RF-64 | Crear roles que dan acceso a **ciertas partes del panel de administración** (ej. "solo reportes") |
| RF-65 | Elegir a qué usuario se le da cada rol |

### 4.3 Lista de espera

| ID | Requerimiento |
|---|---|
| RF-66 | En una función **agotada**, los usuarios registrados se anotan en una **lista de espera** |
| RF-67 | Si alguien cancela y se liberan butacas, se **avisa automáticamente** al primero de la lista |
| RF-68 | El avisado tiene **15 minutos** para comprar; después, el lugar **pasa al siguiente** |
| RF-69 | En el perfil se ve en qué listas está anotado y **en qué posición** |
| RF-70 | En el admin se ve **cuánta gente hay en espera** en cada función |

### 4.4 Cancelación de funciones por el cine

| ID | Requerimiento |
|---|---|
| RF-71 | Desde el admin se **cancela una función completa** |
| RF-72 | Todo lo vendido pasa a **crédito** de cada usuario (el total, **incluido el candy**) |
| RF-73 | Las butacas se liberan |
| RF-74 | Cada comprador afectado recibe una **notificación** |
| RF-75 | Se le ofrece **reubicarse** en otra función de la misma película usando el crédito |
| RF-76 | Es **atómico**: se acredita a todos o a nadie, no puede quedar a medias |

---

## 5. Requerimientos no funcionales y fuera de alcance

### 5.1 No funcionales

| ID | Requerimiento | Fuente |
|---|---|---|
| RNF-01 | Interfaces fáciles de usar para clientes y empleados | mail 28/02 |
| RNF-02 | Ingreso de fechas y horas sin tener que buscar con scroll | mail 28/02 |
| RNF-03 | Estilo visual propio | consigna |
| RNF-04 | PWA | consigna |
| RNF-05 | Supabase como base de datos | consigna |
| RNF-06 | App desplegada con URL pública | consigna |
| RNF-07 | Código en GitHub con README, documentación funcional y documentación técnica | consigna |

### 5.2 Fuera de alcance

| Ítem | Por qué |
|---|---|
| Mapa del cine que indique la sala | El mail del 30/01 dice: *"estamos pensando en agregar una pantalla con un mapa… pero **no tenemos luz verde aún**"*. No es un pedido aprobado. |
| Pago real | Nunca se pide un medio de pago real: el pago es simulado. |
| Push con la app cerrada | Ver A-17: el aviso llega con la app abierta (campanita + notificación del sistema). Con la app cerrada haría falta un servidor de push aparte. |

---

## 6. Ambigüedades y cómo se resolvieron

### A-01 · Las filas J y K
El mail del 12/02 dice primero que las filas J y K *"se quitaron para dar espacio a una fila"* accesible, y en el mismo mail habla de *"las filas J y K adaptadas para discapacidad"*.
**Decisión:** J y K siguen existiendo como **filas accesibles de 2 + 10 + 2 butacas**. Así la sala mantiene 20 filas (A–T, sin Ñ) y R, S y T siguen siendo las tres últimas (VIP).

| Tipo | Filas | Butacas |
|---|---|---|
| Normal | A–I, L–Q | 420 |
| Accesible | J, K | 28 |
| VIP | R, S, T | 84 |
| **Total por sala** | 20 filas | **532** |

### A-02 · ¿Cuántas salas?
La consigna dice "varias". **Decisión:** 8 salas, 2 de cada formato (2D, 3D, 4D, 5D). El formato de la sala es fijo y una función solo puede ir en una sala de su formato.

### A-03 · Un QR para entradas y candy
El QR *"deja de funcionar"* al validarse (06/02), pero con el *"mismo QR"* se retira el candy (30/01).
**Decisión:** un QR por compra con **dos usos independientes**: *validar entrada* (sala) y *entregar candy* (candy bar). Cada uno se puede hacer **una sola vez**.

### A-04 · Orden de precios y descuentos
Nunca se especifica. **Decisión:**
1. Precio de la película (o el de **preventa**, si corresponde).
2. VIP = precio + 50%.
3. Combos (precio fijo, cada uno incluye una entrada general) + productos del candy.
4. − lo canjeado con **puntos**.
5. − **un solo cupón**, en porcentaje sobre lo que queda.
6. = **Total**. Se puede pagar en parte o todo con **crédito**; el resto, con tarjeta.
7. Puntos ganados = 1 por cada peso del total.

### A-05 · Cupones
Bienvenida (30/01: *"configurarlo, cambiar el porcentaje"*) y mayores de 50.
**Decisión:** tabla `cupones` con tres tipos:
- *Bienvenida*: automático en la **primera compra** de un registrado; se gasta al usarlo.
- *Mayores de 50*: automático si la edad, calculada con la fecha de nacimiento, es 50 o más.
- *Con código*: lo escribe cualquiera.

Los cupones **no se acumulan**: viene elegido el de mayor porcentaje y el usuario puede cambiarlo.

### A-06 · Restricción de edad y compra anónima
De un anónimo no se conoce la edad. **Decisión:** el registrado menor no puede comprar (la base lo valida). El anónimo tiene que aceptar una **declaración de edad**. La entrada aclara que los menores van con un adulto.

### A-07 · Tiempo real de las butacas
**Decisión:** una butaca se ve ocupada **apenas se vende**. Si dos personas pagan la misma butaca al mismo tiempo, la base acepta a la primera y rechaza a la segunda.

### A-08 · Cancelación (por el cliente)
El mail solo habla del crédito. **Decisión:**
- **Quién puede cancelar:** solo el dueño de la compra (el anónimo no tiene cuenta donde acreditar).
- **Cuándo:** hasta 2 horas antes de la función y si no usó la entrada ni el candy.
- **Butacas:** se liberan y se pueden volver a vender (y, si la función tenía lista de espera, se le avisa al primero).
- **Crédito:** se acredita el total de la compra.
- **Puntos:** se descuentan los que dio esa compra y se devuelven los que canjeó.

### A-09 · Canje de puntos
**Decisión:**
- **Qué se canjea:** entradas generales (también la que trae un combo), combos enteros y los productos configurados con precio en puntos. Las VIP no se canjean.
- **Cuánto cuestan:** el admin configura los puntos de la entrada, de cada producto y de cada combo.

### A-10 · Preventa
**Decisión:**
- **Cuándo abre:** con la preventa activa, la venta abre 7 días antes del estreno, aunque la película siga en "Próximamente".
- **Precio:** se cobra el de preventa **hasta el día del estreno**; desde ese día, el normal.
- **Funciones:** las de una película en preventa van desde el día del estreno.

### A-11 · Sin sala libre
RF-19 no dice qué pasa si todas las salas del formato están ocupadas. **Decisión:** no se crea esa función y se le avisa al admin en qué fechas no había sala. Nunca se crea una función solapada.

### A-12 · Alerta de estreno
**Decisión:** la "notificación" es un **aviso en el home** cuando la película de la alerta ya se puede comprar (preventa abierta o en cartelera). Se muestra hasta que el usuario lo cierra.

### A-13 · Propuestas: "una a la vez" y "que no estén en la cartelera" (recuperatorio)
**Decisión:**
- **Una a la vez** = una propuesta **pendiente** por cliente. Cuando el admin la acepta o la rechaza, puede mandar otra.
- **Que no esté en la cartelera:** no se puede proponer una película que está **en cartelera o en Próximamente** (sin importar mayúsculas). Una **archivada** sí se puede volver a pedir.
- Hay que estar registrado: la propuesta queda a nombre del cliente y se le avisa cómo terminó.

### A-14 · Aceptar una propuesta (recuperatorio)
El mail dice que al aceptar *"debería llevarnos a la pantalla de crear una película con los datos enviados"*.
**Decisión:**
- "Aceptar" abre el alta de película con el **título** y la **descripción** (como sinopsis) ya cargados. El admin completa lo que el cliente no sabe: duración, precio, géneros y póster.
- La propuesta queda **aceptada recién cuando se guarda la película**. Si el admin se arrepiente y cancela el formulario, sigue pendiente.
- Al aceptarla o rechazarla (con un motivo opcional), al cliente le llega una **notificación**.

### A-15 · Roles configurables (recuperatorio)
**Decisión:**
- Los tres roles de siempre (**cliente / empleado / admin**) no cambian. Se agrega un **rol del panel** opcional: un cliente o empleado con el rol "Solo reportes" entra al panel y ve **solo** la pestaña Reportes.
- Secciones que se pueden dar: Películas, Funciones, Candy, Cupones, Reportes, Propuestas y Actividad.
- **Usuarios y Roles quedan siempre solo para el admin.** Si se pudieran dar, alguien con ese rol podría darse más permisos a sí mismo (escalar privilegios).
- Crear roles y asignarlos lo hace solo el admin. El admin no se puede cambiar su propio rol.

### A-16 · Lista de espera: cuándo y cómo se reserva el lugar (recuperatorio)
**Decisión:**
- **Agotada** = no queda ninguna butaca que se pueda comprar. Recién ahí aparece "Anotarme en la lista de espera".
- Un usuario está **una sola vez** en la lista de cada función. Se puede ir cuando quiera.
- Cuando se liberan butacas, el primero de la lista recibe el **turno**: esa butaca queda **reservada para él durante 15 minutos** y nadie más la puede comprar. Si se liberan 2 butacas, se les da turno a los 2 primeros.
- Si compra, sale de la lista. Si en 15 minutos no compra, el turno **vence solo** y el lugar pasa al siguiente (o queda libre para cualquiera si no hay nadie más).
- Si la función empieza o el cine la cancela, la lista se cierra.

### A-17 · "Notificación push" (recuperatorio)
**Decisión:** el aviso es una **notificación dentro de la app** (la campanita del header, que se actualiza en tiempo real) y además una **notificación del sistema** (el cartel del navegador en la esquina de la pantalla), si el usuario dio permiso. El permiso se pide al anotarse en una lista de espera.
**Límite declarado:** llega mientras el sitio está abierto en alguna pestaña. Con el sitio cerrado haría falta un servidor de push aparte.

### A-18 · Cancelación de una función por el cine (recuperatorio)
**Decisión:**
- **Cuándo:** mientras la función no terminó (también si ya empezó, por una falla en el medio). Se pide un **motivo**.
- **Crédito:** a cada comprador con cuenta se le acredita **el total de su compra** (entradas + candy, también lo pagado con crédito). Los puntos se ajustan igual que en A-08.
- **Compras sin cuenta:** el crédito va al **mail que se escribió en el checkout**.
  - Si ya hay una cuenta con ese mail, se le acredita en el momento, con su notificación.
  - Si no hay, el crédito queda **guardado a nombre de ese mail**. Cuando alguien se registra con ese mail, se le suma solo a su crédito y le llega una notificación.
  - Límite declarado: al registrarse no se confirma el mail, así que lo reclama quien se registre con esa dirección. Es el mismo nivel que la compra anónima, cuyo mail tampoco se verifica.
- **Reubicación:** la notificación y la compra cancelada tienen el botón **"Elegir otra función"**, que lleva a los otros horarios de la película. Ahí se compra pagando con el crédito.
- **La función no se borra:** queda marcada como cancelada con su motivo (así no se pierde el historial). No se vende más, desaparece de la cartelera y su horario de sala queda libre para programar otra.
- **Atómico:** se acredita a todos o a nadie.
- Por eso ya **no se pueden borrar funciones**: borrar una función con ventas haría desaparecer las compras. Para sacarla está "Cancelar función".

---

## 7. Reglas de negocio

| # | Regla | Dónde se controla |
|---|---|---|
| RN-01 | Dos funciones no canceladas nunca se pisan en la misma sala, con 30 min de margen | restricción `exclude` en la tabla `funciones` |
| RN-02 | La sala se asigna automáticamente | panel de funciones |
| RN-03 | Una butaca no se vende dos veces | índice único en `compra_entradas` |
| RN-04 | El precio lo calcula la base | función `comprar_entradas` |
| RN-05 | Un menor no compra películas restringidas | función `comprar_entradas` |
| RN-06 | Entrada y candy se validan una sola vez cada uno | `validar_entrada` y `entregar_candy` |
| RN-07 | Cancelación del cliente solo hasta 2 h antes | `cancelar_compra` |
| RN-08 | Los puntos no se transfieren | `perfiles` no tiene permiso de escritura desde la app |
| RN-09 | Las acciones del admin y del empleado quedan en el log | tabla `actividad` |
| RN-10 | Un cliente tiene como mucho una propuesta pendiente | índice único parcial en `propuestas` + `proponer_pelicula` |
| RN-11 | Solo el admin (o un rol con "Propuestas") acepta o rechaza propuestas | `aceptar_propuesta` / `rechazar_propuesta` |
| RN-12 | Un rol del panel solo da acceso a sus secciones; Usuarios y Roles son solo del admin | `adminChildGuard` + función `puede_acceder` en la base |
| RN-13 | Nadie se pone un rol ni edita el suyo | RLS de `perfiles` y `roles` |
| RN-14 | Uno se anota en la lista de espera solo si la función está agotada, y una vez por función | `anotarme_espera` + índice único parcial |
| RN-15 | Una butaca liberada queda reservada 15 min para el que tiene el turno | `comprar_entradas` (resta los turnos activos de otros) |
| RN-16 | El turno vencido pasa al siguiente aunque nadie toque nada | `procesar_lista_espera`, que corre cada minuto con `pg_cron` |
| RN-17 | La cancelación de una función es atómica | función `cancelar_funcion` (una sola transacción) |
| RN-18 | No se vende una función cancelada | `comprar_entradas` |
| RN-19 | El crédito de una compra sin cuenta cancelada por el cine queda guardado por mail y se acredita al registrarse con ese mail | `cancelar_funcion` + trigger en `perfiles` |
