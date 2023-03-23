#!/bin/usr/env bash
# clear
node /caylent/simple-aws-switcher/index.js

selected_profile="$(cat /caylent/simple-aws-switcher/.config/selected_profile)"

unset AWS_PROFILE
export AWS_PROFILE="$selected_profile"