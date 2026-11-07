#!/usr/bin/env bash

# Installed by the Git plugin (plugins.sh --install git); __WORKSPACE__ is the workspace it was installed into.
#
# Turn off core.filemode in every git repository of this workspace, so a chmod made by a container does
# not show as a change in every file.

# Bootstrap.
# Find the workspace tooling from this script, so a fresh clone needs no setup.
WORKSPACE_SCRIPTS="${WORKSPACE_SCRIPTS:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../core/scripts" && pwd)}";
source ${WORKSPACE_SCRIPTS}/bootstrap.sh || exit 1 ;

# Load workspace settings.
eval $(parse_yaml ${WORKSPACE_CONFIG}/workspace.__WORKSPACE__.settings.yml);

cd "${WORKSPACE_ROOT}/${doc_name}" || exit 1 ;
for dir_name in *; do
    if [[ -d "$dir_name" && ! -L "$dir_name" ]]; then
        if [ -f "${WORKSPACE_ROOT}/${doc_name}/${dir_name}/.git/config" ]; then
          sed -i -e 's/filemode = true/filemode = false/g' "${WORKSPACE_ROOT}/${doc_name}/${dir_name}/.git/config" ;
          echo "  ${dir_name}: filemode = false" ;
        fi
    fi
done
