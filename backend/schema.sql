PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dni TEXT NOT NULL UNIQUE CHECK(length(dni) = 8),
    nombres TEXT NOT NULL, apellidos TEXT NOT NULL,
    correo TEXT UNIQUE, password_hash TEXT NOT NULL, telefono TEXT,
    rol TEXT NOT NULL DEFAULT 'CLIENTE' CHECK(rol IN ('ADMIN','TAQUILLERO','CHOFER','CLIENTE')),
    fecha_registro TEXT DEFAULT (datetime('now','localtime')));
CREATE TABLE IF NOT EXISTS pasajeros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_documento TEXT NOT NULL DEFAULT 'DNI' CHECK(tipo_documento IN ('DNI','PASAPORTE','CE')),
    numero_documento TEXT NOT NULL UNIQUE, nombres TEXT NOT NULL, apellidos TEXT NOT NULL,
    fecha_nacimiento TEXT, telefono TEXT);
CREATE TABLE IF NOT EXISTS terminales (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ciudad TEXT NOT NULL, nombre_agencia TEXT NOT NULL,
    direccion TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0,1)));
CREATE TABLE IF NOT EXISTS rutas (
    id INTEGER PRIMARY KEY AUTOINCREMENT, terminal_origen_id INTEGER NOT NULL, terminal_destino_id INTEGER NOT NULL,
    distancia_km REAL, duracion_horas REAL NOT NULL,
    FOREIGN KEY (terminal_origen_id) REFERENCES terminales(id),
    FOREIGN KEY (terminal_destino_id) REFERENCES terminales(id),
    CHECK (terminal_origen_id != terminal_destino_id));
CREATE TABLE IF NOT EXISTS buses (
    id INTEGER PRIMARY KEY AUTOINCREMENT, placa TEXT NOT NULL UNIQUE, marca TEXT NOT NULL, modelo TEXT,
    tipo_servicio TEXT NOT NULL CHECK(tipo_servicio IN ('ECONOMICO','EJECUTIVO','CAMA_160','VIP_180')),
    total_pisos INTEGER NOT NULL DEFAULT 1 CHECK(total_pisos IN (1,2)),
    capacidad_total INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK(estado IN ('ACTIVO','MANTENIMIENTO','BAJA')));
CREATE TABLE IF NOT EXISTS asientos_plantilla (
    id INTEGER PRIMARY KEY AUTOINCREMENT, bus_id INTEGER NOT NULL, numero_asiento INTEGER NOT NULL,
    piso INTEGER NOT NULL DEFAULT 1 CHECK(piso IN (1,2)), fila INTEGER NOT NULL, columna INTEGER NOT NULL,
    ubicacion TEXT NOT NULL CHECK(ubicacion IN ('VENTANA','PASILLO','CENTRO')),
    recargo_precio REAL NOT NULL DEFAULT 0.0,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    UNIQUE(bus_id, numero_asiento));
CREATE TABLE IF NOT EXISTS programacion_viajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ruta_id INTEGER NOT NULL, bus_id INTEGER NOT NULL, chofer_id INTEGER,
    fecha_salida TEXT NOT NULL, hora_salida TEXT NOT NULL, precio_base REAL NOT NULL,
    estado TEXT NOT NULL DEFAULT 'PROGRAMADO' CHECK(estado IN ('PROGRAMADO','ABORDANDO','EN_RUTA','FINALIZADO','CANCELADO')),
    FOREIGN KEY (ruta_id) REFERENCES rutas(id), FOREIGN KEY (bus_id) REFERENCES buses(id),
    FOREIGN KEY (chofer_id) REFERENCES usuarios(id));
CREATE TABLE IF NOT EXISTS boletos_reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT, programacion_viaje_id INTEGER NOT NULL, asiento_plantilla_id INTEGER NOT NULL,
    pasajero_id INTEGER NOT NULL, vendedor_id INTEGER, precio_final REAL NOT NULL,
    estado_pago TEXT NOT NULL DEFAULT 'BLOQUEADO' CHECK(estado_pago IN ('BLOQUEADO','PAGADO','ANULADO')),
    codigo_qr TEXT UNIQUE, fecha_emision TEXT DEFAULT (datetime('now','localtime')), fecha_expiracion_bloqueo TEXT,
    FOREIGN KEY (programacion_viaje_id) REFERENCES programacion_viajes(id),
    FOREIGN KEY (asiento_plantilla_id) REFERENCES asientos_plantilla(id),
    FOREIGN KEY (pasajero_id) REFERENCES pasajeros(id),
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id));
CREATE UNIQUE INDEX IF NOT EXISTS idx_unico_asiento_viaje ON boletos_reservas (programacion_viaje_id, asiento_plantilla_id) WHERE estado_pago != 'ANULADO';
CREATE INDEX IF NOT EXISTS idx_busqueda_viajes ON programacion_viajes (ruta_id, fecha_salida, estado);

INSERT INTO terminales (ciudad, nombre_agencia, direccion) VALUES
('Lima','Terminal Terrestre Atocongo','Av. Los Héroes 123, SJM'),
('Ayacucho','Terrapuerto Municipal Libertadores','Av. Pérez de Cuéllar s/n'),
('Huancayo','Gran Terminal Terrestre Huancayo','Av. Evitamiento Norte'),
('Cusco','Terminal Terrestre de Cusco','Vía de Evitamiento 429');
INSERT INTO rutas (terminal_origen_id, terminal_destino_id, distancia_km, duracion_horas) VALUES (1,2,575.0,10.5),(2,1,575.0,10.5),(2,4,590.0,11.5);
INSERT INTO buses (placa, marca, modelo, tipo_servicio, total_pisos, capacidad_total) VALUES ('A1B-950','Scania','Marcopolo G8','CAMA_160',2,44);
INSERT INTO asientos_plantilla (bus_id, numero_asiento, piso, fila, columna, ubicacion, recargo_precio) VALUES
(1,1,1,1,1,'VENTANA',25.0),(1,2,1,1,2,'PASILLO',25.0),(1,3,1,1,4,'VENTANA',25.0),(1,4,1,2,1,'VENTANA',25.0),
(1,13,2,1,1,'VENTANA',0.0),(1,14,2,1,2,'PASILLO',0.0),(1,15,2,1,3,'PASILLO',0.0),(1,16,2,1,4,'VENTANA',0.0);
INSERT INTO programacion_viajes (ruta_id, bus_id, fecha_salida, hora_salida, precio_base) VALUES (1,1,'2026-10-20','21:30',80.00);
INSERT INTO pasajeros (tipo_documento, numero_documento, nombres, apellidos, telefono) VALUES ('DNI','71234567','Carlos','Mendoza','987654321');
INSERT INTO boletos_reservas (programacion_viaje_id, asiento_plantilla_id, pasajero_id, precio_final, estado_pago, codigo_qr) VALUES
(1,1,1,105.00,'PAGADO','QR-VIAJE1-ASIENTO1-71234567');
