import csv
import io
import os
import sqlite3
import uuid

from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, Response, g, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from dashboard import render_backend_dashboard, get_system_stats


# ==========================================================
# CONFIGURACIÓN
# ==========================================================

# D:\Transportes\backend
BASE = os.path.dirname(os.path.abspath(__file__))

# D:\Transportes
ROOT = os.path.dirname(BASE)

# DATABASE_PATH permite elegir otra base; por defecto usa el nombre estándar.
DB = os.environ.get('DATABASE_PATH', os.path.join(ROOT, 'viajes_interprovinciales.db'))

app = Flask(__name__, static_folder=None)

# En producción la clave debe venir del entorno para evitar sesiones falsificables.
PRODUCTION = os.environ.get('FLASK_ENV', '').lower() == 'production'
SECRET_KEY = os.environ.get('SECRET_KEY')

if PRODUCTION and not SECRET_KEY:
    raise RuntimeError('Configura SECRET_KEY antes de iniciar en producción')

app.secret_key = SECRET_KEY or 'clave-local-desarrollo-cambiar-antes-de-produccion'

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=PRODUCTION
)

BLOQUEO_MIN = 10

STAFF = ('ADMIN', 'TAQUILLERO')

ESTADOS_VIAJE = (
    'PROGRAMADO',
    'ABORDANDO',
    'EN_RUTA',
    'FINALIZADO',
    'CANCELADO'
)


def now():
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')


# ==========================================================
# CONEXIÓN Y VERIFICACIÓN DE SQLITE
# ==========================================================

def conectar():
    """
    Abre únicamente una base existente.
    mode=rw evita crear un archivo nuevo por una ruta equivocada.
    """
    from pathlib import Path

    uri = Path(DB).resolve().as_uri() + '?mode=rw'

    conexion = sqlite3.connect(
        uri,
        uri=True,
        timeout=15
    )

    conexion.row_factory = sqlite3.Row
    conexion.execute('PRAGMA foreign_keys = ON')
    conexion.execute('PRAGMA busy_timeout = 15000')

    return conexion


def init_db():
    """
    Comprueba la base existente sin insertar datos de prueba.
    No crea usuarios demo ni modifica el esquema.
    """
    if not os.path.isfile(DB):
        raise FileNotFoundError(
            '\nNo se encontró la base de datos:\n'
            f'{DB}\n'
            'Verifica el nombre del archivo y su ubicación.'
        )

    requeridas = {
        'usuarios': {
            'id', 'dni', 'nombres', 'apellidos',
            'correo', 'password_hash', 'telefono',
            'rol', 'fecha_registro'
        },
        'pasajeros': {
            'id', 'tipo_documento', 'numero_documento',
            'nombres', 'apellidos', 'fecha_nacimiento',
            'telefono'
        },
        'terminales': {
            'id', 'ciudad', 'nombre_agencia',
            'direccion', 'activo'
        },
        'rutas': {
            'id', 'terminal_origen_id',
            'terminal_destino_id',
            'distancia_km', 'duracion_horas'
        },
        'buses': {
            'id', 'placa', 'marca', 'modelo',
            'tipo_servicio', 'total_pisos',
            'capacidad_total', 'estado'
        },
        'asientos_plantilla': {
            'id', 'bus_id', 'numero_asiento',
            'piso', 'fila', 'columna',
            'ubicacion', 'recargo_precio'
        },
        'programacion_viajes': {
            'id', 'ruta_id', 'bus_id', 'chofer_id',
            'fecha_salida', 'hora_salida',
            'precio_base', 'estado'
        },
        'boletos_reservas': {
            'id', 'programacion_viaje_id',
            'asiento_plantilla_id', 'pasajero_id',
            'vendedor_id', 'precio_final',
            'estado_pago', 'codigo_qr',
            'fecha_emision', 'fecha_expiracion_bloqueo'
        }
    }

    conexion = conectar()

    try:
        problemas = []

        for tabla, columnas in requeridas.items():
            existentes = {
                fila['name']
                for fila in conexion.execute(
                    f'PRAGMA table_info("{tabla}")'
                ).fetchall()
            }

            if not existentes:
                problemas.append(f'Falta la tabla: {tabla}')
                continue

            faltantes = columnas - existentes

            if faltantes:
                problemas.append(
                    f'Tabla {tabla}: faltan columnas '
                    + ', '.join(sorted(faltantes))
                )

        if problemas:
            raise RuntimeError(
                '\nLa base existe, pero su estructura no es '
                'compatible con este backend:\n- '
                + '\n- '.join(problemas)
                + '\nNo se modificaron sus datos.'
            )

        # Comprueba que exista una restricción única equivalente
        # a la definida en tu esquema para evitar doble ocupación.
        indice_encontrado = False

        indices = conexion.execute(
            'PRAGMA index_list("boletos_reservas")'
        ).fetchall()

        for indice in indices:
            if not indice['unique'] or not indice['partial']:
                continue

            nombre = indice['name'].replace('"', '""')

            columnas_indice = [
                fila['name']
                for fila in conexion.execute(
                    f'PRAGMA index_info("{nombre}")'
                ).fetchall()
            ]

            definicion = conexion.execute(
                """
                SELECT sql
                FROM sqlite_master
                WHERE type = 'index' AND name = ?
                """,
                (indice['name'],)
            ).fetchone()

            sql = (definicion['sql'] or '') if definicion else ''
            normalizado = ''.join(sql.upper().split())

            condicion_correcta = (
                "WHEREESTADO_PAGO!='ANULADO'" in normalizado
                or "WHEREESTADO_PAGO<>'ANULADO'" in normalizado
            )

            if (
                columnas_indice == [
                    'programacion_viaje_id',
                    'asiento_plantilla_id'
                ]
                and condicion_correcta
            ):
                indice_encontrado = True
                break

        if not indice_encontrado:
            raise RuntimeError(
                '\nLa base no tiene el índice único parcial '
                'esperado para proteger los asientos.\n'
                'Verifica en schema.sql el índice '
                'idx_unico_asiento_viaje.\n'
                'No se modificaron sus datos.'
            )

        bases = conexion.execute(
            'PRAGMA database_list'
        ).fetchall()

        print('\n' + '=' * 60)
        print('BASE SQLITE VERIFICADA')

        for base in bases:
            print(f"{base['name']}: {base['file']}")

        for tabla in (
            'usuarios',
            'terminales',
            'programacion_viajes',
            'boletos_reservas'
        ):
            total = conexion.execute(
                f'SELECT COUNT(*) AS total FROM "{tabla}"'
            ).fetchone()['total']

            print(f'{tabla}: {total} registros')

        print('=' * 60 + '\n')

    finally:
        conexion.close()


def db():
    if 'db' not in g:
        g.db = conectar()

    return g.db


@app.teardown_appcontext
def cerrar_conexion(error):
    conexion = g.pop('db', None)

    if conexion is not None:
        conexion.close()


def q(sql, argumentos=(), one=False):
    filas = [
        dict(fila)
        for fila in db().execute(sql, argumentos).fetchall()
    ]

    if one:
        return filas[0] if filas else None

    return filas


def run(sql, argumentos=()):
    cursor = db().execute(sql, argumentos)
    db().commit()

    return cursor.lastrowid


def err(mensaje, codigo=400):
    return jsonify(error=mensaje), codigo


@app.errorhandler(sqlite3.IntegrityError)
def error_integridad(error):
    db().rollback()

    return err(
        'Dato inválido, duplicado o relacionado con otros registros. '
        + str(error),
        400
    )


@app.errorhandler(sqlite3.OperationalError)
def error_sqlite(error):
    db().rollback()
    app.logger.exception('Error operativo de SQLite')

    return err(
        'No se pudo completar la operación en SQLite. '
        'Revisa la terminal del backend.',
        500
    )


# ==========================================================
# AUTORIZACIÓN
# ==========================================================

def need(*roles):
    def decorador(funcion):
        @wraps(funcion)
        def wrapper(*args, **kwargs):
            usuario = session.get('u')

            if not usuario:
                return err('Inicia sesión', 401)

            if roles and usuario['rol'] not in roles:
                return err('Sin permiso', 403)

            return funcion(*args, **kwargs)

        return wrapper

    return decorador


def liberar_vencidos():
    run(
        """
        UPDATE boletos_reservas
        SET estado_pago = 'ANULADO'
        WHERE estado_pago = 'BLOQUEADO'
          AND fecha_expiracion_bloqueo <= ?
        """,
        (now(),)
    )


@app.get('/')
@app.get('/dashboard')
def index():
    accept = request.headers.get('Accept', '')
    if 'text/html' in accept or request.args.get('dashboard') == '1':
        return render_backend_dashboard(DB, db())
    return jsonify(
        status='online',
        msg='API Viajes Interprovinciales activa',
        version='2.0.0',
        dashboard_url='/dashboard',
        timestamp=now()
    )


@app.get('/api/health')
def health():
    stats = get_system_stats(DB, db())
    return jsonify(stats)


@app.post('/api/admin/clean-locks')
def api_clean_locks():
    liberar_vencidos()
    return jsonify(
        ok=True,
        mensaje='Bloqueos de asientos vencidos liberados correctamente.'
    )


def login_user(usuario):
    session['u'] = {
        'id': usuario['id'],
        'rol': usuario['rol'],
        'dni': usuario['dni'],
        'nombre': (
            usuario['nombres'] + ' ' + usuario['apellidos']
        )
    }

    return session['u']


@app.post('/api/login')
def login():
    datos = request.get_json(silent=True) or {}

    usuario = q(
        'SELECT * FROM usuarios WHERE correo = ?',
        (datos.get('correo'),),
        one=True
    )

    if not usuario:
        return err('Credenciales incorrectas', 401)

    if not check_password_hash(
        usuario['password_hash'],
        datos.get('password', '')
    ):
        return err('Credenciales incorrectas', 401)

    session.pop('u', None)

    return jsonify(login_user(usuario))


@app.post('/api/logout')
def logout():
    session.pop('u', None)

    return jsonify(ok=True)


@app.get('/api/me')
def me():
    return jsonify(session.get('u'))


@app.post('/api/registro')
def registro():
    datos = request.get_json(silent=True) or {}

    dni = str(datos.get('dni') or '').strip()
    nombres = str(datos.get('nombres') or '').strip()
    apellidos = str(datos.get('apellidos') or '').strip()
    correo = str(datos.get('correo') or '').strip()
    password = datos.get('password') or ''

    if not dni.isdigit() or len(dni) != 8:
        return err('El DNI debe tener 8 dígitos')

    if not nombres or not apellidos or not correo:
        return err('Completa nombres, apellidos y correo')

    if len(password) < 6:
        return err('La contraseña debe tener al menos 6 caracteres')

    usuario_id = run(
        """
        INSERT INTO usuarios (
            dni, nombres, apellidos, correo,
            password_hash, telefono, rol
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            dni,
            nombres,
            apellidos,
            correo,
            generate_password_hash(password),
            datos.get('telefono'),
            'CLIENTE'
        )
    )

    usuario = q(
        'SELECT * FROM usuarios WHERE id = ?',
        (usuario_id,),
        one=True
    )

    return jsonify(login_user(usuario))


# ==========================================================
# VIAJES Y BÚSQUEDAS
# ==========================================================

VSQL = """
SELECT
    v.*,
    o.ciudad AS origen,
    d.ciudad AS destino,
    o.nombre_agencia AS terminal_origen,
    d.nombre_agencia AS terminal_destino,
    r.duracion_horas,
    r.distancia_km,
    b.placa,
    b.tipo_servicio,
    b.total_pisos,
    b.estado AS bus_estado,

    (
        SELECT COUNT(*)
        FROM asientos_plantilla
        WHERE bus_id = b.id
    ) AS asientos_total,

    (
        SELECT COUNT(*)
        FROM boletos_reservas x
        WHERE x.programacion_viaje_id = v.id
          AND x.estado_pago != 'ANULADO'
          AND (x.estado_pago != 'BLOQUEADO' OR x.fecha_expiracion_bloqueo > datetime('now', 'localtime'))
    ) AS ocupados,

    u.nombres || ' ' || u.apellidos AS chofer

FROM programacion_viajes v
JOIN rutas r ON r.id = v.ruta_id
JOIN terminales o ON o.id = r.terminal_origen_id
JOIN terminales d ON d.id = r.terminal_destino_id
JOIN buses b ON b.id = v.bus_id
LEFT JOIN usuarios u ON u.id = v.chofer_id
"""


def add_ocup(filas):
    for viaje in filas:
        total = viaje['asientos_total'] or 0

        viaje['asientos_libres'] = max(
            total - viaje['ocupados'],
            0
        )

        viaje['ocupacion_pct'] = (
            round(100 * viaje['ocupados'] / total, 1)
            if total else 0
        )

    return filas


def get_viaje(viaje_id):
    return q(
        VSQL + ' WHERE v.id = ?',
        (viaje_id,),
        one=True
    )


@app.get('/api/ciudades')
def ciudades():
    filas = q(
        """
        SELECT DISTINCT ciudad
        FROM terminales
        WHERE activo = 1
        ORDER BY ciudad
        """
    )

    return jsonify([fila['ciudad'] for fila in filas])


@app.get('/api/viajes')
def viajes():
    filtros = [
        "v.estado IN ('PROGRAMADO', 'ABORDANDO')",
        'o.activo = 1',
        'd.activo = 1',
        "b.estado = 'ACTIVO'",
        "datetime(v.fecha_salida || ' ' || v.hora_salida) >= datetime('now', 'localtime')"
    ]

    argumentos = []
    datos = request.args

    if datos.get('origen'):
        filtros.append('o.ciudad = ?')
        argumentos.append(datos['origen'])

    if datos.get('destino'):
        filtros.append('d.ciudad = ?')
        argumentos.append(datos['destino'])

    if datos.get('fecha'):
        filtros.append('v.fecha_salida = ?')
        argumentos.append(datos['fecha'])

    if datos.get('hoy'):
        filtros.append('v.fecha_salida = ?')
        argumentos.append(
            datetime.now().strftime('%Y-%m-%d')
        )

    if datos.get('orden') == 'precio':
        orden = 'v.precio_base, v.hora_salida'
    else:
        orden = 'v.fecha_salida, v.hora_salida, v.precio_base'

    sql = (
        VSQL
        + ' WHERE '
        + ' AND '.join(filtros)
        + ' ORDER BY '
        + orden
    )

    return jsonify(add_ocup(q(sql, argumentos)))


# ==========================================================
# MAPA DE ASIENTOS
# ==========================================================

@app.get('/api/viajes/<int:vid>/asientos')
def asientos(vid):
    viaje = get_viaje(vid)

    if not viaje:
        return err('Viaje no existe', 404)

    mis_reservas = session.get('mis_reservas', [])

    filas = q(
        """
        SELECT
            a.*,
            br.id AS reserva_id,
            br.estado_pago

        FROM asientos_plantilla a

        LEFT JOIN boletos_reservas br
          ON br.asiento_plantilla_id = a.id
         AND br.programacion_viaje_id = ?
         AND br.estado_pago != 'ANULADO'
         AND (br.estado_pago != 'BLOQUEADO' OR br.fecha_expiracion_bloqueo > datetime('now', 'localtime'))


        WHERE a.bus_id = ?

        ORDER BY a.piso, a.fila, a.columna
        """,
        (vid, viaje['bus_id'])
    )

    for asiento in filas:
        estado_pago = asiento.pop('estado_pago')

        if not estado_pago:
            asiento['estado'] = 'LIBRE'
        elif estado_pago == 'BLOQUEADO':
            asiento['estado'] = 'BLOQUEADO'
        else:
            asiento['estado'] = 'OCUPADO'

        asiento['mio'] = (
            asiento['reserva_id'] in mis_reservas
        )

        if not asiento['mio']:
            asiento['reserva_id'] = None

        asiento['precio_base'] = viaje['precio_base']

        asiento['precio_final'] = round(
            viaje['precio_base'] + asiento['recargo_precio'],
            2
        )

    return jsonify(viaje=viaje, asientos=filas)


# ==========================================================
# PASAJEROS Y BOLETOS
# ==========================================================

def upsert_pasajero(datos):
    tipo = (
        datos.get('tipo_documento') or 'DNI'
    ).upper()

    numero = str(
        datos.get('numero_documento') or ''
    ).strip()

    nombres = str(datos.get('nombres') or '').strip()
    apellidos = str(datos.get('apellidos') or '').strip()

    if tipo not in ('DNI', 'PASAPORTE', 'CE'):
        raise ValueError('Tipo de documento inválido')

    if not numero:
        raise ValueError('Número de documento requerido')

    if tipo == 'DNI' and (
        not numero.isdigit() or len(numero) != 8
    ):
        raise ValueError('El DNI debe tener 8 dígitos')

    if not nombres or not apellidos:
        raise ValueError('Nombres y apellidos requeridos')

    existente = q(
        'SELECT id FROM pasajeros WHERE numero_documento = ?',
        (numero,),
        one=True
    )

    valores = (
        tipo,
        nombres,
        apellidos,
        datos.get('fecha_nacimiento') or None,
        datos.get('telefono')
    )

    if existente:
        run(
            """
            UPDATE pasajeros
            SET tipo_documento = ?,
                nombres = ?,
                apellidos = ?,
                fecha_nacimiento = ?,
                telefono = ?
            WHERE id = ?
            """,
            valores + (existente['id'],)
        )

        return existente['id']

    return run(
        """
        INSERT INTO pasajeros (
            tipo_documento, nombres, apellidos,
            fecha_nacimiento, telefono, numero_documento
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        valores + (numero,)
    )


def crear_boleto(
    viaje_id,
    asiento_id,
    pasajero_id,
    vendedor=None,
    pagado=False
):
    viaje = get_viaje(viaje_id)

    if not viaje or viaje['estado'] not in (
        'PROGRAMADO',
        'ABORDANDO'
    ):
        raise ValueError('Viaje no disponible')

    salida = datetime.strptime(
        viaje['fecha_salida'] + ' ' + viaje['hora_salida'],
        '%Y-%m-%d %H:%M'
    )

    if salida <= datetime.now():
        raise ValueError('La salida de este viaje ya pasó')

    if viaje.get('bus_estado') != 'ACTIVO':
        raise ValueError('El bus asignado no está disponible')

    asiento = q(
        """
        SELECT *
        FROM asientos_plantilla
        WHERE id = ? AND bus_id = ?
        """,
        (asiento_id, viaje['bus_id']),
        one=True
    )

    if not asiento:
        raise ValueError(
            'El asiento no pertenece al bus del viaje'
        )

    precio = round(
        viaje['precio_base'] + asiento['recargo_precio'],
        2
    )

    expiracion = None

    if not pagado:
        expiracion = (
            datetime.now() + timedelta(minutes=BLOQUEO_MIN)
        ).strftime('%Y-%m-%d %H:%M:%S')

    # Expira bloqueos solo al iniciar una venta; las lecturas no modifican SQLite.
    liberar_vencidos()

    try:
        return run(
            """
            INSERT INTO boletos_reservas (
                programacion_viaje_id,
                asiento_plantilla_id,
                pasajero_id,
                vendedor_id,
                precio_final,
                estado_pago,
                fecha_expiracion_bloqueo,
                fecha_emision
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                viaje_id,
                asiento_id,
                pasajero_id,
                vendedor,
                precio,
                'PAGADO' if pagado else 'BLOQUEADO',
                expiracion,
                now()
            )
        )

    except sqlite3.IntegrityError:
        db().rollback()

        raise ValueError(
            'No se pudo reservar: el asiento puede estar ocupado '
            'o alguno de los datos relacionados es inválido'
        )


def emitir_qr(boleto_id):
    codigo = 'QR-' + uuid.uuid4().hex.upper()

    # Solo confirma una reserva que continúe pendiente
    # y dentro de sus diez minutos.
    cursor = db().execute(
        """
        UPDATE boletos_reservas
        SET estado_pago = 'PAGADO',
            codigo_qr = ?,
            fecha_expiracion_bloqueo = NULL
        WHERE id = ?
          AND (
              (
                  estado_pago = 'BLOQUEADO'
                  AND fecha_expiracion_bloqueo > ?
              )
              OR (
                  estado_pago = 'PAGADO'
                  AND codigo_qr IS NULL
              )
          )
        """,
        (codigo, boleto_id, now())
    )

    db().commit()

    return cursor.rowcount == 1


def boleto_full(boleto_id):
    return q(
        """
        SELECT
            br.id,
            br.estado_pago,
            br.precio_final,
            br.codigo_qr,
            br.fecha_emision,
            br.fecha_expiracion_bloqueo,
            br.vendedor_id,
            br.programacion_viaje_id AS viaje_id,

            v.fecha_salida,
            v.hora_salida,
            v.precio_base,
            v.estado AS estado_viaje,

            o.ciudad AS origen,
            o.nombre_agencia AS terminal_origen,

            d.ciudad AS destino,
            d.nombre_agencia AS terminal_destino,

            a.numero_asiento,
            a.piso,
            a.ubicacion,
            a.recargo_precio,

            b.placa,
            b.tipo_servicio,

            p.tipo_documento,
            p.numero_documento,
            p.nombres,
            p.apellidos,
            p.telefono

        FROM boletos_reservas br
        JOIN programacion_viajes v
          ON v.id = br.programacion_viaje_id
        JOIN rutas r ON r.id = v.ruta_id
        JOIN terminales o ON o.id = r.terminal_origen_id
        JOIN terminales d ON d.id = r.terminal_destino_id
        JOIN asientos_plantilla a
          ON a.id = br.asiento_plantilla_id
        JOIN buses b ON b.id = v.bus_id
        JOIN pasajeros p ON p.id = br.pasajero_id

        WHERE br.id = ?
        """,
        (boleto_id,),
        one=True
    )


def puede_ver(boleto):
    usuario = session.get('u')

    if boleto['id'] in session.get('mis_reservas', []):
        return True

    if usuario:
        if usuario['rol'] in STAFF:
            return True

        if usuario['dni'] == boleto['numero_documento']:
            return True

    return False


def reserva_propia(boleto_id):
    boleto = boleto_full(boleto_id)

    if (
        not boleto
        or boleto_id not in session.get('mis_reservas', [])
    ):
        return None, err('Reserva no encontrada', 404)

    return boleto, None


# ==========================================================
# RESERVAS WEB
# ==========================================================

@app.post('/api/reservas')
@need('CLIENTE')
def reservar():
    datos = request.get_json(silent=True) or {}
    asientos_ids = datos.get('asientos_ids')

    if not asientos_ids:
        if datos.get('asiento_id'):
            asientos_ids = [datos.get('asiento_id')]
        else:
            return err('Debes seleccionar al menos un asiento', 400)

    if len(asientos_ids) > 6:
        return err('El límite máximo por compra es de 6 asientos', 400)

    viaje_id = datos.get('viaje_id')
    if not viaje_id:
        return err('ID de viaje requerido', 400)

    boletos_ids = []
    temporales = []

    try:
        for aid in asientos_ids:
            temporal = run(
                """
                INSERT INTO pasajeros (
                    tipo_documento,
                    numero_documento,
                    nombres,
                    apellidos
                )
                VALUES ('DNI', ?, ?, ?)
                """,
                (
                    'TMP-' + uuid.uuid4().hex[:12],
                    'PENDIENTE',
                    'PENDIENTE'
                )
            )
            temporales.append(temporal)
            boleto_id = crear_boleto(viaje_id, aid, temporal)
            boletos_ids.append(boleto_id)

    except ValueError as error:
        for bid in boletos_ids:
            run('DELETE FROM boletos_reservas WHERE id = ?', (bid,))
        for tid in temporales:
            run('DELETE FROM pasajeros WHERE id = ?', (tid,))
        return err(str(error), 409)

    session['mis_reservas'] = (
        session.get('mis_reservas', []) + boletos_ids
    )

    detalles = [boleto_full(bid) for bid in boletos_ids]

    if datos.get('asientos_ids') and isinstance(datos.get('asientos_ids'), list):
        return jsonify({
            'reserva': detalles[0],
            'reservas': detalles,
            'total': sum(float(b['precio_final']) for b in detalles),
            'cantidad': len(detalles)
        })

    return jsonify(detalles[0])


@app.put('/api/reservas/<int:bid>/pasajero')
@need('CLIENTE')
def reserva_pasajero(bid):
    boleto, error = reserva_propia(bid)

    if error is not None:
        return error

    if boleto['estado_pago'] != 'BLOQUEADO':
        return err(
            'La reserva expiró o ya no está pendiente',
            409
        )

    try:
        pasajero_id = upsert_pasajero(
            request.get_json(silent=True) or {}
        )

    except ValueError as error:
        return err(str(error))

    anterior = q(
        """
        SELECT pasajero_id
        FROM boletos_reservas
        WHERE id = ?
        """,
        (bid,),
        one=True
    )['pasajero_id']

    run(
        """
        UPDATE boletos_reservas
        SET pasajero_id = ?
        WHERE id = ?
        """,
        (pasajero_id, bid)
    )

    if anterior != pasajero_id:
        run(
            """
            DELETE FROM pasajeros
            WHERE id = ?
              AND numero_documento LIKE 'TMP-%'
            """,
            (anterior,)
        )

    return jsonify(boleto_full(bid))


@app.post('/api/reservas/<int:bid>/pagar')
@need('CLIENTE')
def reserva_pagar(bid):
    boleto, error = reserva_propia(bid)

    if error is not None:
        return error

    if boleto['estado_pago'] != 'BLOQUEADO':
        return err(
            'La reserva expiró o ya no está pendiente',
            409
        )

    if boleto['estado_viaje'] not in (
        'PROGRAMADO',
        'ABORDANDO'
    ):
        return err('El viaje ya no está disponible', 409)

    if boleto['numero_documento'].startswith('TMP-'):
        return err('Registra primero los datos del pasajero')

    datos = request.get_json(silent=True) or {}

    # Simulación: no se almacenan estos datos.
    tarjeta = ''.join(
        caracter
        for caracter in str(datos.get('tarjeta', ''))
        if caracter.isdigit()
    )

    cvv = str(datos.get('cvv') or '')

    if not 13 <= len(tarjeta) <= 19:
        return err('Número de tarjeta inválido')

    if not cvv.isdigit() or len(cvv) not in (3, 4):
        return err('CVV inválido')

    if tarjeta.endswith('0000'):
        return err(
            'Pago rechazado por la pasarela simulada',
            402
        )

    if not emitir_qr(bid):
        return err(
            'La reserva venció o ya fue procesada',
            409
        )

    return jsonify(boleto_full(bid))


@app.delete('/api/reservas/<int:bid>')
@need('CLIENTE')
def reserva_cancelar(bid):
    boleto, error = reserva_propia(bid)

    if error is not None:
        return error

    if boleto['estado_pago'] != 'BLOQUEADO':
        return err(
            'Solo puedes cancelar reservas pendientes',
            409
        )

    run(
        """
        UPDATE boletos_reservas
        SET estado_pago = 'ANULADO'
        WHERE id = ? AND estado_pago = 'BLOQUEADO'
        """,
        (bid,)
    )

    return jsonify(ok=True)


@app.post('/api/reservas/checkout')
@need('CLIENTE')
def reserva_checkout():
    datos = request.get_json(silent=True) or {}
    boletos_items = datos.get('boletos') or []

    if not boletos_items:
        return err('No se enviaron boletos para procesar el pago', 400)

    # Validar tarjeta simulada
    tarjeta = ''.join(c for c in str(datos.get('tarjeta', '')) if c.isdigit())
    cvv = str(datos.get('cvv') or '')

    if not 13 <= len(tarjeta) <= 19:
        return err('Número de tarjeta bancaria inválido')

    if not cvv.isdigit() or len(cvv) not in (3, 4):
        return err('Código CVV inválido')

    if tarjeta.endswith('0000'):
        return err('Pago rechazado por la pasarela bancaria simulada', 402)

    boletos_pagados = []

    try:
        for item in boletos_items:
            bid = item.get('id')
            boleto, error = reserva_propia(bid)
            if error is not None:
                return error

            if boleto['estado_pago'] != 'BLOQUEADO':
                return err(f"El asiento {boleto.get('numero_asiento', bid)} expiró o ya no está disponible", 409)

            pasajero_id = upsert_pasajero({
                'tipo_documento': item.get('tipo_documento', 'DNI'),
                'numero_documento': item.get('numero_documento', ''),
                'nombres': item.get('nombres', ''),
                'apellidos': item.get('apellidos', ''),
                'telefono': item.get('telefono', ''),
                'correo': item.get('correo', '')
            })

            anterior = q("SELECT pasajero_id FROM boletos_reservas WHERE id = ?", (bid,), one=True)['pasajero_id']
            run("UPDATE boletos_reservas SET pasajero_id = ? WHERE id = ?", (pasajero_id, bid))
            if anterior != pasajero_id:
                run("DELETE FROM pasajeros WHERE id = ? AND numero_documento LIKE 'TMP-%'", (anterior,))

            if not emitir_qr(bid):
                return err(f"No se pudo emitir el boleto {bid}", 409)

            boletos_pagados.append(boleto_full(bid))

    except ValueError as error:
        return err(str(error), 409)

    return jsonify({
        'mensaje': 'Compra de pasajes completada con éxito',
        'boletos': boletos_pagados,
        'total': sum(float(b['precio_final']) for b in boletos_pagados),
        'cantidad': len(boletos_pagados)
    })


@app.post('/api/reservas/cancelar-lote')
@need('CLIENTE')
def reservas_cancelar_lote():
    datos = request.get_json(silent=True) or {}
    bids = datos.get('boletos_ids') or []

    for bid in bids:
        boleto, error = reserva_propia(bid)
        if error is None and boleto['estado_pago'] == 'BLOQUEADO':
            run("UPDATE boletos_reservas SET estado_pago = 'ANULADO' WHERE id = ? AND estado_pago = 'BLOQUEADO'", (bid,))

    return jsonify(ok=True)


@app.get('/api/boletos/<int:bid>')
def boleto_get(bid):
    boleto = boleto_full(bid)

    if not boleto or not puede_ver(boleto):
        return err('Boleto no encontrado', 404)

    return jsonify(boleto)


@app.get('/api/mis-viajes')
@need()
def mis_viajes():
    usuario = session['u']

    filas = q(
        """
        SELECT br.id
        FROM boletos_reservas br
        JOIN pasajeros p ON p.id = br.pasajero_id
        WHERE p.numero_documento = ?
        ORDER BY br.id DESC
        """,
        (usuario['dni'],)
    )

    return jsonify([
        boleto_full(fila['id'])
        for fila in filas
    ])


# ==========================================================
# TAQUILLA
# ==========================================================

@app.post('/api/taquilla/venta')
@need(*STAFF)
def venta():
    datos = request.get_json(silent=True) or {}

    if datos.get('metodo') not in (
        'EFECTIVO',
        'TARJETA'
    ):
        return err('Método de pago inválido')

    try:
        pasajero_id = upsert_pasajero(
            datos.get('pasajero') or {}
        )

        boleto_id = crear_boleto(
            datos.get('viaje_id'),
            datos.get('asiento_id'),
            pasajero_id,
            vendedor=session['u']['id'],
            pagado=True
        )

    except ValueError as error:
        return err(str(error), 409)

    emitir_qr(boleto_id)

    return jsonify(boleto_full(boleto_id))


@app.post('/api/taquilla/anular/<int:bid>')
@need(*STAFF)
def anular(bid):
    boleto = boleto_full(bid)

    if not boleto:
        return err('Boleto no existe', 404)

    if boleto['estado_pago'] == 'ANULADO':
        return err('El boleto ya está anulado', 409)

    run(
        """
        UPDATE boletos_reservas
        SET estado_pago = 'ANULADO'
        WHERE id = ?
        """,
        (bid,)
    )

    return jsonify(ok=True)


@app.get('/api/boletos')
@need(*STAFF)
def boletos_buscar():
    documento = request.args.get('doc', '').strip()
    codigo = request.args.get('qr', '').strip()

    if not documento and not codigo:
        return jsonify([])

    filas = q(
        """
        SELECT br.id
        FROM boletos_reservas br
        JOIN pasajeros p ON p.id = br.pasajero_id
        WHERE p.numero_documento = ?
           OR br.codigo_qr = ?
        ORDER BY br.id DESC
        """,
        (documento, codigo)
    )

    return jsonify([
        boleto_full(fila['id'])
        for fila in filas
    ])


@app.get('/api/viajes/<int:vid>/boletos')
@need(*STAFF)
def boletos_viaje(vid):
    filas = q(
        """
        SELECT id
        FROM boletos_reservas
        WHERE programacion_viaje_id = ?
        ORDER BY id DESC
        """,
        (vid,)
    )

    return jsonify([
        boleto_full(fila['id'])
        for fila in filas
    ])


@app.post('/api/boletos/<int:bid>/reenviar')
@need(*STAFF)
def reenviar(bid):
    boleto = boleto_full(bid)

    if not boleto or boleto['estado_pago'] != 'PAGADO':
        return err('Solo puedes reenviar boletos pagados', 409)

    datos = request.get_json(silent=True) or {}
    correo = datos.get('correo') or 'destino no especificado'

    return jsonify(
        ok=True,
        mensaje=(
            f"Reenvío simulado del boleto {boleto['codigo_qr']} "
            f"a {correo}. No se envió un correo real."
        )
    )


# ==========================================================
# MANIFIESTO Y CHOFER
# ==========================================================

def celda_csv(valor):
    if valor is None:
        return ''

    if isinstance(valor, str):
        if valor.lstrip().startswith(('=', '+', '-', '@')):
            return "'" + valor

    return valor


@app.get('/api/viajes/<int:vid>/manifiesto')
@need('ADMIN', 'TAQUILLERO', 'CHOFER')
def manifiesto(vid):
    viaje = get_viaje(vid)

    if not viaje:
        return err('Viaje no existe', 404)

    usuario = session['u']

    if (
        usuario['rol'] == 'CHOFER'
        and viaje['chofer_id'] != usuario['id']
    ):
        return err('Viaje no asignado a este chofer', 403)

    pasajeros = q(
        """
        SELECT
            a.numero_asiento,
            a.piso,
            p.tipo_documento,
            p.numero_documento,
            p.nombres,
            p.apellidos,
            p.telefono,
            br.codigo_qr

        FROM boletos_reservas br

        JOIN asientos_plantilla a
          ON a.id = br.asiento_plantilla_id

        JOIN pasajeros p
          ON p.id = br.pasajero_id

        WHERE br.programacion_viaje_id = ?
          AND br.estado_pago = 'PAGADO'

        ORDER BY a.numero_asiento
        """,
        (vid,)
    )

    if request.args.get('formato') == 'json':
        return jsonify(
            viaje=viaje,
            pasajeros=pasajeros
        )

    salida = io.StringIO()
    escritor = csv.writer(salida)

    def escribir(valores):
        escritor.writerow([
            celda_csv(valor)
            for valor in valores
        ])

    escribir(['MANIFIESTO DE PASAJEROS'])

    escribir([
        'Viaje',
        vid,
        viaje['origen'] + ' -> ' + viaje['destino'],
        viaje['fecha_salida'],
        viaje['hora_salida']
    ])

    escribir([
        'Bus',
        viaje['placa'],
        'Chofer',
        viaje['chofer'] or '-',
        'Total pasajeros',
        len(pasajeros)
    ])

    escribir([])

    escribir([
        'Asiento',
        'Piso',
        'Tipo documento',
        'Número documento',
        'Nombres',
        'Apellidos',
        'Teléfono',
        'Código QR'
    ])

    for pasajero in pasajeros:
        escribir(list(pasajero.values()))

    return Response(
        '\ufeff' + salida.getvalue(),
        mimetype='text/csv',
        headers={
            'Content-Disposition': (
                f'attachment; filename=manifiesto_viaje_{vid}.csv'
            )
        }
    )


@app.get('/api/chofer/viajes')
@need('CHOFER')
def chofer_viajes():
    filas = q(
        VSQL
        + """
          WHERE v.chofer_id = ?
          ORDER BY v.fecha_salida, v.hora_salida
          """,
        (session['u']['id'],)
    )

    return jsonify(add_ocup(filas))


# ==========================================================
# ADMINISTRACIÓN CRUD
# ==========================================================

ENT = {
    'terminales': (
        'terminales',
        ['ciudad', 'nombre_agencia', 'direccion', 'activo'],
        'SELECT * FROM terminales ORDER BY ciudad'
    ),

    'rutas': (
        'rutas',
        [
            'terminal_origen_id',
            'terminal_destino_id',
            'distancia_km',
            'duracion_horas'
        ],
        """
        SELECT r.*, o.ciudad AS origen, d.ciudad AS destino
        FROM rutas r
        JOIN terminales o ON o.id = r.terminal_origen_id
        JOIN terminales d ON d.id = r.terminal_destino_id
        ORDER BY r.id
        """
    ),

    'buses': (
        'buses',
        [
            'placa', 'marca', 'modelo', 'tipo_servicio',
            'total_pisos', 'capacidad_total', 'estado'
        ],
        'SELECT * FROM buses ORDER BY id'
    ),

    'viajes': (
        'programacion_viajes',
        [
            'ruta_id', 'bus_id', 'chofer_id',
            'fecha_salida', 'hora_salida',
            'precio_base', 'estado'
        ],
        VSQL + ' ORDER BY v.fecha_salida DESC, v.hora_salida'
    ),

    'usuarios': (
        'usuarios',
        [
            'dni', 'nombres', 'apellidos',
            'correo', 'telefono', 'rol'
        ],
        """
        SELECT
            id, dni, nombres, apellidos,
            correo, telefono, rol, fecha_registro
        FROM usuarios
        ORDER BY id
        """
    )
}


def clean(datos, campos):
    return {
        campo: None if datos[campo] == '' else datos[campo]
        for campo in campos
        if campo in datos
    }


def validar_chofer(datos):
    chofer_id = datos.get('chofer_id')

    if chofer_id is None:
        return None

    chofer = q(
        'SELECT rol FROM usuarios WHERE id = ?',
        (chofer_id,),
        one=True
    )

    if not chofer or chofer['rol'] != 'CHOFER':
        return 'El usuario asignado debe tener rol CHOFER'

    return None


@app.get('/api/admin/<ent>')
@need('ADMIN')
def admin_list(ent):
    if ent not in ENT:
        return err('Entidad inválida', 404)

    filas = q(ENT[ent][2])

    if ent == 'viajes':
        filas = add_ocup(filas)

    return jsonify(filas)


@app.post('/api/admin/<ent>')
@need('ADMIN')
def admin_create(ent):
    if ent not in ENT:
        return err('Entidad inválida', 404)

    tabla, campos, _ = ENT[ent]
    datos = request.get_json(silent=True) or {}
    valores = clean(datos, campos)

    if ent == 'usuarios':
        password = datos.get('password') or ''

        if len(password) < 6:
            return err('Contraseña mínima de 6 caracteres')

        valores['password_hash'] = generate_password_hash(
            password
        )

    if ent == 'viajes':
        mensaje = validar_chofer(valores)

        if mensaje:
            return err(mensaje)

    if not valores:
        return err('No se enviaron datos')

    columnas = list(valores)
    marcadores = ', '.join(['?'] * len(columnas))

    registro_id = run(
        f"""
        INSERT INTO {tabla} ({', '.join(columnas)})
        VALUES ({marcadores})
        """,
        [valores[columna] for columna in columnas]
    )

    return jsonify(id=registro_id)


@app.put('/api/admin/<ent>/<int:i>')
@need('ADMIN')
def admin_update(ent, i):
    if ent not in ENT:
        return err('Entidad inválida', 404)

    tabla, campos, _ = ENT[ent]

    existe = q(
        f'SELECT id FROM {tabla} WHERE id = ?',
        (i,),
        one=True
    )

    if not existe:
        return err('Registro no encontrado', 404)

    datos = request.get_json(silent=True) or {}
    valores = clean(datos, campos)

    if ent == 'usuarios' and datos.get('password'):
        if len(datos['password']) < 6:
            return err('Contraseña mínima de 6 caracteres')

        valores['password_hash'] = generate_password_hash(
            datos['password']
        )

    if ent == 'viajes':
        mensaje = validar_chofer(valores)

        if mensaje:
            return err(mensaje)

    if (
        ent == 'buses'
        and str(valores.get('total_pisos')) == '1'
    ):
        piso_dos = q(
            """
            SELECT id
            FROM asientos_plantilla
            WHERE bus_id = ? AND piso = 2
            LIMIT 1
            """,
            (i,),
            one=True
        )

        if piso_dos:
            return err(
                'El bus tiene asientos en el piso 2'
            )

    if not valores:
        return err('Nada que actualizar')

    cambios = ', '.join(
        campo + ' = ?'
        for campo in valores
    )

    run(
        f'UPDATE {tabla} SET {cambios} WHERE id = ?',
        list(valores.values()) + [i]
    )

    return jsonify(ok=True)


@app.delete('/api/admin/<ent>/<int:i>')
@need('ADMIN')
def admin_delete(ent, i):
    if ent not in ENT:
        return err('Entidad inválida', 404)

    tabla = ENT[ent][0]

    existe = q(
        f'SELECT id FROM {tabla} WHERE id = ?',
        (i,),
        one=True
    )

    if not existe:
        return err('Registro no encontrado', 404)

    if ent == 'terminales':
        run(
            'UPDATE terminales SET activo = 0 WHERE id = ?',
            (i,)
        )

        return jsonify(ok=True, desactivado=True)

    if ent == 'viajes':
        run(
            """
            UPDATE programacion_viajes
            SET estado = 'CANCELADO'
            WHERE id = ?
            """,
            (i,)
        )

        return jsonify(ok=True, cancelado=True)

    if ent == 'usuarios' and i == session['u']['id']:
        return err(
            'No puedes eliminar tu propio usuario'
        )

    run(
        f'DELETE FROM {tabla} WHERE id = ?',
        (i,)
    )

    return jsonify(ok=True)


@app.put('/api/admin/viajes/<int:i>/estado')
@need('ADMIN')
def viaje_estado(i):
    datos = request.get_json(silent=True) or {}
    estado = datos.get('estado')

    if estado not in ESTADOS_VIAJE:
        return err('Estado inválido')

    if not get_viaje(i):
        return err('Viaje no encontrado', 404)

    run(
        """
        UPDATE programacion_viajes
        SET estado = ?
        WHERE id = ?
        """,
        (estado, i)
    )

    return jsonify(ok=True)


# ==========================================================
# PLANTILLA DE ASIENTOS
# ==========================================================

AF = [
    'numero_asiento',
    'piso',
    'fila',
    'columna',
    'ubicacion',
    'recargo_precio'
]


def validar_asiento(valores, bus):
    try:
        piso = int(valores.get('piso', 1))

        if piso not in (1, 2) or piso > bus['total_pisos']:
            return 'Piso no permitido para este bus'

        for campo in ('numero_asiento', 'fila', 'columna'):
            if campo in valores and int(valores[campo]) < 1:
                return f'{campo} debe ser mayor que cero'

        if (
            'recargo_precio' in valores
            and float(valores['recargo_precio']) < 0
        ):
            return 'El recargo no puede ser negativo'

    except (TypeError, ValueError):
        return 'Datos numéricos del asiento inválidos'

    return None


@app.get('/api/admin/buses/<int:bid>/asientos')
@need('ADMIN')
def a_list(bid):
    return jsonify(q(
        """
        SELECT *
        FROM asientos_plantilla
        WHERE bus_id = ?
        ORDER BY piso, fila, columna
        """,
        (bid,)
    ))


@app.post('/api/admin/buses/<int:bid>/asientos')
@need('ADMIN')
def a_create(bid):
    bus = q(
        'SELECT * FROM buses WHERE id = ?',
        (bid,),
        one=True
    )

    if not bus:
        return err('Bus no encontrado', 404)

    valores = clean(
        request.get_json(silent=True) or {},
        AF
    )

    mensaje = validar_asiento(valores, bus)

    if mensaje:
        return err(mensaje)

    columnas = list(valores) + ['bus_id']
    marcadores = ', '.join(['?'] * len(columnas))

    asiento_id = run(
        f"""
        INSERT INTO asientos_plantilla (
            {', '.join(columnas)}
        )
        VALUES ({marcadores})
        """,
        list(valores.values()) + [bid]
    )

    return jsonify(id=asiento_id)


@app.put('/api/admin/asientos/<int:i>')
@need('ADMIN')
def a_update(i):
    valores = clean(
        request.get_json(silent=True) or {},
        AF
    )

    if not valores:
        return err('Nada que actualizar')

    actual = q(
        """
        SELECT a.*, b.total_pisos
        FROM asientos_plantilla a
        JOIN buses b ON b.id = a.bus_id
        WHERE a.id = ?
        """,
        (i,),
        one=True
    )

    if not actual:
        return err('Asiento no encontrado', 404)

    combinado = dict(actual)
    combinado.update(valores)

    mensaje = validar_asiento(combinado, actual)

    if mensaje:
        return err(mensaje)

    cambios = ', '.join(
        campo + ' = ?'
        for campo in valores
    )

    run(
        f"""
        UPDATE asientos_plantilla
        SET {cambios}
        WHERE id = ?
        """,
        list(valores.values()) + [i]
    )

    return jsonify(ok=True)


@app.delete('/api/admin/asientos/<int:i>')
@need('ADMIN')
def a_delete(i):
    existe = q(
        'SELECT id FROM asientos_plantilla WHERE id = ?',
        (i,),
        one=True
    )

    if not existe:
        return err('Asiento no encontrado', 404)

    run(
        'DELETE FROM asientos_plantilla WHERE id = ?',
        (i,)
    )

    return jsonify(ok=True)


@app.post('/api/admin/buses/<int:bid>/asientos/generar')
@need('ADMIN')
def a_generar(bid):
    bus = q(
        'SELECT * FROM buses WHERE id = ?',
        (bid,),
        one=True
    )

    if not bus:
        return err('Bus no encontrado', 404)

    datos = request.get_json(silent=True) or {}

    try:
        filas1 = int(datos.get('filas1', 0))
        filas2 = int(datos.get('filas2', 0))
        recargo1 = float(datos.get('recargo1', 0))
        recargo2 = float(datos.get('recargo2', 0))

    except (TypeError, ValueError):
        return err('Filas y recargos deben ser numéricos')

    if not 0 <= filas1 <= 30 or not 0 <= filas2 <= 30:
        return err('Las filas deben estar entre 0 y 30')

    if recargo1 < 0 or recargo2 < 0:
        return err('Los recargos no pueden ser negativos')

    pisos = [(1, filas1, recargo1)]

    if bus['total_pisos'] == 2:
        pisos.append((2, filas2, recargo2))

    if sum(filas for _, filas, _ in pisos) == 0:
        return err('Debes indicar al menos una fila')

    conexion = db()

    try:
        conexion.execute('BEGIN IMMEDIATE')

        existente = conexion.execute(
            """
            SELECT id
            FROM asientos_plantilla
            WHERE bus_id = ?
            LIMIT 1
            """,
            (bid,)
        ).fetchone()

        if existente:
            conexion.rollback()

            return err(
                'El bus ya tiene asientos. '
                'Usa un bus nuevo o edita su plantilla actual.'
            )

        numero = 1

        for piso, filas, recargo in pisos:
            for fila in range(1, filas + 1):
                for columna, ubicacion in (
                    (1, 'VENTANA'),
                    (2, 'PASILLO'),
                    (3, 'PASILLO'),
                    (4, 'VENTANA')
                ):
                    conexion.execute(
                        """
                        INSERT INTO asientos_plantilla (
                            bus_id,
                            numero_asiento,
                            piso,
                            fila,
                            columna,
                            ubicacion,
                            recargo_precio
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            bid,
                            numero,
                            piso,
                            fila,
                            columna,
                            ubicacion,
                            recargo
                        )
                    )

                    numero += 1

        conexion.execute(
            """
            UPDATE buses
            SET capacidad_total = ?
            WHERE id = ?
            """,
            (numero - 1, bid)
        )

        conexion.commit()

    except Exception:
        conexion.rollback()
        raise

    return jsonify(total=numero - 1)


# ==========================================================
# REPORTES
# ==========================================================

@app.get('/api/admin/reservas')
@need('ADMIN')
def admin_reservas():
    filas = q(
        """
        SELECT
            br.id, br.estado_pago, br.precio_final, br.fecha_emision,
            br.fecha_expiracion_bloqueo, br.codigo_qr,
            v.fecha_salida, v.hora_salida, v.estado AS estado_viaje,
            o.ciudad AS origen, d.ciudad AS destino,
            b.placa, b.tipo_servicio, a.numero_asiento, a.piso,
            p.tipo_documento, p.numero_documento, p.nombres,
            p.apellidos, p.telefono,
            CASE WHEN u.id IS NULL THEN 'WEB' ELSE 'TAQUILLA' END AS canal,
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
        """
    )

    return jsonify(filas)

@app.get('/api/reportes/ventas')
@need('ADMIN')
def rep_ventas():
    desde = request.args.get('desde') or '1900-01-01'
    hasta = request.args.get('hasta') or '2999-12-31'

    base = """
    FROM boletos_reservas br

    LEFT JOIN usuarios u ON u.id = br.vendedor_id

    WHERE br.estado_pago = 'PAGADO'
      AND date(br.fecha_emision) BETWEEN ? AND ?
    """

    total = q(
        """
        SELECT
            COUNT(*) AS boletos,
            COALESCE(SUM(br.precio_final), 0) AS total
        """ + base,
        (desde, hasta),
        one=True
    )

    por_taquillero = q(
        """
        SELECT
            COALESCE(
                u.nombres || ' ' || u.apellidos,
                'WEB (online)'
            ) AS taquillero,
            COUNT(*) AS boletos,
            SUM(br.precio_final) AS total
        """
        + base
        + """
          GROUP BY br.vendedor_id
          ORDER BY total DESC
          """,
        (desde, hasta)
    )

    return jsonify(
        total=total,
        por_taquillero=por_taquillero
    )


@app.get('/api/reportes/ocupacion')
@need('ADMIN')
def rep_ocup():
    filas = add_ocup(q(
        VSQL
        + """
          WHERE v.estado != 'CANCELADO'
          ORDER BY v.fecha_salida, v.hora_salida
          """
    ))

    campos = (
        'id',
        'origen',
        'destino',
        'fecha_salida',
        'hora_salida',
        'placa',
        'estado',
        'ocupados',
        'asientos_total',
        'ocupacion_pct'
    )

    return jsonify([
        {campo: fila[campo] for campo in campos}
        for fila in filas
    ])


# ==========================================================
# ARRANQUE
# ==========================================================

init_db()

if __name__ == '__main__':
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=os.environ.get('FLASK_DEBUG', '').lower() in ('1', 'true', 'yes')
    )






