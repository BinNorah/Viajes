# Rutas del Perú · Sistema de Viajes Interprovinciales

Plataforma integral para la gestión y venta de pasajes de transporte terrestre interprovincial. Desarrollada con arquitectura desacoplada: **Frontend en Angular 21 (SPA)** y **Backend en Python Flask (100% REST API)** con base de datos **SQLite 3 (WAL mode)**.

---

## 📚 Material de Estudio Incluido

En la raíz del proyecto se encuentra disponible la **[Guía de Estudio Completa (PDF)](./Guia_Estudio_Sistema_Viajes.pdf)** (`Guia_Estudio_Sistema_Viajes.pdf`), la cual detalla:
- Arquitectura del sistema y flujo de datos SPA -> REST API -> SQLite.
- Modelo de datos y restricciones de integridad (prevención de sobreventa de asientos con índices únicos condicionales).
- Desglose y explicación línea por línea de los módulos del Backend (`backend/app.py`).
- Organización modular del Frontend (Angular 21 Standalone Components, Signals y separación limpia de `.ts`, `.html` y `.css`).
- Flujos por rol (Pasajero, Taquillero POS, Conductor y Administrador).
- Preguntas conceptuales y respuestas para exámenes o sustentaciones de software.

---

## 🛠 Requisitos del Entorno

- **Python 3.10** o superior
- **Node.js 18+** y **npm**

---

## 🚀 Puesta en Marcha

### 1. Backend (Python Flask)

Desde una terminal:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

El servidor REST API iniciará en `http://127.0.0.1:5000`. Utiliza la base de datos `viajes_interprovinciales.db` con soporte para bloqueos atómicos temporales de 10 minutos y transacciones concurrentes.

### 2. Frontend (Angular 21)

En otra terminal:

```bash
cd frontend
npm install
npm start
```

La aplicación web estará disponible en `http://localhost:4200`. El archivo `proxy.conf.json` redirige automáticamente todas las peticiones con prefijo `/api` al backend Flask en el puerto 5000.

---

## 👥 Módulos y Roles

1. **Portal Público (Pasajeros):** Búsqueda de pasajes, mapa interactivo de asientos por pisos (Piso 1 / Piso 2), bloqueo en tiempo real, formulario de pasajero y emisión de boleto con código QR.
2. **Historial de Viajes:** Login de pasajeros para consultar el historial de reservas y reimpresión de boletos.
3. **Taquilla (POS Ventanilla):** Venta directa en mostrador físico, cobro rápido y anulación de pasajes con liberación instantánea de asientos.
4. **Módulo Conductor (Chofer):** Panel de turnos asignados y manifiesto oficial de pasajeros para el control de abordaje en andén.
5. **Panel de Administración (Admin):**
   - **Dashboard Ejecutivo:** KPIs de recaudación, pasajes vendidos, flota activa y destinos.
   - **CRUD Completo:** Gestión de Flota de Buses, Rutas, Terminales y Programación de Salidas (con confirmación modal segura).
   - **Gestión de Reservas:** Monitoreo y auditoría de todas las compras.
   - **Reportes Financieros:** Estadísticas de ocupación porcentual e ingresos por ruta.

