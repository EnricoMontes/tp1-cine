# SignalCine

Sistema web de un cine: cartelera, compra de entradas y candy con elección de butacas en tiempo real, programa de puntos, panel de administración con roles configurables, validación de entradas por QR, lista de espera para funciones agotadas y notificaciones.

Trabajo Práctico 1 de **Programación IV** (UTN FRA, comisión A342-2) · Enrico Montes.

- **App deployada:** https://cine-progra-4.web.app
- **Repositorio:** https://github.com/EnricoMontes/tp1-cine

## Documentación

La documentación está separada en dos partes:

| Documento | Qué tiene |
|---|---|
| 📋 [**Funcional**](docs/FUNCIONAL.md) | **Qué hace el sistema**: actores, requerimientos de los mails y del recuperatorio (`RF-nn`), no funcionales, fuera de alcance, ambigüedades y cómo se resolvió cada una (`A-nn`) y reglas de negocio (`RN-nn`). |
| 🛠️ [**Técnica**](docs/TECNICO.md) | **Cómo está hecho y por qué**: stack, arquitectura (rutas, componentes, servicios, guards), base de datos (tablas, funciones SQL, RLS, Realtime, `pg_cron`), decisiones técnicas, cómo se resolvió cada punto del recuperatorio, deploy y PWA. |

---

## Stack

Angular 22.1 (standalone, signals, `@if` / `@for`) · TypeScript 6.0 · Supabase (PostgreSQL, Auth, Storage, Realtime) · Firebase Hosting · PWA · `qrcode`, `jspdf`, `xlsx`.

El detalle y el porqué de cada uno están en la [documentación técnica](docs/TECNICO.md#1-stack).

## Cómo correrlo

```bash
npm install
npx ng serve                       # http://localhost:4200
```

Deploy:

```bash
npx ng build
firebase deploy --only hosting
```

## Usuarios de prueba

| Rol | Mail | Contraseña |
|---|---|---|
| Cliente | enrumontes+prueba1@gmail.com | 1234567 |
| Administrador | enrumontes+admin@gmail.com | 1234567 |
| Empleado | enrumontes+empleado@gmail.com | 1234567 |

También se puede comprar **sin cuenta** (compra anónima). Para iniciar sesión se usa el **ícono de usuario** del header, que abre el panel lateral.

## Nombre

**SignalCine**: por los *signals* de Angular, que se usan en toda la app para el estado, y por la idea de una señal que llega a la pantalla del cine.
