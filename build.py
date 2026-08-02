"""
Concatenate all source modules into one self-contained JSX file.
Strips ES module import/export statements and wraps in a single React component tree.
"""
import re, os

ORDER = [
    "src/constants/tokens.js",
    "src/constants/domain.js",
    "src/constants/seed.js",
    "src/utils/index.js",
    "src/services/aiService.js",
    "src/hooks/useAIChat.js",
    "src/hooks/useFilter.js",
    "src/store/useAppStore.js",
    "src/components/ui/index.js",
    "src/components/layout/Sidebar.js",
    "src/components/layout/Topbar.js",
    "src/components/features/ai/AIPanel.js",
    "src/components/features/clients/ClientForm.js",
    "src/components/features/clients/ClientCard.js",
    "src/components/features/clients/ClientDetail.js",
    "src/pages/DashboardPage.js",
    "src/pages/ClientsPage.js",
    "src/pages/InvoicesPage.js",
    "src/pages/TasksPage.js",
    "src/pages/PipelinePage.js",
    "src/pages/LaunchGuidePage.js",
    "src/App.js",
]

base = "/home/claude/clientpulse"

header = '''import { useState, useEffect, useRef, useCallback, useReducer, useMemo } from "react";

'''

parts = [header]

for path in ORDER:
    full = os.path.join(base, path)
    with open(full) as f:
        src = f.read()

    # Remove import lines
    src = re.sub(r'^import\s+.*?;\s*$', '', src, flags=re.MULTILINE)
    # Remove export keywords from declarations (export const, export function, export class, export default function/class)
    src = re.sub(r'^export default function\b', 'function', src, flags=re.MULTILINE)
    src = re.sub(r'^export default class\b', 'class', src, flags=re.MULTILINE)
    src = re.sub(r'^export default\b', '', src, flags=re.MULTILINE)
    src = re.sub(r'^export function\b', 'function', src, flags=re.MULTILINE)
    src = re.sub(r'^export class\b', 'class', src, flags=re.MULTILINE)
    src = re.sub(r'^export const\b', 'const', src, flags=re.MULTILINE)
    src = re.sub(r'^export \{[^}]*\};\s*$', '', src, flags=re.MULTILINE)
    # Remove leading/trailing blank lines per file
    src = src.strip()

    parts.append(f"\n// {'─'*60}\n// {path}\n// {'─'*60}\n\n{src}\n")

# Final default export
parts.append("""
// ─── Entry point ─────────────────────────────────────────────
export default function ClientPulse() {
  return <App />;
}
""")

out = "".join(parts)

with open(os.path.join(base, "clientpulse_pro.jsx"), "w") as f:
    f.write(out)

print(f"Written: {len(out.splitlines())} lines, {len(out):,} bytes")
