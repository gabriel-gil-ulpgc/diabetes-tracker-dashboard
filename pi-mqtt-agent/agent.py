#!/usr/bin/env python3
from __future__ import annotations
import json
import os
import socket
import subprocess
import threading
import time
from dataclasses import dataclass
from pathlib import Path
import uuid
import logging
import re
import urllib.parse
import urllib.request

import paho.mqtt.client as mqtt


def _env(name: str, default: str = "") -> str:
    v = os.environ.get(name)
    return default if v is None else str(v)


def _now_ts() -> float:
    return time.time()


def _iso(ts: float | None = None) -> str:
    if ts is None:
        ts = _now_ts()
    return time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(ts))

def _safe_str(v: object, max_len: int = 256) -> str:
    s = "" if v is None else str(v)
    if len(s) > max_len:
        return s[: max_len - 3] + "..."
    return s


def _ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def _read_json(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _write_json_atomic(path: Path, payload: dict) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    _ensure_dir(path.parent)
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, path)


def _device_store_path() -> Path:
    # En Raspberry (Linux) esto vive fuera del repo y persiste.
    # Se puede sobreescribir por env para testing.
    base = _env("PI_AGENT_STATE_DIR", "/var/lib/pi-mqtt-agent").strip() or "/var/lib/pi-mqtt-agent"
    return Path(base) / "device.json"


def _load_or_create_device_identity() -> dict:
    """
    Crea un device_id persistente la primera vez y lo guarda en disco.
    También permite setear un ID fijo vía env (para laboratorios / reemplazos).
    """
    forced = _env("PI_DEVICE_ID", "").strip()
    path = _device_store_path()
    blob = _read_json(path) or {}

    device_id = (forced or blob.get("device_id") or "").strip()
    if not device_id:
        device_id = uuid.uuid4().hex  # simple, estable, sin PII

    display_name = (_env("PI_DEVICE_NAME", "").strip() or blob.get("display_name") or "").strip()
    if not display_name:
        # default legible; el ID es el que se usa para topics
        display_name = socket.gethostname()

    location = (_env("PI_DEVICE_LOCATION", "").strip() or blob.get("location") or "").strip()

    created_at = blob.get("created_at") or _iso()
    identity = {
        "device_id": device_id,
        "display_name": display_name,
        "location": location,
        "hostname": socket.gethostname(),
        "created_at": created_at,
        "updated_at": _iso(),
    }
    _write_json_atomic(path, identity)
    return identity


def _run(cmd: list[str], timeout: float = 10.0) -> tuple[int, str]:
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        out = (p.stdout or "").strip()
        err = (p.stderr or "").strip()
        blob = out if out else err
        return int(p.returncode), blob
    except Exception as e:
        return 999, str(e)

def _sanitize_version(v: str) -> str:
    v = (v or "").strip()
    # keep it filesystem-safe
    v = re.sub(r"[^a-zA-Z0-9._-]+", "-", v)
    return v[:64] or "unknown"

def _download(url: str, dest: Path) -> None:
    _ensure_dir(dest.parent)
    # Use curl if available, fallback to wget
    if _run(["bash", "-lc", "command -v curl >/dev/null 2>&1"], timeout=3.0)[0] == 0:
        rc, out = _run(["curl", "-fL", "-o", str(dest), url], timeout=300.0)
        if rc != 0:
            raise RuntimeError(f"curl failed: {out}")
        return
    rc, out = _run(["bash", "-lc", "command -v wget >/dev/null 2>&1"], timeout=3.0)
    if rc == 0:
        rc2, out2 = _run(["wget", "-O", str(dest), url], timeout=300.0)
        if rc2 != 0:
            raise RuntimeError(f"wget failed: {out2}")
        return
    raise RuntimeError("curl/wget not found")

def _unzip(zip_path: Path, dest_dir: Path) -> None:
    _ensure_dir(dest_dir)
    rc, out = _run(["unzip", "-o", str(zip_path), "-d", str(dest_dir)], timeout=300.0)
    if rc != 0:
        raise RuntimeError(f"unzip failed: {out}")

def _pick_release_root(extract_dir: Path) -> Path:
    """
    GitHub source zips extract into a single top-level folder (e.g. repo-main/).
    Our updater expects requirements.txt at the release root, so if it's nested
    one level down, use that folder as the effective release root.
    """
    req = extract_dir / "requirements.txt"
    if req.exists():
        return extract_dir
    try:
        kids = [p for p in extract_dir.iterdir() if p.is_dir()]
    except Exception:
        kids = []
    if len(kids) == 1:
        nested = kids[0]
        if (nested / "requirements.txt").exists():
            return nested
    return extract_dir

def _ensure_venv_and_install(release_dir: Path) -> None:
    venv_py = release_dir / ".venv" / "bin" / "python"
    pip = release_dir / ".venv" / "bin" / "pip"
    req = release_dir / "requirements.txt"
    if not req.exists():
        raise RuntimeError("requirements.txt not found in release")
    if not venv_py.exists():
        rc, out = _run(["python3", "-m", "venv", str(release_dir / ".venv")], timeout=300.0)
        if rc != 0:
            raise RuntimeError(f"venv create failed: {out}")
    rc2, out2 = _run([str(pip), "install", "-r", str(req)], timeout=600.0)
    if rc2 != 0:
        raise RuntimeError(f"pip install failed: {out2}")

def _swap_current(base_dir: Path, release_dir: Path) -> None:
    current = base_dir / "current"
    # ln -sfn release current
    rc, out = _run(["ln", "-sfn", str(release_dir), str(current)], timeout=10.0)
    if rc != 0:
        raise RuntimeError(f"symlink swap failed: {out}")


def _current_release_target(base_dir: Path) -> Path | None:
    cur = base_dir / "current"
    if not cur.exists():
        return None
    try:
        # resolve() follows symlink and returns absolute
        return cur.resolve()
    except Exception:
        return None


def _list_release_dirs(releases_dir: Path) -> list[Path]:
    if not releases_dir.is_dir():
        return []
    dirs = [p for p in releases_dir.iterdir() if p.is_dir()]
    # Sort by mtime (newest last) for "previous version" semantics.
    dirs.sort(key=lambda p: p.stat().st_mtime)
    return dirs


def _safe_rmtree(path: Path, base_dir: Path) -> None:
    # Never delete outside our app base dir
    base = base_dir.resolve()
    target = path.resolve()
    if base not in target.parents and base != target:
        raise RuntimeError(f"refusing to delete outside base dir: {target}")
    rc, out = _run(["rm", "-rf", str(target)], timeout=120.0)
    if rc != 0:
        raise RuntimeError(f"rm -rf failed: {out}")


@dataclass
class Config:
    mqtt_host: str
    mqtt_port: int
    mqtt_username: str
    mqtt_password: str
    mqtt_tls: bool
    mqtt_transport: str  # "tcp" | "websockets"
    mqtt_ws_path: str
    mqtt_client_id: str
    device_id: str
    device_name: str
    device_location: str
    base_topic: str
    heartbeat_sec: int
    app_service_name: str
    app_env_file: str
    app_systemd_mode: str  # "system" | "user"
    app_user: str
    app_user_uid: int
    app_base_dir: str

    @property
    def topic_cmd(self) -> str:
        return f"{self.base_topic}/{self.device_id}/cmd"

    @property
    def topic_status(self) -> str:
        return f"{self.base_topic}/{self.device_id}/status"

    @property
    def topic_telemetry(self) -> str:
        return f"{self.base_topic}/{self.device_id}/telemetry"

    @property
    def topic_ack_prefix(self) -> str:
        return f"{self.base_topic}/{self.device_id}/ack"

    @property
    def topic_log(self) -> str:
        return f"{self.base_topic}/{self.device_id}/log"


def _systemd_state(service: str) -> dict:
    rc1, active = _run(["systemctl", "is-active", service], timeout=5.0)
    rc2, enabled = _run(["systemctl", "is-enabled", service], timeout=5.0)
    return {
        "service": service,
        "active": (active or "unknown"),
        "enabled": (enabled or "unknown"),
        "rc_active": rc1,
        "rc_enabled": rc2,
    }

def _systemd_user_state(service: str, user: str, uid: int) -> dict:
    # Usamos runuser para evitar restricciones de sudo con env vars (XDG_RUNTIME_DIR).
    base = [
        "runuser",
        "-u",
        user,
        "--",
        "env",
        "XDG_RUNTIME_DIR=/run/user/%d" % uid,
        "systemctl",
        "--user",
    ]
    rc1, active = _run(base + ["is-active", service], timeout=5.0)
    rc2, enabled = _run(base + ["is-enabled", service], timeout=5.0)
    return {
        "service": service,
        "active": (active or "unknown"),
        "enabled": (enabled or "unknown"),
        "rc_active": rc1,
        "rc_enabled": rc2,
        "mode": "user",
        "user": user,
    }


def _systemd_action(service: str, action: str) -> dict:
    rc, out = _run(["systemctl", action, service], timeout=20.0)
    st = _systemd_state(service)
    return {
        "action": action,
        "rc": rc,
        "output": out,
        "state": st,
    }

def _systemd_is_active(service: str) -> bool:
    rc, out = _run(["systemctl", "is-active", service], timeout=4.0)
    return rc == 0 and (out or "").strip() == "active"

def _systemd_user_action(service: str, action: str, user: str, uid: int) -> dict:
    base = [
        "runuser",
        "-u",
        user,
        "--",
        "env",
        "XDG_RUNTIME_DIR=/run/user/%d" % uid,
        "systemctl",
        "--user",
    ]
    rc, out = _run(base + [action, service], timeout=25.0)
    st = _systemd_user_state(service, user, uid)
    return {
        "action": action,
        "rc": rc,
        "output": out,
        "state": st,
        "mode": "user",
        "user": user,
    }

def _systemd_show(service: str, props: list[str]) -> dict[str, str]:
    # Returns a dict of requested properties (best-effort).
    out: dict[str, str] = {}
    for p in props:
        rc, val = _run(["systemctl", "show", service, "-p", p], timeout=5.0)
        if rc == 0 and val and "=" in val:
            _k, _v = val.split("=", 1)
            out[p] = _v.strip()
    return out

def _systemd_user_show(service: str, props: list[str], user: str, uid: int) -> dict[str, str]:
    out: dict[str, str] = {}
    base = [
        "runuser",
        "-u",
        user,
        "--",
        "env",
        "XDG_RUNTIME_DIR=/run/user/%d" % uid,
        "systemctl",
        "--user",
    ]
    for p in props:
        rc, val = _run(base + ["show", service, "-p", p], timeout=6.0)
        if rc == 0 and val and "=" in val:
            _k, _v = val.split("=", 1)
            out[p] = _v.strip()
    return out

def _proc_environ(pid: int) -> tuple[dict[str, str], str]:
    env: dict[str, str] = {}
    try:
        raw = Path(f"/proc/{pid}/environ").read_bytes()
        for part in raw.split(b"\x00"):
            if not part or b"=" not in part:
                continue
            k, v = part.split(b"=", 1)
            try:
                env[k.decode("utf-8", "ignore")] = v.decode("utf-8", "ignore")
            except Exception:
                continue
        return env, ""
    except Exception as e:
        return {}, str(e)


def _build_config() -> Config:
    mqtt_username = _env("MQTT_USERNAME", "").strip()
    forced_device_id = _env("PI_DEVICE_ID", "").strip()

    identity = _load_or_create_device_identity()
    persisted_device_id = str(identity.get("device_id", "")).strip()

    # Regla práctica para que la ACL pattern dt/%u/# funcione siempre:
    # - Si hay PI_DEVICE_ID → manda.
    # - Si no, y hay MQTT_USERNAME → device_id = MQTT_USERNAME.
    # - Si no, usa el persistido / hostname.
    device_id = forced_device_id or mqtt_username or persisted_device_id or socket.gethostname()

    # Persistimos el device_id elegido para que sea estable.
    path = _device_store_path()
    blob = _read_json(path) or {}
    blob["device_id"] = device_id
    blob["updated_at"] = _iso()
    _write_json_atomic(path, blob)

    device_name = str(identity.get("display_name", "")).strip() or socket.gethostname()
    device_location = str(identity.get("location", "")).strip()
    client_id = _env("MQTT_CLIENT_ID", f"pi-agent-{device_id}")
    app_systemd_mode = (_env("APP_SYSTEMD_MODE", "system").strip() or "system").lower()
    app_user = _env("APP_USER", "ggil").strip() or "ggil"
    try:
        app_user_uid = int(_env("APP_USER_UID", "1000"))
    except Exception:
        app_user_uid = 1000
    return Config(
        mqtt_host=_env("MQTT_HOST", "127.0.0.1"),
        mqtt_port=int(_env("MQTT_PORT", "1883")),
        mqtt_username=mqtt_username,
        mqtt_password=_env("MQTT_PASSWORD", ""),
        mqtt_tls=_env("MQTT_TLS", "0") in ("1", "true", "True"),
        mqtt_transport=_env("MQTT_TRANSPORT", "tcp").strip() or "tcp",
        mqtt_ws_path=_env("MQTT_WS_PATH", "/").strip() or "/",
        mqtt_client_id=client_id,
        device_id=device_id,
        device_name=device_name,
        device_location=device_location,
        base_topic=_env("BASE_TOPIC", "dt"),
        heartbeat_sec=int(_env("HEARTBEAT_SEC", "10")),
        app_service_name=_env("APP_SERVICE_NAME", "h2train-app.service"),
        app_env_file=_env("APP_ENV_FILE", "/etc/h2train-app.env"),
        app_systemd_mode=app_systemd_mode,
        app_user=app_user,
        app_user_uid=app_user_uid,
        app_base_dir=_env("APP_BASE_DIR", "/opt/h2train-app"),
    )

def _write_env_kv(path: str, updates: dict[str, str]) -> None:
    """
    Escribe un archivo tipo EnvironmentFile de systemd (KEY=VALUE).
    - Mantiene claves existentes que no se tocan
    - Actualiza/agrega las de `updates`
    """
    def _fmt_env_value(v: str) -> str:
        """
        systemd EnvironmentFile soporta valores sin espacios o entre comillas.
        Para evitar que espacios/paréntesis rompan el parseo, ponemos comillas cuando haga falta.
        """
        s = "" if v is None else str(v)
        if s == "":
            return ""
        needs_quote = any(ch.isspace() for ch in s) or any(ch in s for ch in ['"', "'", "#", "(", ")", ";"])
        if not needs_quote:
            return s
        # Escape mínimo para comillas dobles.
        esc = s.replace("\\", "\\\\").replace('"', '\\"')
        return f"\"{esc}\""

    p = Path(path)
    existing: dict[str, str] = {}
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            s = line.strip()
            if not s or s.startswith("#") or "=" not in s:
                continue
            k, v = s.split("=", 1)
            existing[k.strip()] = v.strip()
    existing.update({k: _fmt_env_value(_safe_str(v, 2048)) for k, v in updates.items()})
    _ensure_dir(p.parent)
    content = "\n".join([f"{k}={existing[k]}" for k in sorted(existing.keys())]) + "\n"
    p.write_text(content, encoding="utf-8")


def main() -> None:
    cfg = _build_config()
    started_at = _now_ts()

    transport = "websockets" if cfg.mqtt_transport.lower() in ("ws", "websocket", "websockets") else "tcp"
    print(f"[pi-mqtt-agent] start device_id={cfg.device_id} mqtt_user={cfg.mqtt_username} base={cfg.base_topic}")

    # Si alguien configura TCP contra el Quick Tunnel (443), nunca funcionará.
    # Cloudflare Tunnel (quick) es L7 y para MQTT normalmente se usa WebSockets.
    if transport == "tcp" and cfg.mqtt_port in (443, 8443):
        print(
            "[pi-mqtt-agent] WARNING: MQTT_TRANSPORT=tcp with port 443 usually means you're pointing at a Cloudflare Tunnel. "
            "Use MQTT_TRANSPORT=websockets OR connect directly to Mosquitto on LAN (1883)."
        )

    client = mqtt.Client(client_id=cfg.mqtt_client_id, clean_session=True, transport=transport)

    # Emit logs to journald so we can debug connection/auth/DNS issues.
    logging.basicConfig(level=logging.INFO)
    client.enable_logger()

    if cfg.mqtt_username:
        client.username_pw_set(cfg.mqtt_username, cfg.mqtt_password)
    if cfg.mqtt_tls:
        client.tls_set()
    if transport == "websockets":
        # Cloudflare Tunnel: conecta a wss://mqtt.tudominio.com (puerto 443) usando WebSockets.
        # Mosquitto suele exponer WS en "/" (o el path que configures).
        client.ws_set_options(path=cfg.mqtt_ws_path)

    offline_payload = json.dumps(
        {
            "device_id": cfg.device_id,
            "ts": _now_ts(),
            "iso": _iso(),
            "online": False,
            "reason": "lwt",
        }
    )
    client.will_set(cfg.topic_status, payload=offline_payload, qos=1, retain=True)

    def publish_telemetry(extra: dict | None = None) -> None:
        payload = {
            "device_id": cfg.device_id,
            "name": cfg.device_name,
            "location": cfg.device_location,
            "hostname": socket.gethostname(),
            "ts": _now_ts(),
            "iso": _iso(),
            "agent": {
                "service": "pi-mqtt-agent.service",
                "transport": transport,
            },
        }
        if extra:
            payload.update(extra)
        client.publish(cfg.topic_telemetry, json.dumps(payload), qos=1, retain=True)

    def _http_get_json(url: str, timeout: float = 5.0) -> dict:
        req = urllib.request.Request(url, headers={"User-Agent": "pi-mqtt-agent"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:  # nosec - local endpoint
            raw = resp.read()
        return json.loads(raw.decode("utf-8"))

    stream_state = {"enabled": False, "interval": 0.1, "runtime_every": 4.0}
    stream_thread: list[threading.Thread] = []

    def _publish_app_runtime_once():
        try:
            j = _http_get_json("http://127.0.0.1:8099/api/runtime", timeout=5.0)
            if not j.get("ok"):
                publish_telemetry({"app_runtime": {"ok": False, "error": j.get("error", "unknown")}})
                return
            publish_telemetry({"app_runtime": j})
        except Exception as e:
            publish_telemetry({"app_runtime": {"ok": False, "error": str(e)}})

    def _publish_app_key_once():
        try:
            j = _http_get_json("http://127.0.0.1:8099/api/key", timeout=2.0)
            if not j.get("ok"):
                publish_telemetry({"app_key": {"ok": False, "error": j.get("error", "unknown")}})
                return
            publish_telemetry({"app_key": j})
        except Exception as e:
            publish_telemetry({"app_key": {"ok": False, "error": str(e)}})

    def _ensure_stream_thread():
        if stream_thread:
            t = stream_thread[0]
            if t.is_alive():
                return

        def _loop():
            last_runtime = 0.0
            last_seq: int | None = None
            while stream_state["enabled"]:
                t0 = time.time()
                # Poll fast, but only publish when key changes (reduces noise/traffic).
                try:
                    j = _http_get_json("http://127.0.0.1:8099/api/key", timeout=2.0)
                    if j.get("ok"):
                        seq = j.get("key_seq")
                        if isinstance(seq, int) and seq != last_seq:
                            last_seq = seq
                            publish_telemetry({"app_key": j})
                    else:
                        publish_telemetry({"app_key": {"ok": False, "error": j.get("error", "unknown")}})
                except Exception as e:
                    publish_telemetry({"app_key": {"ok": False, "error": str(e)}})
                # Runtime (signal) less frequently to reduce load.
                if (t0 - last_runtime) >= float(stream_state["runtime_every"]):
                    _publish_app_runtime_once()
                    last_runtime = t0
                # Sleep remainder to keep cadence stable.
                sleep_s = max(0.01, float(stream_state["interval"]) - (time.time() - t0))
                time.sleep(sleep_s)

        t = threading.Thread(target=_loop, daemon=True, name="app-runtime-stream")
        stream_thread[:] = [t]
        t.start()

    def publish_status(extra: dict | None = None) -> None:
        st = (
            _systemd_user_state(cfg.app_service_name, cfg.app_user, cfg.app_user_uid)
            if cfg.app_systemd_mode == "user"
            else _systemd_state(cfg.app_service_name)
        )
        payload = {
            "device_id": cfg.device_id,
            "name": cfg.device_name,
            "location": cfg.device_location,
            "ts": _now_ts(),
            "iso": _iso(),
            "online": True,
            "uptime_sec": int(_now_ts() - started_at),
            "app": st,
        }
        if extra:
            payload.update(extra)
        client.publish(cfg.topic_status, json.dumps(payload), qos=1, retain=True)

    def respond(req_id: str, ok: bool, result: dict | None = None, error: str | None = None) -> None:
        topic = f"{cfg.topic_ack_prefix}/{req_id or 'noid'}"
        payload = {
            "device_id": cfg.device_id,
            "name": cfg.device_name,
            "ts": _now_ts(),
            "iso": _iso(),
            "ok": ok,
            "result": result or {},
            "error": error or "",
        }
        client.publish(topic, json.dumps(payload), qos=1, retain=False)

    def on_connect(_client, _userdata, _flags, rc):
        print(f"[pi-mqtt-agent] on_connect rc={rc} host={cfg.mqtt_host}:{cfg.mqtt_port} transport={transport}")
        if rc == 0:
            client.subscribe(cfg.topic_cmd, qos=1)
            publish_telemetry({"reason": "connected"})
            publish_status({"reason": "connected"})
        else:
            # 4/5 suelen ser auth (bad user/pass / not authorized)
            # Mantenemos vivo el proceso para que paho reintente.
            print("[pi-mqtt-agent] connect failed (rc != 0) — check credentials/ACL")

    def on_disconnect(_client, _userdata, rc):
        print(f"[pi-mqtt-agent] on_disconnect rc={rc}")

    def on_message(_client, _userdata, msg):
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except Exception:
            return

        cmd = str(payload.get("cmd", "")).strip()
        req_id = str(payload.get("id", "")).strip()

        try:
            if cmd == "ping":
                publish_status({"reason": "ping"})
                respond(req_id, True, {"pong": True})
                return
            if cmd == "app.status":
                st = (
                    _systemd_user_state(cfg.app_service_name, cfg.app_user, cfg.app_user_uid)
                    if cfg.app_systemd_mode == "user"
                    else _systemd_state(cfg.app_service_name)
                )
                respond(req_id, True, {"app": st})
                return
            if cmd == "app.stop":
                res = (
                    _systemd_user_action(cfg.app_service_name, "stop", cfg.app_user, cfg.app_user_uid)
                    if cfg.app_systemd_mode == "user"
                    else _systemd_action(cfg.app_service_name, "stop")
                )
                publish_status({"reason": "app.stop"})
                respond(req_id, True, res)
                return
            if cmd == "app.start":
                res = (
                    _systemd_user_action(cfg.app_service_name, "start", cfg.app_user, cfg.app_user_uid)
                    if cfg.app_systemd_mode == "user"
                    else _systemd_action(cfg.app_service_name, "start")
                )
                publish_status({"reason": "app.start"})
                respond(req_id, True, res)
                return
            if cmd == "app.restart":
                res = (
                    _systemd_user_action(cfg.app_service_name, "restart", cfg.app_user, cfg.app_user_uid)
                    if cfg.app_systemd_mode == "user"
                    else _systemd_action(cfg.app_service_name, "restart")
                )
                publish_status({"reason": "app.restart"})
                respond(req_id, True, res)
                return
            if cmd == "app.update":
                # args: { version: "...", url: "https://..." }
                args = payload.get("args") or {}
                if not isinstance(args, dict):
                    respond(req_id, False, error="args debe ser objeto {version,url}")
                    return
                url = str(args.get("url", "")).strip()
                version = _sanitize_version(str(args.get("version", "")).strip())
                if not url:
                    respond(req_id, False, error="args.url requerido")
                    return
                u = urllib.parse.urlparse(url)
                if u.scheme not in ("https", "http"):
                    respond(req_id, False, error="Solo se permite http/https")
                    return

                base_dir = Path(cfg.app_base_dir)
                releases = base_dir / "releases"
                release_dir = releases / version
                tmp_zip = base_dir / ".updates" / f"{version}.zip"

                try:
                    publish_status({"reason": "app.update"})
                    _download(url, tmp_zip)
                    _unzip(tmp_zip, release_dir)
                    root = _pick_release_root(release_dir)
                    _ensure_venv_and_install(root)
                    _swap_current(base_dir, root)
                    # restart app service (user or system)
                    restart_res = (
                        _systemd_user_action(cfg.app_service_name, "restart", cfg.app_user, cfg.app_user_uid)
                        if cfg.app_systemd_mode == "user"
                        else _systemd_action(cfg.app_service_name, "restart")
                    )
                    publish_status({"reason": "app.update.done"})
                    respond(
                        req_id,
                        True,
                        {
                            "version": version,
                            "url": url,
                            "release_dir": str(root),
                            "current": str(base_dir / "current"),
                            "restart": restart_res,
                        },
                    )
                except Exception as e:
                    respond(req_id, False, error=str(e))
                return
            if cmd == "app.update.check":
                # args: { version: "...", url: "https://..." }
                # Dry-run: download + unzip + install deps, but DO NOT swap current or restart.
                args = payload.get("args") or {}
                if not isinstance(args, dict):
                    respond(req_id, False, error="args debe ser objeto {version,url}")
                    return
                url = str(args.get("url", "")).strip()
                version = _sanitize_version(str(args.get("version", "")).strip())
                if not url:
                    respond(req_id, False, error="args.url requerido")
                    return
                u = urllib.parse.urlparse(url)
                if u.scheme not in ("https", "http"):
                    respond(req_id, False, error="Solo se permite http/https")
                    return

                base_dir = Path(cfg.app_base_dir)
                releases = base_dir / "releases"
                # Stage into a unique directory so we never overwrite an existing release.
                suffix = req_id or str(int(time.time()))
                staged_dir = releases / f"{version}__check__{suffix}"
                tmp_zip = base_dir / ".updates" / f"{version}__check__{suffix}.zip"

                try:
                    publish_status({"reason": "app.update.check"})
                    _download(url, tmp_zip)
                    _unzip(tmp_zip, staged_dir)
                    root = _pick_release_root(staged_dir)
                    _ensure_venv_and_install(root)
                    publish_status({"reason": "app.update.check.done"})
                    respond(
                        req_id,
                        True,
                        {
                            "version": version,
                            "url": url,
                            "staged_dir": str(root),
                            "zip": str(tmp_zip),
                            "would_activate": str(releases / version),
                            "note": "OK: descarga+unzip+deps. No se activó (no swap current, no restart).",
                        },
                    )
                except Exception as e:
                    respond(req_id, False, error=str(e))
                return
            if cmd == "app.rollback":
                # args: { version?: "..."} if omitted -> previous by mtime
                args = payload.get("args") or {}
                if args and not isinstance(args, dict):
                    respond(req_id, False, error="args debe ser objeto {version?}")
                    return
                version = _sanitize_version(str((args or {}).get("version", "")).strip())
                base_dir = Path(cfg.app_base_dir)
                releases = base_dir / "releases"
                cur_target = _current_release_target(base_dir)
                all_dirs = _list_release_dirs(releases)
                if not all_dirs:
                    respond(req_id, False, error="no releases found")
                    return

                target: Path | None = None
                if (args or {}).get("version"):
                    cand = releases / version
                    if not cand.is_dir():
                        respond(req_id, False, error=f"release not found: {version}")
                        return
                    target = cand
                else:
                    # pick previous to current by mtime ordering
                    if cur_target is None:
                        target = all_dirs[-1]
                    else:
                        try:
                            idx = [p.resolve() for p in all_dirs].index(cur_target)
                            target = all_dirs[idx - 1] if idx > 0 else None
                        except Exception:
                            target = all_dirs[-1]
                if target is None:
                    respond(req_id, False, error="no previous release to rollback to")
                    return

                try:
                    _swap_current(base_dir, target)
                    restart_res = (
                        _systemd_user_action(cfg.app_service_name, "restart", cfg.app_user, cfg.app_user_uid)
                        if cfg.app_systemd_mode == "user"
                        else _systemd_action(cfg.app_service_name, "restart")
                    )
                    publish_status({"reason": "app.rollback"})
                    respond(
                        req_id,
                        True,
                        {
                            "to": str(target),
                            "current": str(base_dir / "current"),
                            "restart": restart_res,
                        },
                    )
                except Exception as e:
                    respond(req_id, False, error=str(e))
                return

            if cmd == "app.cleanup":
                # args: { keep?: number } -> keep current + N previous
                args = payload.get("args") or {}
                if args and not isinstance(args, dict):
                    respond(req_id, False, error="args debe ser objeto {keep?}")
                    return
                try:
                    keep = int((args or {}).get("keep", 2))
                except Exception:
                    keep = 2
                keep = max(0, min(keep, 20))

                base_dir = Path(cfg.app_base_dir)
                releases = base_dir / "releases"
                cur_target = _current_release_target(base_dir)
                all_dirs = _list_release_dirs(releases)
                if cur_target is None:
                    respond(req_id, False, error="current symlink missing")
                    return

                resolved = [p.resolve() for p in all_dirs]
                try:
                    idx = resolved.index(cur_target)
                except Exception:
                    idx = len(all_dirs) - 1

                keep_set: set[Path] = set()
                keep_set.add(cur_target)
                # add previous N
                for i in range(1, keep + 1):
                    j = idx - i
                    if j >= 0:
                        keep_set.add(all_dirs[j].resolve())

                deleted: list[str] = []
                for d in all_dirs:
                    rp = d.resolve()
                    if rp in keep_set:
                        continue
                    _safe_rmtree(d, base_dir)
                    deleted.append(d.name)

                # Optional: cleanup downloaded zips older than keep_set versions
                try:
                    updates_dir = base_dir / ".updates"
                    if updates_dir.is_dir():
                        for z in updates_dir.glob("*.zip"):
                            if z.name.replace(".zip", "") not in deleted:
                                continue
                            z.unlink(missing_ok=True)  # type: ignore[arg-type]
                except Exception:
                    pass

                publish_status({"reason": "app.cleanup"})
                respond(req_id, True, {"deleted": deleted, "kept": [p.name for p in keep_set]})
                return
            if cmd == "app.config.set":
                # payload: { id, cmd:"app.config.set", env: { "KEY":"VALUE", ... }, restart:true/false }
                # Accept both legacy payload shape and the dashboard shape { cmd, args:{ env, restart } }.
                args = payload.get("args") or {}
                env_updates = payload.get("env")
                if env_updates is None and isinstance(args, dict):
                    env_updates = args.get("env")
                env_updates = env_updates or {}
                if not isinstance(env_updates, dict):
                    respond(req_id, False, error="env debe ser un objeto {KEY:VALUE}")
                    return
                updates = {str(k): _safe_str(v, 2048) for k, v in env_updates.items()}
                _write_env_kv(cfg.app_env_file, updates)
                restart_val = payload.get("restart")
                if restart_val is None and isinstance(args, dict):
                    restart_val = args.get("restart")
                do_restart = bool(True if restart_val is None else restart_val)
                # Prefer configured systemd scope, but fall back to system scope if that's what is actually active.
                want_user = cfg.app_systemd_mode == "user"
                if want_user and _systemd_is_active(cfg.app_service_name):
                    want_user = False
                action_res = (
                    _systemd_user_action(
                        cfg.app_service_name,
                        "restart" if do_restart else "reload-or-restart",
                        cfg.app_user,
                        cfg.app_user_uid,
                    )
                    if want_user
                    else _systemd_action(cfg.app_service_name, "restart" if do_restart else "reload-or-restart")
                )
                publish_status({"reason": "app.config.set"})
                respond(req_id, True, {"written": cfg.app_env_file, "updates": sorted(list(updates.keys())), "action": action_res})
                return
            if cmd == "app.config.get":
                # Returns current env file contents + parsed key/values.
                p = Path(cfg.app_env_file)
                try:
                    text = p.read_text(encoding="utf-8") if p.exists() else ""
                except Exception as e:
                    respond(req_id, False, error=f"no se pudo leer env: {e}")
                    return
                parsed: dict[str, str] = {}
                for line in text.splitlines():
                    s = line.strip()
                    if not s or s.startswith("#") or "=" not in s:
                        continue
                    k, v = s.split("=", 1)
                    parsed[k.strip()] = v.strip()
                respond(
                    req_id,
                    True,
                    {
                        "env_file": cfg.app_env_file,
                        "raw": text,
                        "parsed": parsed,
                        "h2t": {k: parsed.get(k, "") for k in sorted(parsed.keys()) if k.startswith("H2T_")},
                    },
                )
                return
            if cmd == "app.env.get":
                # Inspect runtime env of the running service process (MainPID).
                show_system = _systemd_show(cfg.app_service_name, ["MainPID", "ExecStart", "WorkingDirectory"])
                show_user = _systemd_user_show(
                    cfg.app_service_name, ["MainPID", "ExecStart", "WorkingDirectory"], cfg.app_user, cfg.app_user_uid
                )

                def _pid_of(show: dict[str, str]) -> int:
                    try:
                        return int(show.get("MainPID", "0") or "0")
                    except Exception:
                        return 0

                pid_system = _pid_of(show_system)
                pid_user = _pid_of(show_user)
                # If configured scope yields pid=0, try the other scope automatically.
                pid = pid_user if cfg.app_systemd_mode == "user" else pid_system
                if pid <= 0:
                    pid = pid_system if pid_system > 0 else pid_user

                env, env_err = _proc_environ(pid) if pid > 0 else ({}, "pid=0")
                h2t = {k: env.get(k, "") for k in sorted(env.keys()) if k.startswith("H2T_")}
                sample_keys = sorted(list(env.keys()))[:25]
                respond(
                    req_id,
                    True,
                    {
                        "service": cfg.app_service_name,
                        "show": {"system": show_system, "user": show_user},
                        "pid": pid,
                        "h2t": h2t,
                        "env_size": len(env),
                        "env_sample_keys": sample_keys,
                        "env_read_error": env_err,
                        "note": "Estos valores son los H2T_* que ve el proceso en ejecución (/proc/<pid>/environ).",
                    },
                )
                return

            if cmd == "app.code.get":
                # Read the currently deployed app.py and extract version / markers.
                base_dir = Path(cfg.app_base_dir)
                app_py = (base_dir / "current" / "app.py")
                try:
                    text = app_py.read_text(encoding="utf-8", errors="ignore")
                except Exception as e:
                    respond(req_id, False, error=f"no se pudo leer {app_py}: {e}")
                    return
                m = re.search(r'^\s*APP_VERSION\s*=\s*"([^"]+)"', text, flags=re.M)
                version = m.group(1) if m else ""
                markers = {
                    "has_env_loader": "_load_env_file_into_process" in text,
                    "has_putenv": "os.putenv" in text,
                    "has_effective_log": "effective H2T_*" in text or "loaded" in text,
                }
                respond(
                    req_id,
                    True,
                    {
                        "path": str(app_py),
                        "app_version": version,
                        "markers": markers,
                    },
                )
                return

            if cmd == "app.snapshot":
                _publish_app_key_once()
                _publish_app_runtime_once()
                respond(req_id, True, {"published": True})
                return

            if cmd == "app.stream.set":
                args = payload.get("args") or {}
                if not isinstance(args, dict):
                    respond(req_id, False, error="args debe ser objeto {enabled, interval_sec?}")
                    return
                enabled = bool(args.get("enabled", False))
                try:
                    interval = float(args.get("interval_sec", stream_state["interval"]))
                except Exception:
                    interval = float(stream_state["interval"])
                try:
                    runtime_every = float(args.get("runtime_every_sec", stream_state["runtime_every"]))
                except Exception:
                    runtime_every = float(stream_state["runtime_every"])
                stream_state["enabled"] = enabled
                # Allow 10Hz polling for near real-time key tracking.
                stream_state["interval"] = max(0.1, min(interval, 60.0))
                stream_state["runtime_every"] = max(1.0, min(runtime_every, 120.0))
                if enabled:
                    _ensure_stream_thread()
                    # Publish immediate snapshot so UI updates instantly.
                    _publish_app_key_once()
                    _publish_app_runtime_once()
                    publish_telemetry(
                        {
                            "reason": "app.stream.on",
                            "app_stream": {"enabled": True, "interval_sec": stream_state["interval"], "runtime_every_sec": stream_state["runtime_every"]},
                        }
                    )
                else:
                    publish_telemetry({"reason": "app.stream.off", "app_stream": {"enabled": False}})
                respond(
                    req_id,
                    True,
                    {"enabled": enabled, "interval_sec": stream_state["interval"], "runtime_every_sec": stream_state["runtime_every"]},
                )
                return
            if cmd == "device.meta.set":
                # payload: { id, cmd:"device.meta.set", name?, location? }
                name = str(payload.get("name", "")).strip()
                location = str(payload.get("location", "")).strip()
                # Persistimos en el mismo store que creó el id
                path = _device_store_path()
                blob = _read_json(path) or {}
                if name:
                    blob["display_name"] = name
                    cfg.device_name = name  # type: ignore[misc]
                if location or ("location" in payload):
                    blob["location"] = location
                    cfg.device_location = location  # type: ignore[misc]
                blob["updated_at"] = _iso()
                _write_json_atomic(path, blob)
                publish_telemetry({"reason": "device.meta.set"})
                publish_status({"reason": "device.meta.set"})
                respond(req_id, True, {"device": {"device_id": cfg.device_id, "name": cfg.device_name, "location": cfg.device_location}})
                return
            if cmd == "agent.restart":
                respond(req_id, True, {"note": "reiniciando agente"})
                _run(["systemctl", "restart", "pi-mqtt-agent.service"], timeout=5.0)
                return

            respond(req_id, False, error=f"cmd no soportado: {cmd}")
        except Exception as e:
            respond(req_id, False, error=str(e))

    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect

    # Usamos connect_async para no quedarnos colgados en DNS/TLS.
    # paho se reconecta automáticamente según reconnect_delay_set.
    client.reconnect_delay_set(min_delay=1, max_delay=30)
    try:
        client.connect_async(cfg.mqtt_host, cfg.mqtt_port, keepalive=30)
    except Exception as e:
        print(f"[pi-mqtt-agent] connect_async failed: {e}")

    client.loop_start()

    last_hb = 0.0
    while True:
        now = _now_ts()
        if client.is_connected() and now - last_hb >= max(3, cfg.heartbeat_sec):
            publish_telemetry({"reason": "heartbeat"})
            publish_status({"reason": "heartbeat"})
            last_hb = now
        time.sleep(1.0)


if __name__ == "__main__":
    main()

