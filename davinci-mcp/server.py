"""Serveur MCP qui relie Claude (Desktop / Cowork) à DaVinci Resolve.

Il tourne sur la machine où Resolve est ouvert et passe par l'API de script
officielle (DaVinciResolveScript). Claude le lance tout seul via
claude_desktop_config.json — voir README.md dans ce dossier.
"""

from __future__ import annotations

import contextlib
import io
import os
import platform
import re
import sys
import traceback
from pathlib import Path
from typing import Any

from mcp.server.fastmcp import FastMCP

REPO_ROOT = Path(__file__).resolve().parent.parent

mcp = FastMCP("davinci-resolve")

# --- Connexion à Resolve ---------------------------------------------------

_DEFAULT_PATHS = {
    "Darwin": (
        "/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Scripting",
        "/Applications/DaVinci Resolve/DaVinci Resolve.app/Contents/Libraries/Fusion/fusionscript.so",
    ),
    "Windows": (
        os.path.join(
            os.environ.get("PROGRAMDATA", r"C:\ProgramData"),
            r"Blackmagic Design\DaVinci Resolve\Support\Developer\Scripting",
        ),
        r"C:\Program Files\Blackmagic Design\DaVinci Resolve\fusionscript.dll",
    ),
    "Linux": (
        "/opt/resolve/Developer/Scripting",
        "/opt/resolve/libs/Fusion/fusionscript.so",
    ),
}

_resolve = None


def _load_script_module():
    api, lib = _DEFAULT_PATHS.get(platform.system(), _DEFAULT_PATHS["Linux"])
    os.environ.setdefault("RESOLVE_SCRIPT_API", api)
    os.environ.setdefault("RESOLVE_SCRIPT_LIB", lib)
    modules = os.path.join(os.environ["RESOLVE_SCRIPT_API"], "Modules")
    if modules not in sys.path:
        sys.path.append(modules)
    import DaVinciResolveScript as dvr  # type: ignore

    return dvr


def resolve():
    """Renvoie l'objet Resolve, en (re)connectant si besoin."""
    global _resolve
    if _resolve is not None:
        try:
            _resolve.GetVersionString()
            return _resolve
        except Exception:
            _resolve = None
    try:
        dvr = _load_script_module()
    except ImportError as e:
        raise RuntimeError(
            "Module DaVinciResolveScript introuvable. Vérifiez RESOLVE_SCRIPT_API / "
            f"RESOLVE_SCRIPT_LIB (README.md). Détail : {e}"
        ) from e
    r = dvr.scriptapp("Resolve")
    if r is None:
        raise RuntimeError(
            "Impossible de joindre DaVinci Resolve. Il doit être ouvert, et "
            "Préférences > Système > Général > « External scripting using » doit "
            "être sur « Local ». Depuis Resolve 21.1, le scripting externe exige "
            "Resolve Studio (la version gratuite ne le permet plus)."
        )
    _resolve = r
    return r


def project():
    p = resolve().GetProjectManager().GetCurrentProject()
    if p is None:
        raise RuntimeError("Aucun projet ouvert dans Resolve.")
    return p


def timeline():
    t = project().GetCurrentTimeline()
    if t is None:
        raise RuntimeError("Aucune timeline active.")
    return t


def _fps(item) -> float:
    try:
        return float(item.GetClipProperty("FPS"))
    except (TypeError, ValueError):
        return float(project().GetSetting("timelineFrameRate") or 30)


def _find_clip(name_or_path: str):
    """Cherche un clip du media pool par nom ou chemin de fichier (récursif)."""
    target = name_or_path.lower()

    def walk(folder):
        for c in folder.GetClipList() or []:
            if target in (
                (c.GetName() or "").lower(),
                (c.GetClipProperty("File Path") or "").lower(),
            ):
                return c
        for sub in folder.GetSubFolderList() or []:
            hit = walk(sub)
            if hit:
                return hit
        return None

    return walk(project().GetMediaPool().GetRootFolder())


def _import_or_find(path: str):
    clip = _find_clip(path) or _find_clip(os.path.basename(path))
    if clip:
        return clip
    if not os.path.exists(path):
        raise RuntimeError(f"Fichier introuvable : {path}")
    items = project().GetMediaPool().ImportMedia([path]) or []
    if not items:
        raise RuntimeError(f"Resolve a refusé l'import de {path}")
    return items[0]


# --- État ------------------------------------------------------------------


@mcp.tool()
def get_status() -> dict[str, Any]:
    """Version de Resolve, page affichée, projet et timeline en cours."""
    r = resolve()
    p = r.GetProjectManager().GetCurrentProject()
    t = p.GetCurrentTimeline() if p else None
    return {
        "product": r.GetProductName(),
        "version": r.GetVersionString(),
        "page": r.GetCurrentPage(),
        "project": p.GetName() if p else None,
        "timeline": t.GetName() if t else None,
        "timeline_fps": p.GetSetting("timelineFrameRate") if p else None,
        "resolution": (
            f'{p.GetSetting("timelineResolutionWidth")}x{p.GetSetting("timelineResolutionHeight")}'
            if p
            else None
        ),
    }


@mcp.tool()
def open_page(page: str) -> bool:
    """Affiche une page : media, cut, edit, fusion, color, fairlight, deliver."""
    return bool(resolve().OpenPage(page))


# --- Projets -----------------------------------------------------------------


@mcp.tool()
def list_projects() -> list[str]:
    """Projets du dossier courant de la base de données."""
    return list(resolve().GetProjectManager().GetProjectListInCurrentFolder() or [])


@mcp.tool()
def open_project(name: str) -> bool:
    """Ouvre un projet existant (le projet courant est sauvegardé avant)."""
    pm = resolve().GetProjectManager()
    pm.SaveProject()
    return pm.LoadProject(name) is not None


@mcp.tool()
def create_project(name: str, width: int = 1080, height: int = 1920, fps: str = "30") -> bool:
    """Crée et ouvre un projet (par défaut vertical 1080x1920 à 30 i/s, comme le reel)."""
    p = resolve().GetProjectManager().CreateProject(name)
    if p is None:
        return False
    p.SetSetting("timelineResolutionWidth", str(width))
    p.SetSetting("timelineResolutionHeight", str(height))
    p.SetSetting("timelineFrameRate", fps)
    p.SetSetting("timelinePlaybackFrameRate", fps)
    return True


@mcp.tool()
def save_project() -> bool:
    """Sauvegarde le projet courant."""
    return bool(resolve().GetProjectManager().SaveProject())


# --- Media pool ---------------------------------------------------------------


@mcp.tool()
def list_media_pool() -> list[dict[str, Any]]:
    """Tous les clips du media pool (nom, dossier, chemin, durée, fps)."""
    out: list[dict[str, Any]] = []

    def walk(folder, prefix):
        for c in folder.GetClipList() or []:
            out.append(
                {
                    "name": c.GetName(),
                    "bin": prefix,
                    "path": c.GetClipProperty("File Path"),
                    "duration": c.GetClipProperty("Duration"),
                    "fps": c.GetClipProperty("FPS"),
                }
            )
        for sub in folder.GetSubFolderList() or []:
            walk(sub, f"{prefix}/{sub.GetName()}")

    walk(project().GetMediaPool().GetRootFolder(), "Master")
    return out


@mcp.tool()
def import_media(paths: list[str]) -> list[str]:
    """Importe des fichiers (chemins absolus sur cette machine) dans le media pool."""
    items = project().GetMediaPool().ImportMedia(paths) or []
    return [i.GetName() for i in items]


# --- Timelines -----------------------------------------------------------------


@mcp.tool()
def list_timelines() -> list[str]:
    """Noms des timelines du projet."""
    p = project()
    return [p.GetTimelineByIndex(i + 1).GetName() for i in range(p.GetTimelineCount())]


@mcp.tool()
def set_current_timeline(name: str) -> bool:
    """Rend active la timeline portant ce nom."""
    p = project()
    for i in range(p.GetTimelineCount()):
        t = p.GetTimelineByIndex(i + 1)
        if t.GetName() == name:
            return bool(p.SetCurrentTimeline(t))
    raise RuntimeError(f"Timeline introuvable : {name}")


@mcp.tool()
def get_timeline_items(track_type: str = "video") -> list[dict[str, Any]]:
    """Clips de la timeline active (track_type : video, audio ou subtitle)."""
    t = timeline()
    out = []
    for track in range(1, t.GetTrackCount(track_type) + 1):
        for it in t.GetItemListInTrack(track_type, track) or []:
            out.append(
                {
                    "track": track,
                    "name": it.GetName(),
                    "start": it.GetStart(),
                    "end": it.GetEnd(),
                    "duration": it.GetDuration(),
                }
            )
    return out


@mcp.tool()
def build_timeline_from_segments(
    media: str, segments: list[list[float]], timeline_name: str
) -> dict[str, Any]:
    """Crée une timeline en enchaînant des extraits d'un même média.

    media : nom du clip dans le media pool ou chemin du fichier (importé si besoin).
    segments : [[in, out], ...] en secondes dans la source.
    """
    clip = _import_or_find(media)
    fps = _fps(clip)
    mp = project().GetMediaPool()
    t = mp.CreateEmptyTimeline(timeline_name)
    if t is None:
        raise RuntimeError(f"Impossible de créer la timeline « {timeline_name} » (nom déjà pris ?)")
    project().SetCurrentTimeline(t)
    infos = [
        {
            "mediaPoolItem": clip,
            "startFrame": round(a * fps),
            "endFrame": max(round(a * fps), round(b * fps) - 1),
        }
        for a, b in segments
    ]
    added = mp.AppendToTimeline(infos) or []
    return {"timeline": t.GetName(), "clips_added": len(added), "source_fps": fps}


@mcp.tool()
def import_paradox_edit(timeline_name: str = "Paradox - montage") -> dict[str, Any]:
    """Reproduit dans Resolve le montage du reel Paradox (CLIPS de src/data/edit.ts
    appliqués à public/footage/take1.mp4), pour finir l'étalonnage ou le mixage."""
    src = (REPO_ROOT / "src/data/edit.ts").read_text(encoding="utf-8")
    block = re.search(r"CLIPS:\s*Clip\[\]\s*=\s*\[(.*?)\];", src, re.S)
    if not block:
        raise RuntimeError("CLIPS introuvable dans src/data/edit.ts")
    segments = [
        [float(a), float(b)]
        for a, b in re.findall(
            r"srcIn:\s*([\d.]+)\s*,\s*srcOut:\s*([\d.]+)", block.group(1)
        )
    ]
    footage = str(REPO_ROOT / "public/footage/take1.mp4")
    result = build_timeline_from_segments(footage, segments, timeline_name)
    result["segments"] = segments
    return result


@mcp.tool()
def import_rendered_reel(path: str = "") -> list[str]:
    """Importe le rendu Remotion (out/reel.mp4 par défaut) dans le media pool."""
    target = path or str(REPO_ROOT / "out/reel.mp4")
    if not os.path.exists(target):
        raise RuntimeError(f"{target} n'existe pas — lancez d'abord `npm run build`.")
    return import_media([target])


@mcp.tool()
def add_marker(
    seconds: float, color: str = "Blue", name: str = "", note: str = "", duration_frames: int = 1
) -> bool:
    """Pose un marqueur sur la timeline active, à `seconds` depuis son début."""
    t = timeline()
    fps = float(project().GetSetting("timelineFrameRate") or 30)
    return bool(t.AddMarker(round(seconds * fps), color, name, note, duration_frames))


@mcp.tool()
def get_markers() -> dict[str, Any]:
    """Marqueurs de la timeline active (clé = image depuis le début)."""
    return {str(k): v for k, v in (timeline().GetMarkers() or {}).items()}


# --- Rendu --------------------------------------------------------------------


@mcp.tool()
def list_render_presets() -> list[str]:
    """Préréglages de rendu disponibles (page Deliver)."""
    return list(project().GetRenderPresetList() or [])


@mcp.tool()
def render(target_dir: str, file_name: str, preset: str = "", start: bool = True) -> dict[str, Any]:
    """Ajoute la timeline active à la file de rendu et lance le rendu.

    preset : nom d'un préréglage (list_render_presets) ; vide = réglages actuels.
    """
    p = project()
    if preset and not p.LoadRenderPreset(preset):
        raise RuntimeError(f"Préréglage introuvable : {preset}")
    p.SetRenderSettings({"TargetDir": target_dir, "CustomName": file_name})
    job = p.AddRenderJob()
    if not job:
        raise RuntimeError("Resolve a refusé d'ajouter le job de rendu.")
    if start:
        p.StartRendering([job])
    return {"job_id": job, "started": start}


@mcp.tool()
def render_status(job_id: str = "") -> dict[str, Any]:
    """Progression d'un job de rendu (ou état global si job_id est vide)."""
    p = project()
    if job_id:
        return dict(p.GetRenderJobStatus(job_id) or {})
    return {"rendering": bool(p.IsRenderingInProgress()), "jobs": p.GetRenderJobList() or []}


# --- Échappatoire ---------------------------------------------------------------


@mcp.tool()
def run_resolve_script(code: str) -> str:
    """Exécute du Python avec l'API Resolve, pour tout ce que les autres outils ne
    couvrent pas. Variables fournies : resolve, project, media_pool, timeline
    (None si absent). Renvoie ce qui est imprimé, plus `result` s'il est défini."""
    r = resolve()
    p = r.GetProjectManager().GetCurrentProject()
    env: dict[str, Any] = {
        "resolve": r,
        "project": p,
        "media_pool": p.GetMediaPool() if p else None,
        "timeline": p.GetCurrentTimeline() if p else None,
    }
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            exec(code, env)
    except Exception:
        buf.write(traceback.format_exc())
    if "result" in env:
        buf.write(f"\nresult = {env['result']!r}")
    return buf.getvalue() or "(aucune sortie)"


if __name__ == "__main__":
    mcp.run()
