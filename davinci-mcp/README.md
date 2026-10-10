# Pont Claude ↔ DaVinci Resolve (MCP)

Petit serveur MCP qui permet à Claude (Claude Desktop / Cowork) de piloter
DaVinci Resolve ouvert sur votre ordinateur : projets, media pool, timelines,
marqueurs, rendu — et import direct du montage Paradox.

## 1. Préparer Resolve

1. Ouvrez DaVinci Resolve.
2. **Préférences → Système → Général → External scripting using : `Local`**,
   puis redémarrez Resolve.

> Les anciennes versions gratuites de Resolve n'acceptent le scripting externe
> que dans la version **Studio**. Si `get_status` répond « Impossible de
> joindre DaVinci Resolve » alors que le réglage est bon, c'est la cause.

## 2. Installer Python et le paquet MCP

Python 3.10 à 3.12, **64 bits** ([python.org](https://www.python.org/downloads/)).

```bash
git clone https://github.com/aymen21551/paradox.git
cd paradox/davinci-mcp
python -m pip install -r requirements.txt
```

## 3. Déclarer le serveur dans Claude

Claude Desktop → **Settings → Developer → Edit Config**, ce qui ouvre
`claude_desktop_config.json`. Ajoutez (en adaptant le chemin) :

**Windows**

```json
{
  "mcpServers": {
    "davinci-resolve": {
      "command": "python",
      "args": ["C:\\Users\\VOUS\\paradox\\davinci-mcp\\server.py"]
    }
  }
}
```

**macOS**

```json
{
  "mcpServers": {
    "davinci-resolve": {
      "command": "python3",
      "args": ["/Users/VOUS/paradox/davinci-mcp/server.py"]
    }
  }
}
```

Quittez complètement Claude puis relancez-le. « davinci-resolve » apparaît dans
la liste des connecteurs (icône outils) et est utilisable dans Cowork.

Si Resolve est installé ailleurs que l'emplacement par défaut, ajoutez au même
bloc :

```json
"env": {
  "RESOLVE_SCRIPT_API": "…/Developer/Scripting",
  "RESOLVE_SCRIPT_LIB": "…/fusionscript.dll ou fusionscript.so"
}
```

## 4. Essayer

Demandez à Claude par exemple :

- « Quel projet est ouvert dans DaVinci ? » → `get_status`
- « Crée un projet Paradox vertical et importe le montage » →
  `create_project` + `import_paradox_edit` (timeline construite à partir des
  coupes de `src/data/edit.ts` sur `public/footage/take1.mp4`)
- « Importe le rendu du reel » → `import_rendered_reel` (`out/reel.mp4`)
- « Mets un marqueur rouge à 12 s : vérifier le son » → `add_marker`
- « Exporte la timeline en H.264 dans mon dossier Vidéos » →
  `list_render_presets` + `render` + `render_status`

`run_resolve_script` exécute du Python arbitraire sur l'API Resolve pour tout
le reste (Claude vous demande l'autorisation avant chaque appel).

## Outils

| Outil | Rôle |
| --- | --- |
| `get_status`, `open_page` | état de Resolve, changer de page |
| `list_projects`, `open_project`, `create_project`, `save_project` | projets |
| `list_media_pool`, `import_media` | media pool |
| `list_timelines`, `set_current_timeline`, `get_timeline_items` | timelines |
| `build_timeline_from_segments` | timeline à partir de coupes [in, out] en secondes |
| `import_paradox_edit`, `import_rendered_reel` | passerelle avec le projet Remotion |
| `add_marker`, `get_markers` | marqueurs |
| `list_render_presets`, `render`, `render_status` | rendu (page Deliver) |
| `run_resolve_script` | échappatoire : script Python libre |
