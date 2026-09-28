#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_HOME="${HOME}/.codex-stack"
BIN_DIR="${HOME}/.local/bin"
CODEX_DIR="${HOME}/.codex"
SKILLS_DIR="${CODEX_DIR}/skills"
AGENTS_DIR="${CODEX_DIR}/agents"
VENV_DIR="${STACK_HOME}/venv"
NOTEBOOK_VENV="${STACK_HOME}/notebook-venv"
HEADROOM_PYTHON="${VENV_DIR}/bin/python"
HEADROOM_BIN="${VENV_DIR}/bin/headroom"

mkdir -p "${STACK_HOME}" "${BIN_DIR}" "${CODEX_DIR}" "${STACK_HOME}/logs"

log() {
  printf '%s\n' "$*"
}

ensure_path_hint() {
  case ":${PATH}:" in
    *":${BIN_DIR}:"*) ;;
    *)
      log ""
      log "Ajoute ${BIN_DIR} a ton PATH si besoin :"
      log "  echo 'export PATH=\"${BIN_DIR}:\$PATH\"' >> ~/.zshrc"
      ;;
  esac
}

install_headroom() {
  if ! command -v python3 >/dev/null 2>&1; then
    log "Erreur: python3 est requis."
    exit 1
  fi

  if [[ ! -x "${HEADROOM_PYTHON}" ]]; then
    log "Creation du venv Headroom..."
    python3 -m venv "${VENV_DIR}"
  fi

  log "Installation ou mise a jour de Headroom..."
  "${HEADROOM_PYTHON}" -m pip install --upgrade pip >/dev/null
  "${HEADROOM_PYTHON}" -m pip install --upgrade 'headroom-ai[proxy]' >/dev/null
}

install_notebook_cli() {
  if [[ ! -x "${NOTEBOOK_VENV}/bin/python" ]]; then
    log "Creation du venv codex-notebook-cli..."
    python3 -m venv "${NOTEBOOK_VENV}"
  fi

  log "Installation ou mise a jour de codex-notebook-cli..."
  "${NOTEBOOK_VENV}/bin/python" -m pip install --upgrade pip >/dev/null
  "${NOTEBOOK_VENV}/bin/python" -m pip install --upgrade "${ROOT_DIR}/vendor/codex-notebook-cli-0.3.0.tar.gz" >/dev/null
  ln -sf "${NOTEBOOK_VENV}/bin/cnb" "${BIN_DIR}/cnb"
}

install_rtk() {
  if command -v rtk >/dev/null 2>&1; then
    log "RTK deja installe."
    return
  fi

  log "Installation de RTK..."
  if command -v brew >/dev/null 2>&1; then
    brew install rtk
  else
    curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
  fi
}

write_launcher() {
  sed \
    -e "s|__HEADROOM_BIN__|${HEADROOM_BIN}|g" \
    -e "s|__ROOT_DIR__|${ROOT_DIR}|g" \
    "${ROOT_DIR}/templates/codex-stack.sh" > "${BIN_DIR}/codex-stack"
  chmod +x "${BIN_DIR}/codex-stack"

  sed \
    -e "s|__STACK_HOME__|${STACK_HOME}|g" \
    -e "s|__HEADROOM_BIN__|${HEADROOM_BIN}|g" \
    -e "s|__CODEX_DIR__|${CODEX_DIR}|g" \
    "${ROOT_DIR}/templates/codex-stack-doctor.sh" > "${BIN_DIR}/codex-stack-doctor"
  chmod +x "${BIN_DIR}/codex-stack-doctor"

  sed \
    -e "s|__STACK_HOME__|${STACK_HOME}|g" \
    -e "s|__HEADROOM_BIN__|${HEADROOM_BIN}|g" \
    "${ROOT_DIR}/templates/codexforge-gui-enable.sh" > "${BIN_DIR}/codexforge-gui-enable"
  chmod +x "${BIN_DIR}/codexforge-gui-enable"

  sed \
    -e "s|__STACK_HOME__|${STACK_HOME}|g" \
    "${ROOT_DIR}/templates/codexforge-gui-disable.sh" > "${BIN_DIR}/codexforge-gui-disable"
  chmod +x "${BIN_DIR}/codexforge-gui-disable"

  sed \
    -e "s|__STACK_HOME__|${STACK_HOME}|g" \
    "${ROOT_DIR}/templates/codexforge-gui-doctor.sh" > "${BIN_DIR}/codexforge-gui-doctor"
  chmod +x "${BIN_DIR}/codexforge-gui-doctor"

  cp "${ROOT_DIR}/templates/codexforge-gui-restart.sh" "${BIN_DIR}/codexforge-gui-restart"
  chmod +x "${BIN_DIR}/codexforge-gui-restart"
}

ensure_marker_block() {
  local target_file="$1"
  local marker="$2"
  local content="$3"

  mkdir -p "$(dirname "${target_file}")"
  touch "${target_file}"

  if grep -q "${marker}" "${target_file}" 2>/dev/null; then
    return
  fi

  {
    printf '\n%s\n' "${marker}"
    printf '%s\n' "${content}"
    printf '%s\n' "${marker}"
  } >> "${target_file}"
}

write_codex_docs() {
  cp "${ROOT_DIR}/templates/CODEX_STACK.md" "${CODEX_DIR}/CODEX_STACK.md"

  ensure_marker_block \
    "${CODEX_DIR}/AGENTS.md" \
    "<!-- CODEX_PORTABLE_STACK -->" \
    "@CODEX_STACK.md"
}

install_codex_workflows() {
  mkdir -p "${SKILLS_DIR}" "${AGENTS_DIR}"

  local skill
  for skill in forge-reviewed-change forge-project-build forge-notebook-operator; do
    rm -rf "${SKILLS_DIR}/${skill}"
    cp -R "${ROOT_DIR}/templates/skills/${skill}" "${SKILLS_DIR}/${skill}"
  done

  local agent
  for agent in forge-reviewer-medium.toml forge-adversary-medium.toml forge-architect-high.toml; do
    cp "${ROOT_DIR}/templates/agents/${agent}" "${AGENTS_DIR}/${agent}"
  done
}

configure_rtk_for_codex() {
  if ! command -v rtk >/dev/null 2>&1; then
    log "RTK introuvable apres installation."
    exit 1
  fi

  log "Configuration RTK pour Codex..."
  rtk init -g --codex >/dev/null
}

main() {
  install_headroom
  install_notebook_cli
  install_rtk
  write_launcher
  configure_rtk_for_codex
  write_codex_docs
  install_codex_workflows
  ensure_path_hint

  log ""
  log "Installation terminee."
  log "Commande de lancement : codex-stack"
  log "Verification : codex-stack-doctor"
  log "Memoire projet : ${ROOT_DIR}/init-project-memory.sh /chemin/projet"
  log 'Skill tache revue : $forge-reviewed-change'
  log 'Skill gros projet : $forge-project-build'
  log 'Skill notebook persistant : $forge-notebook-operator'
  log 'Notebook CLI : cnb'
}

main "$@"
