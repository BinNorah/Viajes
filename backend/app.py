"""
Rutas del Perú · Backend REST API
Servidor principal en Flask para gestión de viajes, pasajes, ventas y administración.
100% API REST en formato JSON (desacoplado del frontend Angular).
"""
import csv
import io
import os
import sqlite3
import sys
import uuid
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, Response, g, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

# ==========================================================
# CONFIGURACIÓN
# ==========================================================
BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
DB = os.environ.get('DATABASE_PATH', os.path.join(ROOT, 'viajes_interprovinciales.db'))
PRODUCTION = os.environ.get('FLASK_ENV', '').lower() == 'production'

app = Flask(__name__, static_folder=None)
app.secret_key = os.environ.get('SECRET_KEY') or 'clave-local-desarrollo-cambiar-antes-de-produccion'
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=PRODUCTION
)

BLOQUEO_MIN = 10
STAFF = ('ADMIN', 'TAQUILLERO')
ESTADOS_VIAJE = ('PROGRAMADO', 'ABORDANDO', 'EN_RUTA', 'FINALIZADO', 'CANCELADO')
AF = ['numero_asiento', 'piso', 'fila', 'columna', 'ubicacion', 'recargo_precio']

def now():
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

# ==========================================================
# CONEXIÓN Y BASE DE DATOS
# ==========================================================
def conectar():
    from pathlib import Path
    uri = Path(DB).resolve().as_uri() + '?mode=rw'
    con = sqlite3.connect(uri, uri=True, timeout=15)
    con.row_factory = sqlite3.Row
    con.execute('PRAGMA foreign_keys = ON')
    con.execute('PRAGMA busy_timeout = 15000')
    return con

def db():
    if 'db' not in g:
        g.db = conectar()
    return g.db

@app.teardown_appcontext
def cerrar_conexion(error):
    con = g.pop('db', None)
    if con is not None:
        con.close()

def q(sql, args=(), one=False):
    filas = [dict(f) for f in db().execute(sql, args).fetchall()]
    return (filas[0] if filas else None) if one else filas

def run(sql, args=()):
    cur = db().execute(sql, args)
    db().commit()
    return cur.lastrowid

def err(mensaje, codigo=400):
    return jsonify(error=mensaje), codigo

@app.errorhandler(sqlite3.IntegrityError)
def error_integridad(e):
    db().rollback()
    return err(f'Dato inválido, duplicado o relacionado con otros registros: {e}', 400)

@app.errorhandler(sqlite3.OperationalError)
def error_sqlite(e):
    db().rollback()
    app.logger.exception('Error operativo de SQLite')
    return err('No se pudo completar la operación en SQLite. Revisa la terminal del backend.', 500)

def init_db():
    if not os.path.isfile(DB):
        raise FileNotFoundError(f'No se encontró la base de datos: {DB}')
    con = conectar()
    try:
        tablas = {r['name'] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
        req = {'usuarios', 'pasajeros', 'terminales', 'rutas', 'buses', 'asientos_plantilla', 'programacion_viajes', 'boletos_reservas'}
        faltantes = req - tablas
        if faltantes:
            raise RuntimeError(f'Faltan tablas requeridas en la base de datos: {", ".join(sorted(faltantes))}')
        print(f"[OK] Base de datos verificada: {DB}")
    finally:
        con.close()

# ==========================================================
# AUTORIZACIÓN Y SESIÓN
# ==========================================================
def need(*roles):
    def decorador(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            u = session.get('u')
            if not u:
                return err('Inicia sesión', 401)
            if roles and u['rol'] not in roles:
                return err('Sin permiso', 403)
            return f(*args, **kwargs)
        return wrapper
    return decorador

def liberar_vencidos():
    run("""
        UPDATE boletos_reservas
        SET estado_pago = 'ANULADO'
        WHERE estado_pago = 'BLOQUEADO'
          AND fecha_expiracion_bloqueo IS NOT NULL
          AND fecha_expiracion_bloqueo < ?
    """, (now(),))

def login_user(u):
    session['u'] = {
        'id': u['id'], 'rol': u['rol'], 'dni': u['dni'],
        'nombre': f"{u['nombres']} {u['apellidos']}"
    }
    return session['u']

# ==========================================================
# ESTADO DEL SISTEMA (REST JSON PURO)
# ==========================================================
def get_system_stats():
    cur = db().cursor()
    cur.execute("SELECT rol, count(*) FROM usuarios GROUP BY rol")
    roles = dict(cur.fetchall())
    cur.execute("SELECT count(*) FROM terminales WHERE activo = 1")
    term_activos = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM rutas")
    total_rutas = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM buses WHERE estado = 'ACTIVO'")
    buses_activos = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM buses")
    total_buses = cur.fetchone()[0]
    cur.execute("SELECT coalesce(sum(capacidad_total), 0) FROM buses WHERE estado = 'ACTIVO'")
    capacidad = cur.fetchone()[0]
    hoy = datetime.now().strftime('%Y-%m-%d')
    cur.execute("SELECT count(*) FROM programacion_viajes")
    total_viajes = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM programacion_viajes WHERE fecha_salida = ? AND estado = 'PROGRAMADO'", (hoy,))
    viajes_hoy = cur.fetchone()[0]
    cur.execute("SELECT count(*), coalesce(sum(precio_final), 0) FROM boletos_reservas WHERE estado_pago = 'PAGADO'")
    pagados, ingresos = cur.fetchone()
    tablas = ['usuarios', 'terminales', 'rutas', 'buses', 'asientos_plantilla', 'programacion_viajes', 'pasajeros', 'boletos_reservas']
    tablas_info = [{'name': t, 'count': q(f"SELECT count(*) as c FROM {t}", one=True)['c']} for t in tablas]
    db_size = round(os.path.getsize(DB) / 1024, 1) if os.path.exists(DB) else 0
    return {
        'status': 'OPERATIVO', 'timestamp': now(), 'python_version': sys.version.split()[0],
        'sqlite_version': sqlite3.sqlite_version, 'db_size_kb': db_size,
        'usuarios': {'total': sum(roles.values()), 'roles': roles},
        'operacion': {'buses_activos': buses_activos, 'total_buses': total_buses, 'capacidad_flota': capacidad,
                      'terminales_activos': term_activos, 'total_rutas': total_rutas, 'total_viajes': total_viajes, 'viajes_hoy': viajes_hoy},
        'finanzas': {'ingresos_totales': f"{ingresos:,.2f}", 'boletos_pagados': pagados},
        'tablas': tablas_info
    }

@app.get('/dashboard')
@app.get('/api/status')
def dashboard():
    return jsonify(status='OK', mensaje='Backend Rutas del Perú operativo (API JSON)', fecha=now(), stats=get_system_stats())

@app.post('/api/admin/clean-locks')
def api_clean_locks():
    liberar_vencidos()
    return jsonify(ok=True, mensaje='Bloqueos de asientos vencidos liberados correctamente.')

# ==========================================================
# AUTENTICACIÓN
# ==========================================================
@app.post('/api/login')
def login():
    datos = request.get_json(silent=True) or {}
    u = q('SELECT * FROM usuarios WHERE correo = ?', (datos.get('correo'),), one=True)
    if not u or not check_password_hash(u['password_hash'], datos.get('password', '')):
        return err('Credenciales incorrectas', 401)
    session.pop('u', None)
    return jsonify(login_user(u))

@app.post('/api/logout')
def logout():
    session.pop('u', None)
    return jsonify(ok=True)

@app.get('/api/me')
def me():
    return jsonify(session.get('u'))

@app.post('/api/registro')
def registro():
    d = request.get_json(silent=True) or {}
    dni = str(d.get('dni') or '').strip()
    nombres, apellidos, correo = str(d.get('nombres') or '').strip(), str(d.get('apellidos') or '').strip(), str(d.get('correo') or '').strip()
    pwd = d.get('password') or ''
    if not dni.isdigit() or len(dni) != 8:
        return err('El DNI debe tener 8 dígitos')
    if not nombres or not apellidos or not correo:
        return err('Completa nombres, apellidos y correo')
    if len(pwd) < 6:
        return err('La contraseña debe tener al menos 6 caracteres')
    uid = run("""
        INSERT INTO usuarios (dni, nombres, apellidos, correo, password_hash, telefono, rol)
        VALUES (?, ?, ?, ?, ?, ?, 'CLIENTE')
    """, (dni, nombres, apellidos, correo, generate_password_hash(pwd), d.get('telefono')))
    return jsonify(login_user(q('SELECT * FROM usuarios WHERE id = ?', (uid,), one=True)))

# ==========================================================
# VIAJES Y BÚSQUEDAS
# ==========================================================
VSQL = """
SELECT v.*, o.ciudad AS origen, d.ciudad AS destino, o.nombre_agencia AS terminal_origen,
       d.nombre_agencia AS terminal_destino, r.duracion_horas, r.distancia_km,
       b.placa, b.tipo_servicio, b.total_pisos, b.estado AS bus_estado,
       (SELECT COUNT(*) FROM asientos_plantilla WHERE bus_id = b.id) AS asientos_total,
       (SELECT COUNT(*) FROM boletos_reservas x
        WHERE x.programacion_viaje_id = v.id AND x.estado_pago != 'ANULADO'
          AND (x.estado_pago != 'BLOQUEADO' OR x.fecha_expiracion_bloqueo > datetime('now', 'localtime'))) AS ocupados,
       u.nombres || ' ' || u.apellidos AS chofer
FROM programacion_viajes v
JOIN rutas r ON r.id = v.ruta_id
JOIN terminales o ON o.id = r.terminal_origen_id
JOIN terminales d ON d.id = r.terminal_destino_id
JOIN buses b ON b.id = v.bus_id
LEFT JOIN usuarios u ON u.id = v.chofer_id
"""

def add_ocup(filas):
    for v in filas:
        total = v['asientos_total'] or 0
        v['asientos_libres'] = max(total - v['ocupados'], 0)
        v['ocupacion_pct'] = round(100 * v['ocupados'] / total, 1) if total else 0
    return filas

def get_viaje(viaje_id):
    return q(VSQL + ' WHERE v.id = ?', (viaje_id,), one=True)

@app.get('/api/ciudades')
def ciudades():
    return jsonify([f['ciudad'] for f in q('SELECT DISTINCT ciudad FROM terminales WHERE activo = 1 ORDER BY ciudad')])

@app.get('/api/rutas')
def rutas_publicas():
    return jsonify(q("""
        SELECT r.id, o.ciudad AS origen, d.ciudad AS destino, r.distancia_km, r.duracion_horas
        FROM rutas r
        JOIN terminales o ON o.id = r.terminal_origen_id
        JOIN terminales d ON d.id = r.terminal_destino_id
        WHERE o.activo = 1 AND d.activo = 1
        ORDER BY o.ciudad, d.ciudad
    """))

@app.get('/api/viajes')
def viajes():
    filtros = [
        "v.estado IN ('PROGRAMADO', 'ABORDANDO')", "o.activo = 1", "d.activo = 1",
        "b.estado = 'ACTIVO'", "datetime(v.fecha_salida || ' ' || v.hora_salida) >= datetime('now', 'localtime')"
    ]
    args, d = [], request.args
    if d.get('origen'):
        filtros.append('o.ciudad = ?'); args.append(d['origen'])
    if d.get('destino'):
        filtros.append('d.ciudad = ?'); args.append(d['destino'])
    if d.get('fecha'):
        filtros.append('v.fecha_salida = ?'); args.append(d['fecha'])
    if d.get('hoy'):
        filtros.append('v.fecha_salida = ?'); args.append(datetime.now().strftime('%Y-%m-%d'))
    orden = 'v.precio_base, v.hora_salida' if d.get('orden') == 'precio' else 'v.fecha_salida, v.hora_salida, v.precio_base'
    return jsonify(add_ocup(q(f"{VSQL} WHERE {' AND '.join(filtros)} ORDER BY {orden}", args)))

@app.get('/api/viajes/<int:vid>/asientos')
def asientos(vid):
    viaje = get_viaje(vid)
    if not viaje:
        return err('Viaje no existe', 404)
    mis_reservas = session.get('mis_reservas', [])
    filas = q("""
        SELECT a.*, br.id AS reserva_id, br.estado_pago
        FROM asientos_plantilla a
        LEFT JOIN boletos_reservas br ON br.asiento_plantilla_id = a.id
             AND br.programacion_viaje_id = ? AND br.estado_pago != 'ANULADO'
             AND (br.estado_pago != 'BLOQUEADO' OR br.fecha_expiracion_bloqueo > datetime('now', 'localtime'))
        WHERE a.bus_id = ?
        ORDER BY a.piso, a.fila, a.columna
    """, (vid, viaje['bus_id']))
    for a in filas:
        ep = a.pop('estado_pago')
        a['estado'] = 'LIBRE' if not ep else ('BLOQUEADO' if ep == 'BLOQUEADO' else 'OCUPADO')
        a['mio'] = a['reserva_id'] in mis_reservas
        if not a['mio']: a['reserva_id'] = None
        a['precio_base'] = viaje['precio_base']
        a['precio_final'] = round(viaje['precio_base'] + a['recargo_precio'], 2)
    return jsonify(viaje=viaje, asientos=filas)

# ==========================================================
# GESTIÓN DE PASAJEROS Y BOLETOS
# ==========================================================
def upsert_pasajero(d):
    tipo = (d.get('tipo_documento') or 'DNI').upper()
    numero = str(d.get('numero_documento') or '').strip()
    nombres, apellidos = str(d.get('nombres') or '').strip(), str(d.get('apellidos') or '').strip()
    if tipo not in ('DNI', 'PASAPORTE', 'CE'): raise ValueError('Tipo de documento inválido')
    if not numero: raise ValueError('Número de documento requerido')
    if tipo == 'DNI' and (not numero.isdigit() or len(numero) != 8): raise ValueError('El DNI debe tener 8 dígitos')
    if not nombres or not apellidos: raise ValueError('Nombres y apellidos requeridos')
    existente = q('SELECT id FROM pasajeros WHERE numero_documento = ?', (numero,), one=True)
    val = (tipo, nombres, apellidos, d.get('fecha_nacimiento') or None, d.get('telefono'))
    if existente:
        run("UPDATE pasajeros SET tipo_documento=?, nombres=?, apellidos=?, fecha_nacimiento=?, telefono=? WHERE id=?", val + (existente['id'],))
        return existente['id']
    return run("INSERT INTO pasajeros (tipo_documento, nombres, apellidos, fecha_nacimiento, telefono, numero_documento) VALUES (?, ?, ?, ?, ?, ?)", val + (numero,))

def crear_boleto(viaje_id, asiento_id, pasajero_id, vendedor=None, pagado=False):
    viaje = get_viaje(viaje_id)
    if not viaje or viaje['estado'] not in ('PROGRAMADO', 'ABORDANDO'):
        raise ValueError('Viaje no disponible')
    salida = datetime.strptime(f"{viaje['fecha_salida']} {viaje['hora_salida']}", '%Y-%m-%d %H:%M')
    if salida <= datetime.now(): raise ValueError('La salida de este viaje ya pasó')
    if viaje.get('bus_estado') != 'ACTIVO': raise ValueError('El bus asignado no está disponible')
    asiento = q('SELECT * FROM asientos_plantilla WHERE id = ? AND bus_id = ?', (asiento_id, viaje['bus_id']), one=True)
    if not asiento: raise ValueError('El asiento no pertenece al bus del viaje')
    precio = round(viaje['precio_base'] + asiento['recargo_precio'], 2)
    expiracion = (datetime.now() + timedelta(minutes=BLOQUEO_MIN)).strftime('%Y-%m-%d %H:%M:%S') if not pagado else None
    liberar_vencidos()
    try:
        return run("""
            INSERT INTO boletos_reservas (programacion_viaje_id, asiento_plantilla_id, pasajero_id, vendedor_id, precio_final, estado_pago, fecha_expiracion_bloqueo, fecha_emision)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (viaje_id, asiento_id, pasajero_id, vendedor, precio, 'PAGADO' if pagado else 'BLOQUEADO', expiracion, now()))
    except sqlite3.IntegrityError:
        db().rollback()
        raise ValueError('No se pudo reservar: el asiento puede estar ocupado')

def emitir_qr(boleto_id):
    codigo = 'QR-' + uuid.uuid4().hex.upper()
    cur = db().execute("""
        UPDATE boletos_reservas
        SET estado_pago = 'PAGADO', codigo_qr = ?, fecha_expiracion_bloqueo = NULL
        WHERE id = ? AND ((estado_pago = 'BLOQUEADO' AND fecha_expiracion_bloqueo > ?) OR (estado_pago = 'PAGADO' AND codigo_qr IS NULL))
    """, (codigo, boleto_id, now()))
    db().commit()
    return cur.rowcount == 1

def boleto_full(boleto_id):
    return q("""
        SELECT br.id, br.estado_pago, br.precio_final, br.codigo_qr, br.fecha_emision, br.fecha_expiracion_bloqueo,
               br.vendedor_id, br.programacion_viaje_id AS viaje_id, v.fecha_salida, v.hora_salida, v.precio_base,
               v.estado AS estado_viaje, o.ciudad AS origen, o.nombre_agencia AS terminal_origen,
               d.ciudad AS destino, d.nombre_agencia AS terminal_destino, a.numero_asiento, a.piso, a.ubicacion,
               a.recargo_precio, b.placa, b.tipo_servicio, p.tipo_documento, p.numero_documento, p.nombres, p.apellidos, p.telefono
        FROM boletos_reservas br
        JOIN programacion_viajes v ON v.id = br.programacion_viaje_id
        JOIN rutas r ON r.id = v.ruta_id
        JOIN terminales o ON o.id = r.terminal_origen_id
        JOIN terminales d ON d.id = r.terminal_destino_id
        JOIN asientos_plantilla a ON a.id = br.asiento_plantilla_id
        JOIN buses b ON b.id = v.bus_id
        JOIN pasajeros p ON p.id = br.pasajero_id
        WHERE br.id = ?
    """, (boleto_id,), one=True)

def puede_ver(b):
    u = session.get('u')
    if b['id'] in session.get('mis_reservas', []): return True
    if u and (u['rol'] in STAFF or u['dni'] == b['numero_documento']): return True
    return False

def reserva_propia(bid):
    b = boleto_full(bid)
    if not b or bid not in session.get('mis_reservas', []):
        return None, err('Reserva no encontrada', 404)
    return b, None

# ==========================================================
# RESERVAS Y COMPRA WEB
# ==========================================================
@app.post('/api/reservas')
@need('CLIENTE')
def reservar():
    d = request.get_json(silent=True) or {}
    asientos_ids = d.get('asientos_ids') or ([d.get('asiento_id')] if d.get('asiento_id') else None)
    if not asientos_ids: return err('Debes seleccionar al menos un asiento')
    if len(asientos_ids) > 6: return err('El límite máximo por compra es de 6 asientos')
    vid = d.get('viaje_id')
    if not vid: return err('ID de viaje requerido')
    boletos_ids, temporales = [], []
    try:
        for aid in asientos_ids:
            tmp = run("INSERT INTO pasajeros (tipo_documento, numero_documento, nombres, apellidos) VALUES ('DNI', ?, 'PENDIENTE', 'PENDIENTE')",
                      ('TMP-' + uuid.uuid4().hex[:12],))
            temporales.append(tmp)
            boletos_ids.append(crear_boleto(vid, aid, tmp))
    except ValueError as e:
        for bid in boletos_ids: run('DELETE FROM boletos_reservas WHERE id = ?', (bid,))
        for tid in temporales: run('DELETE FROM pasajeros WHERE id = ?', (tid,))
        return err(str(e), 409)
    session['mis_reservas'] = session.get('mis_reservas', []) + boletos_ids
    detalles = [boleto_full(bid) for bid in boletos_ids]
    if isinstance(d.get('asientos_ids'), list):
        return jsonify(reserva=detalles[0], reservas=detalles, total=sum(float(b['precio_final']) for b in detalles), cantidad=len(detalles))
    return jsonify(detalles[0])

@app.put('/api/reservas/<int:bid>/pasajero')
@need('CLIENTE')
def reserva_pasajero(bid):
    b, e = reserva_propia(bid)
    if e: return e
    if b['estado_pago'] != 'BLOQUEADO': return err('La reserva expiró o ya no está pendiente', 409)
    try:
        pid = upsert_pasajero(request.get_json(silent=True) or {})
    except ValueError as ex:
        return err(str(ex))
    ant = q('SELECT pasajero_id FROM boletos_reservas WHERE id = ?', (bid,), one=True)['pasajero_id']
    run('UPDATE boletos_reservas SET pasajero_id = ? WHERE id = ?', (pid, bid))
    if ant != pid: run("DELETE FROM pasajeros WHERE id = ? AND numero_documento LIKE 'TMP-%'", (ant,))
    return jsonify(boleto_full(bid))

@app.post('/api/reservas/<int:bid>/pagar')
@need('CLIENTE')
def reserva_pagar(bid):
    b, e = reserva_propia(bid)
    if e: return e
    if b['estado_pago'] != 'BLOQUEADO': return err('La reserva expiró o ya no está pendiente', 409)
    if b['estado_viaje'] not in ('PROGRAMADO', 'ABORDANDO'): return err('El viaje ya no está disponible', 409)
    if b['numero_documento'].startswith('TMP-'): return err('Registra primero los datos del pasajero')
    d = request.get_json(silent=True) or {}
    tarjeta = ''.join(c for c in str(d.get('tarjeta', '')) if c.isdigit())
    cvv = str(d.get('cvv') or '')
    if not 13 <= len(tarjeta) <= 19: return err('Número de tarjeta inválido')
    if not cvv.isdigit() or len(cvv) not in (3, 4): return err('CVV inválido')
    if tarjeta.endswith('0000'): return err('Pago rechazado por la pasarela simulada', 402)
    if not emitir_qr(bid): return err('La reserva venció o ya fue procesada', 409)
    return jsonify(boleto_full(bid))

@app.delete('/api/reservas/<int:bid>')
@need('CLIENTE')
def reserva_cancelar(bid):
    b, e = reserva_propia(bid)
    if e: return e
    if b['estado_pago'] != 'BLOQUEADO': return err('Solo puedes cancelar reservas pendientes', 409)
    run("UPDATE boletos_reservas SET estado_pago = 'ANULADO' WHERE id = ? AND estado_pago = 'BLOQUEADO'", (bid,))
    return jsonify(ok=True)

@app.post('/api/reservas/checkout')
@need('CLIENTE')
def reserva_checkout():
    d = request.get_json(silent=True) or {}
    items = d.get('boletos') or []
    if not items: return err('No se enviaron boletos para procesar el pago')
    tarjeta = ''.join(c for c in str(d.get('tarjeta', '')) if c.isdigit())
    cvv = str(d.get('cvv') or '')
    if not 13 <= len(tarjeta) <= 19: return err('Número de tarjeta bancaria inválido')
    if not cvv.isdigit() or len(cvv) not in (3, 4): return err('Código CVV inválido')
    if tarjeta.endswith('0000'): return err('Pago rechazado por la pasarela bancaria simulada', 402)
    pagados = []
    try:
        for it in items:
            bid = it.get('id')
            b, e = reserva_propia(bid)
            if e: return e
            if b['estado_pago'] != 'BLOQUEADO': return err(f"El asiento {b.get('numero_asiento', bid)} expiró", 409)
            pid = upsert_pasajero({'tipo_documento': it.get('tipo_documento', 'DNI'), 'numero_documento': it.get('numero_documento', ''),
                                  'nombres': it.get('nombres', ''), 'apellidos': it.get('apellidos', ''), 'telefono': it.get('telefono', ''), 'correo': it.get('correo', '')})
            ant = q('SELECT pasajero_id FROM boletos_reservas WHERE id = ?', (bid,), one=True)['pasajero_id']
            run('UPDATE boletos_reservas SET pasajero_id = ? WHERE id = ?', (pid, bid))
            if ant != pid: run("DELETE FROM pasajeros WHERE id = ? AND numero_documento LIKE 'TMP-%'", (ant,))
            if not emitir_qr(bid): return err(f"No se pudo emitir el boleto {bid}", 409)
            pagados.append(boleto_full(bid))
    except ValueError as ex:
        return err(str(ex), 409)
    return jsonify(mensaje='Compra completada con éxito', boletos=pagados, total=sum(float(b['precio_final']) for b in pagados), cantidad=len(pagados))

@app.post('/api/reservas/cancelar-lote')
@need('CLIENTE')
def reservas_cancelar_lote():
    d = request.get_json(silent=True) or {}
    for bid in (d.get('boletos_ids') or []):
        b, e = reserva_propia(bid)
        if not e and b['estado_pago'] == 'BLOQUEADO':
            run("UPDATE boletos_reservas SET estado_pago = 'ANULADO' WHERE id = ? AND estado_pago = 'BLOQUEADO'", (bid,))
    return jsonify(ok=True)

@app.get('/api/boletos/<int:bid>')
def boleto_get(bid):
    b = boleto_full(bid)
    if not b or not puede_ver(b): return err('Boleto no encontrado', 404)
    return jsonify(b)

@app.get('/api/mis-viajes')
@need()
def mis_viajes():
    filas = q("""
        SELECT br.id FROM boletos_reservas br
        JOIN pasajeros p ON p.id = br.pasajero_id
        WHERE p.numero_documento = ? ORDER BY br.id DESC
    """, (session['u']['dni'],))
    return jsonify([boleto_full(f['id']) for f in filas])

# ==========================================================
# TAQUILLA Y REPORTES OPERATIVOS
# ==========================================================
@app.post('/api/taquilla/venta')
@need(*STAFF)
def venta():
    d = request.get_json(silent=True) or {}
    if d.get('metodo') not in ('EFECTIVO', 'TARJETA'): return err('Método de pago inválido')
    try:
        pid = upsert_pasajero(d.get('pasajero') or {})
        bid = crear_boleto(d.get('viaje_id'), d.get('asiento_id'), pid, vendedor=session['u']['id'], pagado=True)
    except ValueError as e:
        return err(str(e), 409)
    emitir_qr(bid)
    return jsonify(boleto_full(bid))

@app.post('/api/taquilla/anular/<int:bid>')
@need(*STAFF)
def anular(bid):
    b = boleto_full(bid)
    if not b: return err('Boleto no existe', 404)
    if b['estado_pago'] == 'ANULADO': return err('El boleto ya está anulado', 409)
    run("UPDATE boletos_reservas SET estado_pago = 'ANULADO' WHERE id = ?", (bid,))
    return jsonify(ok=True)

@app.get('/api/boletos')
@need(*STAFF)
def boletos_buscar():
    doc, cod = request.args.get('doc', '').strip(), request.args.get('qr', '').strip()
    if not doc and not cod: return jsonify([])
    filas = q("""
        SELECT br.id FROM boletos_reservas br
        JOIN pasajeros p ON p.id = br.pasajero_id
        WHERE p.numero_documento = ? OR br.codigo_qr = ? ORDER BY br.id DESC
    """, (doc, cod))
    return jsonify([boleto_full(f['id']) for f in filas])

@app.get('/api/viajes/<int:vid>/boletos')
@need(*STAFF)
def boletos_viaje(vid):
    return jsonify([boleto_full(f['id']) for f in q("SELECT id FROM boletos_reservas WHERE programacion_viaje_id = ? ORDER BY id DESC", (vid,))])

@app.post('/api/boletos/<int:bid>/reenviar')
@need(*STAFF)
def reenviar(bid):
    b = boleto_full(bid)
    if not b or b['estado_pago'] != 'PAGADO': return err('Solo puedes reenviar boletos pagados', 409)
    correo = (request.get_json(silent=True) or {}).get('correo') or 'destino no especificado'
    return jsonify(ok=True, mensaje=f"Reenvío simulado del boleto {b['codigo_qr']} a {correo}.")

# ==========================================================
# CHOFER Y MANIFIESTO
# ==========================================================
def celda_csv(v):
    if v is None: return ''
    if isinstance(v, str) and v.lstrip().startswith(('=', '+', '-', '@')): return "'" + v
    return v

@app.get('/api/viajes/<int:vid>/manifiesto')
@need('ADMIN', 'TAQUILLERO', 'CHOFER')
def manifiesto(vid):
    viaje = get_viaje(vid)
    if not viaje: return err('Viaje no existe', 404)
    u = session['u']
    if u['rol'] == 'CHOFER' and viaje['chofer_id'] != u['id']:
        return err('Viaje no asignado a este chofer', 403)
    pasajeros = q("""
        SELECT a.numero_asiento, a.piso, p.tipo_documento, p.numero_documento, p.nombres, p.apellidos, p.telefono, br.codigo_qr
        FROM boletos_reservas br
        JOIN asientos_plantilla a ON a.id = br.asiento_plantilla_id
        JOIN pasajeros p ON p.id = br.pasajero_id
        WHERE br.programacion_viaje_id = ? AND br.estado_pago = 'PAGADO'
        ORDER BY a.numero_asiento
    """, (vid,))
    if request.args.get('formato') == 'json':
        return jsonify(viaje=viaje, pasajeros=pasajeros)
    salida = io.StringIO()
    w = csv.writer(salida)
    w.writerow(['MANIFIESTO DE PASAJEROS'])
    w.writerow(['Viaje', vid, f"{viaje['origen']} -> {viaje['destino']}", viaje['fecha_salida'], viaje['hora_salida']])
    w.writerow(['Bus', viaje['placa'], 'Chofer', viaje['chofer'] or '-', 'Total pasajeros', len(pasajeros)])
    w.writerow([])
    w.writerow(['Asiento', 'Piso', 'Tipo doc', 'Número doc', 'Nombres', 'Apellidos', 'Teléfono', 'QR'])
    for p in pasajeros:
        w.writerow([celda_csv(v) for v in p.values()])
    return Response('\ufeff' + salida.getvalue(), mimetype='text/csv', headers={'Content-Disposition': f'attachment; filename=manifiesto_viaje_{vid}.csv'})

@app.get('/api/chofer/viajes')
@need('CHOFER')
def chofer_viajes():
    return jsonify(add_ocup(q(f"{VSQL} WHERE v.chofer_id = ? ORDER BY v.fecha_salida, v.hora_salida", (session['u']['id'],))))

# ==========================================================
# ADMINISTRACIÓN CRUD GENÉRICO
# ==========================================================
ENT = {
    'terminales': ('terminales', ['ciudad', 'nombre_agencia', 'direccion', 'activo'], 'SELECT * FROM terminales ORDER BY ciudad'),
    'rutas': ('rutas', ['terminal_origen_id', 'terminal_destino_id', 'distancia_km', 'duracion_horas'], """
        SELECT r.*, o.ciudad AS origen, d.ciudad AS destino FROM rutas r
        JOIN terminales o ON o.id = r.terminal_origen_id
        JOIN terminales d ON d.id = r.terminal_destino_id ORDER BY r.id
    """),
    'buses': ('buses', ['placa', 'marca', 'modelo', 'tipo_servicio', 'total_pisos', 'capacidad_total', 'estado'], 'SELECT * FROM buses ORDER BY id'),
    'viajes': ('programacion_viajes', ['ruta_id', 'bus_id', 'chofer_id', 'fecha_salida', 'hora_salida', 'precio_base', 'estado'],
               f"{VSQL} ORDER BY v.fecha_salida DESC, v.hora_salida"),
    'usuarios': ('usuarios', ['dni', 'nombres', 'apellidos', 'correo', 'telefono', 'rol'],
                 'SELECT id, dni, nombres, apellidos, correo, telefono, rol, fecha_registro FROM usuarios ORDER BY id')
}

def clean(datos, campos):
    return {c: (None if datos[c] == '' else datos[c]) for c in campos if c in datos}

def validar_chofer(datos):
    cid = datos.get('chofer_id')
    if cid is None: return None
    ch = q('SELECT rol FROM usuarios WHERE id = ?', (cid,), one=True)
    return None if (ch and ch['rol'] == 'CHOFER') else 'El usuario asignado debe tener rol CHOFER'

@app.get('/api/admin/<ent>')
@need('ADMIN')
def admin_list(ent):
    if ent not in ENT: return err('Entidad inválida', 404)
    filas = q(ENT[ent][2])
    return jsonify(add_ocup(filas) if ent == 'viajes' else filas)

@app.post('/api/admin/<ent>')
@need('ADMIN')
def admin_create(ent):
    if ent not in ENT: return err('Entidad inválida', 404)
    tabla, campos, _ = ENT[ent]
    valores = clean(request.get_json(silent=True) or {}, campos)
    if ent == 'usuarios':
        pwd = (request.get_json(silent=True) or {}).get('password') or ''
        if len(pwd) < 6: return err('Contraseña mínima de 6 caracteres')
        valores['password_hash'] = generate_password_hash(pwd)
    if ent == 'viajes':
        msg = validar_chofer(valores)
        if msg: return err(msg)
    if not valores: return err('No se enviaron datos')
    cols = list(valores)
    rid = run(f"INSERT INTO {tabla} ({', '.join(cols)}) VALUES ({', '.join(['?']*len(cols))})", [valores[c] for c in cols])
    return jsonify(id=rid)

@app.put('/api/admin/<ent>/<int:i>')
@need('ADMIN')
def admin_update(ent, i):
    if ent not in ENT: return err('Entidad inválida', 404)
    tabla, campos, _ = ENT[ent]
    if not q(f'SELECT id FROM {tabla} WHERE id = ?', (i,), one=True): return err('Registro no encontrado', 404)
    datos = request.get_json(silent=True) or {}
    valores = clean(datos, campos)
    if ent == 'usuarios' and datos.get('password'):
        if len(datos['password']) < 6: return err('Contraseña mínima de 6 caracteres')
        valores['password_hash'] = generate_password_hash(datos['password'])
    if ent == 'viajes':
        msg = validar_chofer(valores)
        if msg: return err(msg)
    if ent == 'buses' and str(valores.get('total_pisos')) == '1':
        if q('SELECT id FROM asientos_plantilla WHERE bus_id = ? AND piso = 2 LIMIT 1', (i,), one=True):
            return err('El bus tiene asientos en el piso 2')
    if not valores: return err('Nada que actualizar')
    run(f"UPDATE {tabla} SET {', '.join(f'{c} = ?' for c in valores)} WHERE id = ?", list(valores.values()) + [i])
    return jsonify(ok=True)

@app.delete('/api/admin/<ent>/<int:i>')
@need('ADMIN')
def admin_delete(ent, i):
    if ent not in ENT: return err('Entidad inválida', 404)
    tabla = ENT[ent][0]
    if not q(f'SELECT id FROM {tabla} WHERE id = ?', (i,), one=True): return err('Registro no encontrado', 404)
    if ent == 'terminales':
        run('UPDATE terminales SET activo = 0 WHERE id = ?', (i,))
        return jsonify(ok=True, desactivado=True)
    if ent == 'viajes':
        run('DELETE FROM boletos_reservas WHERE programacion_viaje_id = ?', (i,))
        run('DELETE FROM programacion_viajes WHERE id = ?', (i,))
        return jsonify(ok=True, eliminado=True)
    if ent == 'usuarios' and i == session['u']['id']:
        return err('No puedes eliminar tu propio usuario')
    run(f'DELETE FROM {tabla} WHERE id = ?', (i,))
    return jsonify(ok=True)

@app.put('/api/admin/viajes/<int:i>/estado')
@need('ADMIN')
def viaje_estado(i):
    st = (request.get_json(silent=True) or {}).get('estado')
    if st not in ESTADOS_VIAJE: return err('Estado inválido')
    if not get_viaje(i): return err('Viaje no encontrado', 404)
    run('UPDATE programacion_viajes SET estado = ? WHERE id = ?', (st, i))
    return jsonify(ok=True)

# ==========================================================
# ADMINISTRACIÓN DE ASIENTOS Y PLANTILLAS
# ==========================================================
def validar_asiento(val, bus):
    try:
        piso = int(val.get('piso', 1))
        if piso not in (1, 2) or piso > bus['total_pisos']: return 'Piso no permitido para este bus'
        for c in ('numero_asiento', 'fila', 'columna'):
            if c in val and int(val[c]) < 1: return f'{c} debe ser mayor que cero'
        if 'recargo_precio' in val and float(val['recargo_precio']) < 0: return 'El recargo no puede ser negativo'
    except (TypeError, ValueError):
        return 'Datos numéricos del asiento inválidos'
    return None

@app.get('/api/admin/buses/<int:bid>/asientos')
@need('ADMIN')
def a_list(bid):
    return jsonify(q('SELECT * FROM asientos_plantilla WHERE bus_id = ? ORDER BY piso, fila, columna', (bid,)))

@app.post('/api/admin/buses/<int:bid>/asientos')
@need('ADMIN')
def a_create(bid):
    bus = q('SELECT * FROM buses WHERE id = ?', (bid,), one=True)
    if not bus: return err('Bus no encontrado', 404)
    val = clean(request.get_json(silent=True) or {}, AF)
    msg = validar_asiento(val, bus)
    if msg: return err(msg)
    cols = list(val) + ['bus_id']
    aid = run(f"INSERT INTO asientos_plantilla ({', '.join(cols)}) VALUES ({', '.join(['?']*len(cols))})", list(val.values()) + [bid])
    return jsonify(id=aid)

@app.put('/api/admin/asientos/<int:i>')
@need('ADMIN')
def a_update(i):
    val = clean(request.get_json(silent=True) or {}, AF)
    if not val: return err('Nada que actualizar')
    actual = q('SELECT a.*, b.total_pisos FROM asientos_plantilla a JOIN buses b ON b.id = a.bus_id WHERE a.id = ?', (i,), one=True)
    if not actual: return err('Asiento no encontrado', 404)
    comb = dict(actual); comb.update(val)
    msg = validar_asiento(comb, actual)
    if msg: return err(msg)
    run(f"UPDATE asientos_plantilla SET {', '.join(f'{c} = ?' for c in val)} WHERE id = ?", list(val.values()) + [i])
    return jsonify(ok=True)

@app.delete('/api/admin/asientos/<int:i>')
@need('ADMIN')
def a_delete(i):
    if not q('SELECT id FROM asientos_plantilla WHERE id = ?', (i,), one=True): return err('Asiento no encontrado', 404)
    run('DELETE FROM asientos_plantilla WHERE id = ?', (i,))
    return jsonify(ok=True)

@app.post('/api/admin/buses/<int:bid>/asientos/generar')
@need('ADMIN')
def a_generar(bid):
    bus = q('SELECT * FROM buses WHERE id = ?', (bid,), one=True)
    if not bus: return err('Bus no encontrado', 404)
    d = request.get_json(silent=True) or {}
    try:
        f1, f2, r1, r2 = int(d.get('filas1', 0)), int(d.get('filas2', 0)), float(d.get('recargo1', 0)), float(d.get('recargo2', 0))
    except (TypeError, ValueError):
        return err('Filas y recargos deben ser numéricos')
    if not 0 <= f1 <= 30 or not 0 <= f2 <= 30: return err('Las filas deben estar entre 0 y 30')
    if r1 < 0 or r2 < 0: return err('Los recargos no pueden ser negativos')
    pisos = [(1, f1, r1)] + ([(2, f2, r2)] if bus['total_pisos'] == 2 else [])
    if sum(f for _, f, _ in pisos) == 0: return err('Debes indicar al menos una fila')
    con = db()
    try:
        con.execute('BEGIN IMMEDIATE')
        if con.execute('SELECT id FROM asientos_plantilla WHERE bus_id = ? LIMIT 1', (bid,)).fetchone():
            con.rollback()
            return err('El bus ya tiene asientos configurados.')
        numero = 1
        for piso, filas, recargo in pisos:
            for fila in range(1, filas + 1):
                for columna, ubicacion in ((1, 'VENTANA'), (2, 'PASILLO'), (3, 'PASILLO'), (4, 'VENTANA')):
                    con.execute("INSERT INTO asientos_plantilla (bus_id, numero_asiento, piso, fila, columna, ubicacion, recargo_precio) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                (bid, numero, piso, fila, columna, ubicacion, recargo))
                    numero += 1
        con.execute("UPDATE buses SET capacidad_total = ? WHERE id = ?", (numero - 1, bid))
        con.commit()
    except Exception:
        con.rollback()
        raise
    return jsonify(total=numero - 1)

# ==========================================================
# REPORTES FINANCIEROS Y DE RESERVAS
# ==========================================================
@app.get('/api/admin/reservas')
@need('ADMIN')
def admin_reservas():
    return jsonify(q("""
        SELECT br.id, br.estado_pago, br.precio_final, br.fecha_emision, br.fecha_expiracion_bloqueo, br.codigo_qr,
               v.fecha_salida, v.hora_salida, v.estado AS estado_viaje, o.ciudad AS origen, d.ciudad AS destino,
               b.placa, b.tipo_servicio, a.numero_asiento, a.piso, p.tipo_documento, p.numero_documento, p.nombres,
               p.apellidos, p.telefono, CASE WHEN u.id IS NULL THEN 'WEB' ELSE 'TAQUILLA' END AS canal,
               COALESCE(u.nombres || ' ' || u.apellidos, 'Venta web') AS vendedor
        FROM boletos_reservas br
        JOIN programacion_viajes v ON v.id = br.programacion_viaje_id
        JOIN rutas r ON r.id = v.ruta_id
        JOIN terminales o ON o.id = r.terminal_origen_id
        JOIN terminales d ON d.id = r.terminal_destino_id
        JOIN buses b ON b.id = v.bus_id
        JOIN asientos_plantilla a ON a.id = br.asiento_plantilla_id
        JOIN pasajeros p ON p.id = br.pasajero_id
        LEFT JOIN usuarios u ON u.id = br.vendedor_id
        ORDER BY br.fecha_emision DESC, br.id DESC
    """))

@app.get('/api/reportes/ventas')
@need('ADMIN')
def rep_ventas():
    desde = request.args.get('desde') or '1900-01-01'
    hasta = request.args.get('hasta') or '2999-12-31'
    base = "FROM boletos_reservas br LEFT JOIN usuarios u ON u.id = br.vendedor_id WHERE br.estado_pago = 'PAGADO' AND date(br.fecha_emision) BETWEEN ? AND ?"
    total = q(f"SELECT COUNT(*) AS boletos, COALESCE(SUM(br.precio_final), 0) AS total {base}", (desde, hasta), one=True)
    por_taquillero = q(f"""
        SELECT COALESCE(u.nombres || ' ' || u.apellidos, 'WEB (online)') AS taquillero, COUNT(*) AS boletos, SUM(br.precio_final) AS total
        {base} GROUP BY br.vendedor_id ORDER BY total DESC
    """, (desde, hasta))
    return jsonify(total=total, por_taquillero=por_taquillero)

@app.get('/api/reportes/ocupacion')
@need('ADMIN')
def rep_ocup():
    filas = add_ocup(q(f"{VSQL} WHERE v.estado != 'CANCELADO' ORDER BY v.fecha_salida, v.hora_salida"))
    campos = ('id', 'origen', 'destino', 'fecha_salida', 'hora_salida', 'placa', 'estado', 'ocupados', 'asientos_total', 'ocupacion_pct')
    return jsonify([{c: f[c] for c in campos} for f in filas])

# ==========================================================
# INICIO DEL SERVIDOR
# ==========================================================
init_db()

if __name__ == '__main__':
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=os.environ.get('FLASK_DEBUG', '').lower() in ('1', 'true', 'yes')
    )
