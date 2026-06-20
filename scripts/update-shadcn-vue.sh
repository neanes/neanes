#!/usr/bin/env bash

set -euo pipefail

usage() {
	cat <<-'USAGE'
		Usage: scripts/update-shadcn-vue.sh [-hn] [--] [component...]

		Updates shadcn-vue UI components with:
		  npx shadcn-vue@latest add --overwrite

		Refreshes shadcn-vue base CSS first with:
		  npx shadcn-vue@latest init --force --no-reinstall --preset <hard-coded init URL>

		After a successful update, runs:
		  npm run lint:fix

		Before reinstalling components, removes each target directory from:
		  src/components/ui

		Options:
		  -h  Show this help message.
		  -n  Pass --dry-run to shadcn-vue and skip npm run lint:fix.

		With no components, updates the component list encoded in this script.

		Examples:
		  scripts/update-shadcn-vue.sh
		  scripts/update-shadcn-vue.sh button dialog tooltip
		  scripts/update-shadcn-vue.sh -n
		  scripts/update-shadcn-vue.sh -n button dialog
	USAGE
}

die() {
	echo "error: $*" >&2
	exit 1
}

remove_components() {
	local ui_dir=$1
	local component

	[[ -d $ui_dir ]] || die "UI component directory was not found at $ui_dir"
	shift

	for component in "$@"; do
		[[ $component =~ ^[a-z0-9][a-z0-9-]*$ ]] || die "invalid component name: $component"
		rm -rf -- "$ui_dir/$component" || die "failed to remove $ui_dir/$component"
	done
}

main() {
	local script_dir
	local repo_root
	local ui_dir
	local args=()
	local components=(
		accordion
		alert
		alert-dialog
		aspect-ratio
		avatar
		badge
		breadcrumb
		button
		button-group
		card
		checkbox
		collapsible
		combobox
		command
		context-menu
		dialog
		dropdown-menu
		empty
		field
		hover-card
		input
		input-group
		item
		kbd
		label
		menubar
		native-select
		navigation-menu
		number-field
		pagination
		popover
		progress
		radio-group
		resizable
		scroll-area
		select
		separator
		sheet
		sidebar
		skeleton
		slider
		sonner
		spinner
		stepper
		switch
		table
		tabs
		tags-input
		textarea
		toggle
		toggle-group
		tooltip
	)
	local shadcn_args=()
	local init_url
	local dry_run=false
	local opt
	local OPTIND=1

	while getopts ":hn" opt; do
		case "$opt" in
		h)
			usage
			exit 0
			;;
		n)
			dry_run=true
			;;
		*)
			usage >&2
			die "unknown option: -$OPTARG"
			;;
		esac
	done
	shift $((OPTIND - 1))

	args=("$@")

	command -v npx >/dev/null 2>&1 || die "npx is required to update shadcn-vue components"

	script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)" || die "failed to resolve script directory"
	repo_root="$(cd -- "$script_dir/.." && pwd)" || die "failed to resolve repository root"
	ui_dir="$repo_root/src/components/ui"
	init_url="https://shadcn-vue.com/init?base=reka&style=lyra&baseColor=mist&theme=mist&iconLibrary=phosphor&font=inter&rtl=false&menuAccent=subtle&menuColor=default&radius=default"

	[[ -f "$repo_root/components.json" ]] || die "components.json was not found at $repo_root"

	if $dry_run; then
		echo "Skipping shadcn-vue base CSS refresh during dry run."
	else
		echo "Refreshing shadcn-vue base CSS..."
		npx --yes shadcn-vue@latest init --yes --force --no-reinstall --cwd "$repo_root" \
			--preset "$init_url" ||
			die "shadcn-vue base CSS refresh failed"
	fi

	if [[ ${#args[@]} -eq 0 ]]; then
		args=("${components[@]}")
	fi

	[[ ${#args[@]} -gt 0 ]] || die "no shadcn-vue components found to update"

	shadcn_args=("${args[@]}")

	if $dry_run; then
		shadcn_args+=(--dry-run)
	fi

	echo "Running shadcn-vue add with ${#shadcn_args[@]} argument(s):"
	printf '  %s\n' "${shadcn_args[@]}"

	if $dry_run; then
		echo "Skipping component directory removal during dry run."
	else
		echo "Removing ${#args[@]} component directory/directories..."
		remove_components "$ui_dir" "${args[@]}"
	fi

	npx --yes shadcn-vue@latest add --yes --overwrite --cwd "$repo_root" "${shadcn_args[@]}" ||
		die "shadcn-vue update failed"

	if $dry_run; then
		echo "Skipping npm run lint:fix after --dry-run."
		exit 0
	fi

	echo "Running npm run lint:fix..."
	npm --prefix "$repo_root" run lint:fix || die "npm run lint:fix failed"
}

main "$@"
