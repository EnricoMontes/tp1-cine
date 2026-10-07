# SignalCine · Documento de requerimientos

Trabajo Práctico 1 de **Programación IV** (UTN FRA, comisión A342-2) · Enrico Montes.

Este documento resume **todos los requerimientos** que pide el cliente en la cadena de mails de la consigna, las **ambigüedades** que aparecen entre un mail y otro y **cómo se resolvió cada una**. La arquitectura y las decisiones técnicas están en el [README](../README.md).

---

## 1. Actores

| Actor | Cómo entra | Qué puede hacer |
|---|---|---|
| **Anónimo** | sin cuenta | ver cartelera y reseñas, comprar entradas y candy |
| **Cliente registrado** | Supabase Auth | todo lo anterior + cupones automáticos, puntos y canje, crédito, cancelar compras, reseñas, "Mis películas", alertas de estreno |
| **Empleado** | cuenta con rol `empleado` | validar la entrada y entregar el candy con el QR o el código escrito a mano |
| **Administrador** | cuenta con rol `admin` | películas, salas, funciones, candy y combos, cupones, puntos de canje, reportes y log de actividad |

---

## 2. Requerimientos funcionales

Cada requerimiento tiene un ID (`RF-nn`) y la fecha del mail que lo pide.

### 2.1 Películas y cartelera

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

### 2.2 Salas y funciones

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

### 2.3 Usuarios

| ID | Requerimiento | Mail |
|---|---|---|
| RF-20 | Registro con mail, nombre, apellido, fecha de nacimiento, tipo de sangre, color de ojos y días de vacaciones | 01/01 |
| RF-21 | Se puede comprar sin registrarse | 01/01 |
| RF-22 | Un menor no puede comprar entradas de películas con restricción | 12/02 |
| RF-23 | La entrada de una película restringida aclara que los menores van con un adulto | 12/02 |

### 2.4 Compra de entradas

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

### 2.5 Candy

| ID | Requerimiento | Mail |
|---|---|---|
| RF-32 | ABM de productos del candy | 30/01 |
| RF-33 | Productos agrupados en categorías | 30/01 |
| RF-34 | El candy se compra junto con la entrada | 30/01 |
| RF-35 | Se retira con el mismo QR de la entrada | 30/01 |
| RF-36 | Combos (entrada + pochoclos + bebida) a precio fijo configurable | 03/03 |
| RF-37 | Los combos aparecen destacados en la compra | 03/03 |

### 2.6 Cupones, puntos, preventa

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

### 2.7 Reseñas

| ID | Requerimiento | Mail |
|---|---|---|
| RF-47 | Calificar con estrellas y dejar un comentario corto | 16/01 |
| RF-48 | Las reseñas se ven antes de sacar las entradas | 16/01 |
| RF-49 | Puntuación promedio de cada película | 16/01 |
| RF-50 | "Mis películas": historial con pósters, fechas y la calificación propia | 08/03 |

### 2.8 Administración

| ID | Requerimiento | Mail |
|---|---|---|
| RF-51 | Un admin controla salas, funciones, butacas y productos | 06/02 |
| RF-52 | Reporte de facturación por día y entradas vendidas | 28/02 |
| RF-53 | Exportar la facturación a PDF y a Excel | 10/03 |
| RF-54 | Gráfico de películas más vistas por semana y por mes | 10/03 |
| RF-55 | Producto del candy que más se vende | 10/03 |
| RF-56 | Log de actividad: quién creó qué función, quién cambió un precio, quién validó un QR, con fecha y hora | 10/03 |

### 2.9 Empleados

| ID | Requerimiento | Mail |
|---|---|---|
| RF-57 | Empleados que escanean el QR para validar entradas y candy | 06/02 |
| RF-58 | El código se puede ingresar a mano | 06/02 |
| RF-59 | Una vez validada la entrada o entregada la comida, el QR deja de funcionar | 06/02 |

### 2.10 No funcionales

| ID | Requerimiento | Fuente |
|---|---|---|
| RNF-01 | Interfaces fáciles de usar para clientes y empleados | mail 28/02 |
| RNF-02 | Ingreso de fechas y horas sin tener que buscar con scroll | mail 28/02 |
| RNF-03 | Estilo visual propio | consigna |
| RNF-04 | PWA | consigna |
| RNF-05 | Supabase como base de datos | consigna |
| RNF-06 | App desplegada con URL pública | consigna |
| RNF-07 | Código en GitHub con README de arquitectura y decisiones | consigna |

### 2.11 Fuera de alcance

| Ítem | Por qué |
|---|---|
| Mapa del cine que indique la sala | El mail del 30/01 dice: *"estamos pensando en agregar una pantalla con un mapa… pero **no tenemos luz verde aún**"*. No es un pedido aprobado. |
| Pago real | Nunca se pide un medio de pago real: el pago es simulado. |

---

## 3. Ambigüedades y cómo se resolvieron

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

### A-08 · Cancelación
El mail solo habla del crédito. **Decisión:**
- **Quién puede cancelar:** solo el dueño de la compra (el anónimo no tiene cuenta donde acreditar).
- **Cuándo:** hasta 2 horas antes de la función y si no usó la entrada ni el candy.
- **Butacas:** se liberan y se pueden volver a vender.
- **Crédito:** se acredita el total de la compra.
- **Puntos:** se descuentan los que dio esa compra y se devuelven los que canjeó.

### A-09 · Canje de puntos
**Decisión:**
- **Qué se canjea:** entradas generales (también la que trae un combo) y los productos configurados con precio en puntos. Las VIP no se canjean.
- **Cuánto cuestan:** el admin configura los puntos de la entrada y de cada producto.

### A-10 · Preventa
**Decisión:**
- **Cuándo abre:** con la preventa activa, la venta abre 7 días antes del estreno, aunque la película siga en "Próximamente".
- **Precio:** se cobra el de preventa **hasta el día del estreno**; desde ese día, el normal.
- **Funciones:** las de una película en preventa van desde el día del estreno.

### A-11 · Sin sala libre
RF-19 no dice qué pasa si todas las salas del formato están ocupadas. **Decisión:** no se crea esa función y se le avisa al admin en qué fechas no había sala. Nunca se crea una función solapada.

### A-12 · Alerta de estreno
**Decisión:** la "notificación" es un **aviso en el home** cuando la película de la alerta ya se puede comprar (preventa abierta o en cartelera). Se muestra hasta que el usuario lo cierra.

---

## 4. Reglas de negocio

| # | Regla | Dónde se controla |
|---|---|---|
| RN-01 | Dos funciones nunca se pisan en la misma sala, con 30 min de margen | restricción `exclude` en la tabla `funciones` |
| RN-02 | La sala se asigna automáticamente | panel de funciones |
| RN-03 | Una butaca no se vende dos veces | índice único en `compra_entradas` |
| RN-04 | El precio lo calcula la base | función `comprar_entradas` |
| RN-05 | Un menor no compra películas restringidas | función `comprar_entradas` |
| RN-06 | Entrada y candy se validan una sola vez cada uno | `validar_entrada` y `entregar_candy` |
| RN-07 | Cancelación solo hasta 2 h antes | `cancelar_compra` |
| RN-08 | Los puntos no se transfieren | `perfiles` no tiene permiso de escritura desde la app |
| RN-09 | Las acciones del admin y del empleado quedan en el log | tabla `actividad` |
