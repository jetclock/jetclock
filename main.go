package main

import (
	"embed"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

var (
	version string = "v0.0.1"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	showVersion := flag.Bool("version", false, "Print version and exit")

	flag.Parse()

	if *showVersion {
		fmt.Println(version)
		os.Exit(0)
	}

	// Initialize basic logging
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Printf("📍 JetClock App started with PID %d - version %s", os.Getpid(), version)

	app := NewApp()

	options.NewRGB(0, 0, 0)
	// Create application with options
	err := wails.Run(&options.App{
		Title:         "jetclock",
		Width:         480,
		Height:        480,
		Frameless:     true,
		DisableResize: true,
		//Fullscreen: true,
		//Debug:      options.Debug{OpenInspectorOnStartup: true},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: options.NewRGB(0, 0, 0),
		OnDomReady:       app.domReady,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
