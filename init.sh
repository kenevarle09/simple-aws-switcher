#!/bin/bash
# clear

DIR="$(realpath `dirname $0`)"
node ${DIR}/index.js

selected_profile="$(cat ${DIR}/.config/selected_profile)"

unset AWS_PROFILE
export AWS_PROFILE="$selected_profile"