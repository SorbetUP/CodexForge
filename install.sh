#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_HOME="${HOME}/.codex-stack"; FORGE_HOME="${HOME}/.codex-forge"; FORGE_APP="${FORGE_HOME}/app"; BIN_DIR="${HOME}/.local/bin"; CODEX_DIR="${HOME}/.codex"; USER_SKILLS_DIR="${HOME}/.agents/skills"; VENV_DIR="${STACK_HOME}/venv"; HEADROOM_PYTHON="${VENV_DIR}/bin/python"; HEADROOM_BIN="${VENV_DIR}/bin/headroom"
mkdir -p "${STACK_HOME}" "${BIN_DIR}" "${CODEX_DIR}" "${STACK_HOME}/logs" "${FORGE_HOME}" "${USER_SKILLS_DIR}"; chmod 700 "${FORGE_HOME}" 2>/dev/null || true
log(){ printf '%s\n' "$*"; }
ensure_path_hint(){ case ":${PATH}:" in *":${BIN_DIR}:"*) ;; *) log ""; log "Ajoute ${BIN_DIR} a ton PATH si besoin :"; log "  echo 'export PATH=\"${BIN_DIR}:\$PATH\"' >> ~/.zshrc";; esac; }
install_opencodex(){
  if command -v ocx >/dev/null 2>&1; then log "OpenCodex deja installe."; return; fi
  command -v node >/dev/null 2>&1 || { log "Erreur: Node.js 18+ est requis pour OpenCodex."; exit 1; }
  command -v npm >/dev/null 2>&1 || { log "Erreur: npm est requis pour OpenCodex."; exit 1; }
  local major; major="$(node -p 'Number(process.versions.node.split(".")[0])')"; (( major >= 18 )) || { log "Erreur: Node.js 18+ est requis (trouve $(node --version))."; exit 1; }
  log "Installation d'OpenCodex..."; npm install -g @bitkyc08/opencodex
}
install_headroom(){ command -v python3 >/dev/null 2>&1 || { log "Erreur: python3 est requis."; exit 1; }; if [[ ! -x "${HEADROOM_PYTHON}" ]]; then log "Creation du venv Headroom..."; python3 -m venv "${VENV_DIR}"; fi; log "Installation ou mise a jour de Headroom (fallback legacy)..."; "${HEADROOM_PYTHON}" -m pip install --upgrade pip >/dev/null; "${HEADROOM_PYTHON}" -m pip install --upgrade 'headroom-ai[proxy]' >/dev/null; }
install_rtk(){ if command -v rtk >/dev/null 2>&1; then log "RTK deja installe."; return; fi; log "Installation de RTK..."; if command -v brew >/dev/null 2>&1; then brew install rtk; else curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh; fi; }
install_forge_runtime(){ rm -rf "${FORGE_APP}"; mkdir -p "${FORGE_APP}"; cp -R "${ROOT_DIR}/bin" "${ROOT_DIR}/optimizer" "${ROOT_DIR}/scripts" "${ROOT_DIR}/tests" "${FORGE_APP}/"; chmod +x "${FORGE_APP}/bin/codex-forge" "${FORGE_APP}/optimizer/server.mjs" "${FORGE_APP}/scripts/test-all.sh" "${FORGE_APP}/tests/e2e/"*.sh; ln -sfn "${FORGE_APP}/bin/codex-forge" "${BIN_DIR}/codex-forge"; }
install_skills(){ local skill src dst; for src in "${ROOT_DIR}/.agents/skills/"*; do [[ -d "${src}" ]] || continue; skill="$(basename "${src}")"; dst="${USER_SKILLS_DIR}/${skill}"; rm -rf "${dst}"; cp -R "${src}" "${dst}"; done; }
write_launcher(){
  sed -e "s|__HEADROOM_BIN__|${HEADROOM_BIN}|g" "${ROOT_DIR}/templates/codex-stack.sh" > "${BIN_DIR}/codex-stack"; chmod +x "${BIN_DIR}/codex-stack"
  sed -e "s|__STACK_HOME__|${STACK_HOME}|g" -e "s|__HEADROOM_BIN__|${HEADROOM_BIN}|g" -e "s|__CODEX_DIR__|${CODEX_DIR}|g" "${ROOT_DIR}/templates/codex-stack-doctor.sh" > "${BIN_DIR}/codex-stack-doctor"; chmod +x "${BIN_DIR}/codex-stack-doctor"
  sed -e "s|__STACK_HOME__|${STACK_HOME}|g" -e "s|__HEADROOM_BIN__|${HEADROOM_BIN}|g" "${ROOT_DIR}/templates/codexforge-gui-enable.sh" > "${BIN_DIR}/codexforge-gui-enable"; chmod +x "${BIN_DIR}/codexforge-gui-enable"
  sed -e "s|__STACK_HOME__|${STACK_HOME}|g" "${ROOT_DIR}/templates/codexforge-gui-disable.sh" > "${BIN_DIR}/codexforge-gui-disable"; chmod +x "${BIN_DIR}/codexforge-gui-disable"
  sed -e "s|__STACK_HOME__|${STACK_HOME}|g" "${ROOT_DIR}/templates/codexforge-gui-doctor.sh" > "${BIN_DIR}/codexforge-gui-doctor"; chmod +x "${BIN_DIR}/codexforge-gui-doctor"
  cp "${ROOT_DIR}/templates/codexforge-gui-restart.sh" "${BIN_DIR}/codexforge-gui-restart"; chmod +x "${BIN_DIR}/codexforge-gui-restart"
}
ensure_marker_block(){ local target_file="$1" marker="$2" content="$3"; mkdir -p "$(dirname "${target_file}")"; touch "${target_file}"; grep -q "${marker}" "${target_file}" 2>/dev/null && return; { printf '\n%s\n' "${marker}"; printf '%s\n' "${content}"; printf '%s\n' "${marker}"; } >> "${target_file}"; }
write_codex_docs(){ cp "${ROOT_DIR}/templates/CODEX_STACK.md" "${CODEX_DIR}/CODEX_STACK.md"; ensure_marker_block "${CODEX_DIR}/AGENTS.md" "<!-- CODEX_PORTABLE_STACK -->" "@CODEX_STACK.md"; }
configure_rtk_for_codex(){ command -v rtk >/dev/null 2>&1 || { log "RTK introuvable apres installation."; exit 1; }; log "Configuration RTK pour Codex..."; rtk init -g --codex >/dev/null; }
main(){ install_opencodex; install_headroom; install_rtk; install_forge_runtime; install_skills; write_launcher; configure_rtk_for_codex; write_codex_docs; ensure_path_hint; log ""; log "Installation terminee."; log "1. OpenCodex: ocx start puis ocx init (auth/config interactifs, jamais forces par l'installateur)"; log "2. Lancement: codex-stack"; log "3. Verification: codex-stack-doctor"; log "4. Optimiseur optionnel: codex-forge optimizer start puis codex-forge optimizer enable"; log "5. Tests: codex-forge test"; log "Memoire projet: ${ROOT_DIR}/init-project-memory.sh /chemin/projet"; }
main "$@"
