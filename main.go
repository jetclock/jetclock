package main

import (
	"embed"
	"flag"
	"github.com/jetclock/jetclock-sdk/pkg/hotspot"
	"github.com/jetclock/jetclock-sdk/pkg/logger"
	"github.com/jetclock/jetclock-sdk/pkg/update"
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

	if err := logger.InitLogger(logger.LogToFile | logger.LogToStdout); err != nil {
		log.Fatalf("Failed to init logger: %v", err)
	}
	logger.Log.Info("Starting jetclock", "version", version)

	err := update.AutoUpdate(version)
	if err != nil {
		logger.Log.Errorf("could not run update %w", err)
	}

	mode := flag.String("mode", "auto", "Mode to run: auto, connect or hotspot")
	//interactive := flag.Bool("interactive", false, "Interactively choose network to forget (for 'forget' mode only)")
	//ssidToForget := flag.String("ssid", "", "SSID of the network to forget (for 'forget' mode only)")
	flag.Parse()

	config := hotspot.DefaultConfig

	ssid := os.Getenv("HOTSPOT_SSID")
	if ssid == "" {
		ssid = hotspot.DefaultConfig.SSID
		config.SSID = ssid
	}

	app := NewApp()
	wifi := NewWifi(*mode, config)
	// Create application with options
	err = wails.Run(&options.App{
		Title:      "jetclock",
		Width:      480,
		Height:     480,
		Frameless:  true,
		Fullscreen: true,
		Debug:      options.Debug{OpenInspectorOnStartup: true},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnDomReady:       app.domReady,
		Bind: []interface{}{
			app,
			wifi,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
