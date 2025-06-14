# README

## About

This is the official Wails Vanilla template.

You can configure the project by editing `wails.json`. More information about the project settings can be found
here: https://wails.io/docs/reference/project-config

## Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.


notes:


- `export GOPRIVATE=github.com/jetclock/jetclock-sdk`

```sh
pkill -9 jetclock
DISPLAY=:0 nohup ~/.jetclock/jetclock --mode=hotspot>/dev/null 2>&1 &
```

or with logs

```sh
mkdir -p ~/.jetclock/logs
DISPLAY=:0 nohup ~/.jetclock/jetclock --mode=auto > ~/.jetclock/logs/hotspot.log 2>&1 &
```

```sh
journalctl -u hostapd --no-pager -n 50
journalctl -u NetworkManager --no-pager -n 50
journalctl -u NetworkManager --no-pager -n 100

```
