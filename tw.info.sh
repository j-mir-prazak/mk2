#!/bin/bash
CURDIR=$(dirname $0)
cd "$CURDIR"
teamviewer info >./tw.info
sudo mv ./tw.info /boot/tw.info
