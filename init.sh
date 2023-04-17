#!/bin/bash
# clear
node /home/kdje-prophero/kenevarle/simple-aws-switcher/index.js

selected_profile="$(cat /home/kdje-prophero/kenevarle/simple-aws-switcher/.config/selected_profile)"

unset AWS_PROFILE
export AWS_PROFILE="$selected_profile"