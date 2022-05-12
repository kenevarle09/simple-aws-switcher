#!/bin/usr/env bash

node index.js

selected_profile="$(cat .config/selected_profile)"

unset AWS_PROFILE
export AWS_PROFILE="$selected_profile"