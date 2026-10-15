# Rutas del Perú

Aplicación de gestión de viajes interprovinciales. El proyecto tiene un backend Flask con SQLite y un frontend Angular.

## Requisitos

- Python 3.10 o superior
- Node.js y npm

## Preparar y ejecutar el backend

Desde PowerShell:

```powershell
cd D:\Transportes\backend
py -m pip install -r requirements.txt
py app.py
```

El backend se inicia en `http://127.0.0.1:5000`. Por defecto utiliza `D:\Transportes\viajes_interprovinciales.db`. Para crear una base de demostración desde la raíz del proyecto, abre `crear_db_limpia.sql` en DB Browser for SQLite y ejecútalo en una base nueva.

## Preparar y ejecutar el frontend

En otra terminal:

```powershell
cd D:\Transportes\frontend
npm install
npm.cmd start
```

Abre `http://localhost:4200`. El proxy de Angular reenvía `/api` al backend en el puerto 5000.

## Módulos

- Búsqueda de viajes y reservas con selección de asientos
- Inicio de sesión y registro de pasajeros
- Taquilla y manifiestos
- Administración de terminales, rutas, buses, viajes y usuarios
- Gestión de reservas, reportes de ventas y ocupación

Las bases SQLite locales, archivos de entorno, dependencias y cachés se excluyen de Git para evitar publicar datos locales o archivos generados.
