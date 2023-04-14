#!/bin/bash
# clear
node PATH/TO/simple-aws-switcher/index.js

selected_profile="$(cat PATH/TO/simple-aws-switcher/.config/selected_profile)"

unset AWS_PROFILE
export AWS_PROFILE="$selected_profile"