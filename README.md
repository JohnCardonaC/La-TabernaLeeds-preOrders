# La Taberna - Sistema de Pre-Órdenes para Grupos

## 1. El Problema que se Resuelve

Este proyecto aborda la gestión de reservas de grupos (+6 personas) para el restaurante La Taberna. El alto volumen de pedidos de estos grupos, gestionados a través de `resdiary.com`, sobrecarga la capacidad de la cocina. El objetivo es crear una solución que automatice el proceso de pre-orden para estos grupos, permitiendo a la cocina prepararse con antelación, optimizar recursos y mejorar la eficiencia del servicio.

## 2. La Solución

Se está construyendo un sistema automatizado en dos fases principales:

### Fase 1: Automatización y Almacenamiento de Datos (Completada)

Un agente de automatización (Google Apps Script) monitorea un buzón de Gmail en busca de correos de reserva de `resdiary.com`. Este agente extrae los datos clave de la reserva y los almacena de forma segura en una base de datos de **Supabase**. Esto elimina la necesidad de procesar manualmente cada correo electrónico.

### Fase 2: Portal de Pre-Órdenes y Notificaciones (En Desarrollo)

Esta es la fase actual del proyecto, que se está desarrollando en este repositorio. El objetivo es construir dos aplicaciones web y la lógica de backend necesaria:

1.  **Página de Pre-Orden (para el Cliente):** Una página web a la que los clientes accederán a través de un enlace único enviado por correo electrónico. Aquí podrán ver los detalles de su reserva y seleccionar los platos para su grupo.
2.  **Panel de Administración (para el Staff):** Un panel interno donde el personal del restaurante podrá gestionar los menús, ver las reservas del día y revisar las pre-órdenes enviadas por los clientes.
3.  **Notificaciones Automáticas:** Una función automatizada (*Edge Function* en Supabase) que se activará con cada nueva reserva, generará el enlace único y lo enviará por correo electrónico al cliente.

## 3. Stack Tecnológico

*   **Frontend:** Next.js 14 (App Router) con TypeScript
*   **Estilos:** Tailwind CSS
*   **Base de Datos:** Supabase (PostgreSQL)
*   **Autenticación:** Supabase Auth
*   **Despliegue:** Vercel
*   **Validación de Datos:** Zod
*   **Gestión de Estado del Servidor:** TanStack React Query
