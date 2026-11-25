<?php
declare(strict_types=1);

/** Registro, inicio/cierre de sesión y consulta del estado de sesión. */
final class AuthController
{
    private const COOKIE_CORREO = 'jz_correo';
    private const DIAS_RECORDAR = 30;
    /** Hash de relleno para igualar tiempos cuando el correo no existe (evita enumerar cuentas). */
    private const HASH_RELLENO = '$2y$10$D/TZd6qFyYJ2p1eljpxl..kGt.dt3xdpf1GA1MStX4zz/HZbckOZi';

    private UsuarioModel $usuarios;

    public function __construct(?UsuarioModel $usuarios = null)
    {
        $this->usuarios = $usuarios ?? new UsuarioModel();
    }

    /** @param array<string, mixed> $in */
    public function registrar(array $in): void
    {
        $errores = [];
        $nombre = Validator::texto($in['nombre'] ?? '', 100);
        $correo = mb_strtolower(trim(Validator::cadena($in['correo'] ?? '')));
        $claveCampus = Validator::cadena($in['campus'] ?? '');
        $password = Validator::cadena($in['contrasena'] ?? '');
        $confirmacion = Validator::cadena($in['contrasena_confirmacion'] ?? '');
        $terminos = ($in['terminos'] ?? false) === true;

        if (mb_strlen($nombre) < 3) {
            $errores['nombre'] = 'Escribe tu nombre completo (mínimo 3 caracteres).';
        }
        if (!Validator::correoUady($correo)) {
            $errores['correo'] = 'Usa tu matrícula (a + 8 dígitos @alumnos.uady.mx) o un correo @correo.uady.mx.';
        }
        $campusId = $claveCampus !== '' ? $this->usuarios->campusIdPorClave($claveCampus) : null;
        if ($campusId === null) {
            $errores['campus'] = 'Selecciona un campus válido.';
        }
        if (strlen($password) < 8) {
            $errores['contrasena'] = 'La contraseña debe tener un mínimo de 8 caracteres.';
        } elseif (strlen($password) > 72) {
            $errores['contrasena'] = 'La contraseña no puede superar 72 caracteres.';
        }
        if ($password !== $confirmacion) {
            $errores['contrasena_confirmacion'] = 'Las contraseñas no coinciden.';
        }
        if (!$terminos) {
            $errores['terminos'] = 'Debes aceptar los términos de entrega para registrarte.';
        }

        if ($errores !== []) {
            Http::fail(400, 'Revisa los datos del formulario.', $errores);
        }

        try {
            $id = $this->usuarios->crear([
                'nombre'        => $nombre,
                'correo'        => $correo,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                'campus_id'     => (int) $campusId,
            ]);
        } catch (PDOException $e) {
            // 1062 = entrada duplicada (el correo ya existe)
            if (($e->errorInfo[1] ?? 0) === 1062) {
                Http::fail(409, 'Este correo institucional ya está registrado.', [
                    'correo' => 'Este correo institucional ya está registrado.',
                ]);
            }
            throw $e;
        }

        Http::ok(['id' => $id], 'Cuenta institucional creada. Ahora puedes iniciar sesión.', 201);
    }

    /** @param array<string, mixed> $in */
    public function login(array $in): void
    {
        $correo = mb_strtolower(trim(Validator::cadena($in['correo'] ?? '')));
        $password = Validator::cadena($in['contrasena'] ?? '');
        $recordar = ($in['recordar'] ?? false) === true;

        if ($correo === '' || $password === '') {
            Http::fail(400, 'Escribe tu correo y tu contraseña.');
        }

        $fila = $this->usuarios->buscarPorCorreo($correo);
        $hash = $fila !== null ? (string) $fila['password_hash'] : self::HASH_RELLENO;
        $valida = password_verify($password, $hash);

        if ($fila === null || !$valida) {
            Http::fail(401, 'Correo o contraseña incorrectos.');
        }

        if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
            $this->usuarios->actualizarHash((int) $fila['id'], password_hash($password, PASSWORD_DEFAULT));
        }

        $publico = UsuarioModel::publico($fila);
        Sesion::establecer($publico);
        $this->gestionarCookieCorreo($correo, $recordar);

        Http::ok(['usuario' => $publico, 'csrf_token' => Csrf::token()], 'Sesión iniciada.');
    }

    public function logout(): void
    {
        Sesion::destruir();
        Http::ok([], 'Sesión cerrada.');
    }

    /** Estado de la sesión: siempre 200 para no ensuciar la consola con 401 en páginas públicas. */
    public function sesion(): void
    {
        $recordado = Validator::cadena($_COOKIE[self::COOKIE_CORREO] ?? '');
        if (!Validator::correoUady($recordado)) {
            $recordado = '';
        }

        $usuario = Sesion::usuario();
        Http::ok([
            'autenticado'      => $usuario !== null,
            'usuario'          => $usuario,
            'csrf_token'       => Csrf::token(),
            'correo_recordado' => $recordado,
        ]);
    }

    /** Cookie HttpOnly + SameSite=Lax que recuerda el correo para precargarlo en el login. */
    private function gestionarCookieCorreo(string $correo, bool $recordar): void
    {
        $opciones = [
            'path'     => '/',
            'secure'   => Sesion::esHttps(),
            'httponly' => true,
            'samesite' => 'Lax',
        ];

        if ($recordar) {
            setcookie(self::COOKIE_CORREO, $correo, $opciones + ['expires' => time() + 86400 * self::DIAS_RECORDAR]);
        } else {
            setcookie(self::COOKIE_CORREO, '', $opciones + ['expires' => time() - 3600]);
        }
    }
}