#!/bin/bash
CURDIR=$(dirname $0)
cd "$CURDIR"
echo $(date) >./tw.info
teamviewer info >>./tw.info
sudo mv ./tw.info /boot/tw.info
