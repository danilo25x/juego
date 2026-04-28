"""
Custom HTTP server: static files + /save-collisions API
Writes collision boxes AND depth zones back into script.js
"""
import http.server
import json
import re
import os

PORT = 8080
WEB_DIR = os.path.dirname(os.path.abspath(__file__))

class GameServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def end_headers(self):
        # Disable caching for script.js so saves are always reflected immediately
        if self.path.startswith('/script.js'):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_POST(self):
        if self.path == '/save-collisions':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                payload = json.loads(body)
                collisions = payload.get('collisions', {})
                depths = payload.get('depths', {})
                portals = payload.get('portals', [])
                functions = payload.get('functions', [])
                map_name = payload.get('map', 'limbo')
                self._write_to_script(collisions, depths, portals, functions, map_name)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True}).encode())
                print(f">>> Saved {map_name} collisions + depths + portals to script.js!")
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
                print(f">>> ERROR saving: {e}")
                import traceback; traceback.print_exc()
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _format_block(self, var_name, data, extra_key=None):
        lines = [f'let {var_name} = {{']
        layer_keys = sorted(data.keys(), key=lambda k: int(k))
        for i, lk in enumerate(layer_keys):
            rects = data[lk]
            lines.append(f'    {lk}: [')
            for j, r in enumerate(rects):
                comma = ',' if j < len(rects) - 1 else ''
                if extra_key:
                    lines.append(f'        {{ x: {r["x"]}, y: {r["y"]}, w: {r["w"]}, h: {r["h"]}, {extra_key}: {r.get(extra_key, 0)} }}{comma}')
                else:
                    lines.append(f'        {{ x: {r["x"]}, y: {r["y"]}, w: {r["w"]}, h: {r["h"]} }}{comma}')
            comma2 = ',' if i < len(layer_keys) - 1 else ''
            lines.append(f'    ]{comma2}')
        lines.append('};')
        return '\n'.join(lines)

    def _format_portal_entry(self, p):
        """Format a single portal zone entry."""
        tm = p.get('targetMap', 'limbo')
        sx = p.get('spawnX', 500)
        sy = p.get('spawnY', 500)
        txt = p.get('text', '')
        return f"        {{ x: {p['x']}, y: {p['y']}, w: {p['w']}, h: {p['h']}, targetMap: '{tm}', spawnX: {sx}, spawnY: {sy}, text: '{txt}' }}"

    def _format_function_entry(self, f):
        """Format a single function zone entry."""
        fid = f.get('id', 0)
        return f"        {{ x: {f['x']}, y: {f['y']}, w: {f['w']}, h: {f['h']}, id: {fid} }}"

    def _write_to_script(self, collisions, depths, portals, functions, map_name='limbo'):
        script_path = os.path.join(WEB_DIR, 'script.js')
        with open(script_path, 'r', encoding='utf-8') as f:
            content = f.read()

        if map_name == 'limbo':
            coll_var = 'layerCollisions'
            depth_var = 'depthZones'
        else:
            coll_var = 'infernoCollisions'
            depth_var = 'infernoDepthZones'

        # Replace collisions
        new_coll = self._format_block(coll_var, collisions)
        pattern_coll = rf'let {coll_var}\s*=\s*\{{[\s\S]*?\n\}};'
        if re.search(pattern_coll, content):
            content = re.sub(pattern_coll, new_coll, content, count=1)
        else:
            raise Exception(f"Could not find {coll_var} block")

        # Replace depths
        new_depth = self._format_block(depth_var, depths, extra_key='base_y')
        pattern_depth = rf'let {depth_var}\s*=\s*\{{[\s\S]*?\n\}};'
        if re.search(pattern_depth, content):
            content = re.sub(pattern_depth, new_depth, content, count=1)
        else:
            raise Exception(f"Could not find {depth_var} block")

        # Replace portal zones for this map
        # We need to rebuild the entire portalZones block with updated data for current map
        # First, extract the OTHER map's portal data from existing content
        pattern_portals = r'let portalZones\s*=\s*\{[\s\S]*?\n\};'
        match = re.search(pattern_portals, content)
        if match:
            # Build new portalZones block preserving the other map's data
            # Parse existing other map portals from the file
            other_map = 'infierno' if map_name == 'limbo' else 'limbo'
            # Extract the other map's array from the existing block
            other_pattern = rf"'{other_map}':\s*\[" if f"'{other_map}'" in match.group() else rf"{other_map}:\s*\["
            
            # Simpler approach: just rebuild both sides
            # Current map portals come from the payload
            # Other map portals we extract from existing content
            existing_block = match.group()
            
            # Extract other map's entries using a more targeted regex
            other_entries = []
            other_section = re.search(rf"{other_map}:\s*\[([\s\S]*?)\]", existing_block)
            if other_section:
                entry_pattern = r"\{[^}]+\}"
                other_entries_raw = re.findall(entry_pattern, other_section.group(1))
                other_entries = other_entries_raw  # Keep as raw JS strings
            
            # Build new portal block
            lines = ['let portalZones = {']
            
            # Limbo entries
            if map_name == 'limbo':
                current_entries = portals
                other_raw = other_entries
            else:
                current_entries = None
                other_raw = None
            
            # Always write limbo first, then infierno
            lines.append('    limbo: [')
            if map_name == 'limbo':
                for j, p in enumerate(portals):
                    comma = ',' if j < len(portals) - 1 else ''
                    lines.append(self._format_portal_entry(p) + comma)
            else:
                for j, raw in enumerate(other_entries):
                    comma = ',' if j < len(other_entries) - 1 else ''
                    lines.append(f'        {raw}{comma}')
            lines.append('    ],')
            
            lines.append('    infierno: [')
            if map_name == 'infierno':
                for j, p in enumerate(portals):
                    comma = ',' if j < len(portals) - 1 else ''
                    lines.append(self._format_portal_entry(p) + comma)
            else:
                # Extract infierno entries from existing
                inf_section = re.search(r"infierno:\s*\[([\s\S]*?)\]", existing_block)
                if inf_section:
                    inf_raw = re.findall(r"\{[^}]+\}", inf_section.group(1))
                    for j, raw in enumerate(inf_raw):
                        comma = ',' if j < len(inf_raw) - 1 else ''
                        lines.append(f'        {raw}{comma}')
            lines.append('    ]')
            lines.append('};')
            
            new_portals = '\n'.join(lines)
            content = re.sub(pattern_portals, new_portals, content, count=1)
        else:
            print("WARNING: Could not find portalZones block - portals not saved")

        # Replace function zones for this map (same approach as portals)
        pattern_funcs = r'let functionZones\s*=\s*\{[\s\S]*?\n\};'
        match_f = re.search(pattern_funcs, content)
        if match_f:
            existing_fblock = match_f.group()
            lines_f = ['let functionZones = {']

            # Limbo
            lines_f.append('    limbo: [')
            if map_name == 'limbo':
                for j, f in enumerate(functions):
                    comma = ',' if j < len(functions) - 1 else ''
                    lines_f.append(self._format_function_entry(f) + comma)
            else:
                limbo_sec = re.search(r"limbo:\s*\[([\s\S]*?)\]", existing_fblock)
                if limbo_sec:
                    raw_entries = re.findall(r"\{[^}]+\}", limbo_sec.group(1))
                    for j, raw in enumerate(raw_entries):
                        comma = ',' if j < len(raw_entries) - 1 else ''
                        lines_f.append(f'        {raw}{comma}')
            lines_f.append('    ],')

            # Infierno
            lines_f.append('    infierno: [')
            if map_name == 'infierno':
                for j, f in enumerate(functions):
                    comma = ',' if j < len(functions) - 1 else ''
                    lines_f.append(self._format_function_entry(f) + comma)
            else:
                inf_sec = re.search(r"infierno:\s*\[([\s\S]*?)\]", existing_fblock)
                if inf_sec:
                    raw_entries = re.findall(r"\{[^}]+\}", inf_sec.group(1))
                    for j, raw in enumerate(raw_entries):
                        comma = ',' if j < len(raw_entries) - 1 else ''
                        lines_f.append(f'        {raw}{comma}')
            lines_f.append('    ]')
            lines_f.append('};')

            new_funcs = '\n'.join(lines_f)
            content = re.sub(pattern_funcs, new_funcs, content, count=1)
        else:
            print("WARNING: Could not find functionZones block - functions not saved")

        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == '__main__':
    print(f"Game server at http://localhost:{PORT}")
    print("Static files + /save-collisions API ready")
    server = http.server.HTTPServer(('', PORT), GameServer)
    server.serve_forever()
