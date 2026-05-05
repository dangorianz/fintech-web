# SGIP FinTech Web

Frontend del Sistema de Gestion de Inversiones y Prestamos. Permite simular prestamos, solicitar credito, revisar solicitudes, consultar cronogramas y pagar cuotas desde una interfaz web construida con Next.js.

## Links de despliegue

- Frontend URL: https://fintech-web-two.vercel.app
- Backend URL (Swagger): https://fintech-api-production-7a89.up.railway.app/swagger/index.html
- Credenciales de prueba: no aplica. La aplicacion no tiene login; para pruebas se usa el `User ID` del formulario.

## Tecnologias utilizadas

### Stack del proyecto

- Next.js
- React
- TypeScript
- Tailwind CSS
- API routes de Next.js como proxy hacia el backend
- Vitest

### Librerias principales

- `next`: framework principal del frontend.
- `react` y `react-dom`: construccion de componentes UI.
- `typescript`: tipado estatico.
- `tailwindcss`: estilos utilitarios.
- `eslint`: validacion estatica de codigo.
- `vitest`: entorno de pruebas frontend.
- `@testing-library/react`: utilidades para pruebas de componentes.
- `jsdom`: entorno DOM para pruebas.

### Decisiones tecnicas importantes

- El frontend llama rutas internas `/api` y esas rutas reenvian las solicitudes al backend mediante `FINTECH_API_BASE_URL`.
- Se uso una capa de servicios en `src/services` para transformar los contratos del backend a modelos usados por la UI.
- Se mantuvieron componentes reutilizables para tablas, campos, metricas y banners.
- La tasa efectiva anual se maneja como porcentaje entero: `24` representa 24%.
- Se uso Next.js para desplegar facilmente en Vercel y mantener frontend + proxy en el mismo proyecto.

## Instalacion local

### Prerrequisitos

- Node.js 18+
- npm
- Backend local o backend desplegado disponible

### Frontend

```bash
cd fintech-web
npm install
npm run dev
```

Frontend local:

```text
http://localhost:3000
```

## Variables de entorno

Crear el archivo `fintech-web/.env.local`:

```env
FINTECH_API_BASE_URL=http://localhost:5249/api
```

Para apuntar al backend desplegado:

```env
FINTECH_API_BASE_URL=https://fintech-api-production-7a89.up.railway.app/api
```

## Testing

```bash
cd fintech-web
npm run test
```

Vitest esta configurado para pruebas frontend.

NO SE IMPLEMENTO LOS UNIT TEST POR FALTA DE TIEMPO

## Arquitectura

Estructura principal:

```text
fintech-web/
├── src/app/              # App Router, paginas y API routes
├── src/app/api/          # Proxy hacia el backend
├── src/components/       # Componentes visuales reutilizables
├── src/components/loans/ # Pantallas de prestamos
├── src/components/payments/ # Pantallas de pagos
├── src/services/         # Cliente API y adaptadores de datos
├── src/lib/              # Helpers compartidos
└── src/types/            # Tipos TypeScript del dominio
```

Patrones implementados:

- Service Layer frontend: centraliza llamadas HTTP y transformacion de datos. Implementado en `src/services/loanService.ts` y `src/services/transactions.ts`.
- Adapter Pattern: convierte respuestas del backend a los tipos usados por la UI. Implementado en las funciones `toSimulation`, `toApplicationFromBackendLoan`, `toPaymentScheduleItem` y `fromBackendLoanStatus` dentro de `src/services/loanService.ts`, y en `toTransaction` dentro de `src/services/transactions.ts`.
- API Proxy: las rutas de Next.js evitan exponer directamente la URL final del backend en los componentes. Implementado en `src/lib/fintech-api-proxy.ts` y usado por rutas como `src/app/api/loans/route.ts`, `src/app/api/simulateLoan/route.ts`, `src/app/api/transactions/route.ts` y `src/app/api/loans/[id]/payments/route.ts`.

## Decisiones de diseno

- Se eligio Next.js por su integracion con Vercel, App Router y API routes.
- Se uso TypeScript para reducir errores entre contratos de API y componentes.
- Se uso Tailwind CSS para construir rapido una interfaz consistente.
- Se dejo la UI sin autenticacion porque el backend tampoco maneja login.
- Se priorizo una experiencia funcional para simular, solicitar, consultar y pagar prestamos.

Trade-offs realizados:

- No se implementaron unit test, pruebas de inegracion por falta de tiempo.
- No se implementaron pruebas E2E por falta de tiempo.
- No se agrego manejo avanzado de sesiones o roles.
- El proxy del frontend depende de `FINTECH_API_BASE_URL`; si no esta configurado, las llamadas fallan.

## Supuestos y limitaciones

- El usuario ingresa manualmente un `User ID`.
- La aplicacion asume que el backend esta disponible y responde en el formato esperado.
- La TEA se envia como porcentaje entero: `24` significa 24%.
- Las validaciones principales viven en el backend; el frontend valida campos basicos.
- No hay integration tests en frontend por falta de tiempo.
- No hay autenticacion, roles ni dashboard administrativo separado.

Mejoras futuras:

- Agregar autenticacion y manejo de sesiones.
- Implementar integration tests del proxy y servicios y unit test con vitest.
- Agregar pruebas E2E con Playwright.
- Mejorar validaciones visuales del formulario.
- Agregar estados de carga y errores mas detallados.
- Mejorar accesibilidad y navegacion con teclado.
