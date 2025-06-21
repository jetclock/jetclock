package main

import (
	"embed"
	"flag"
	"fmt"
	"github.com/jetclock/jetclock-sdk/pkg/hotspot"
	"github.com/jetclock/jetclock-sdk/pkg/logger"
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
	mode := flag.String("mode", "auto", "Mode to run: auto, connect or hotspot")
	//interactive := flag.Bool("interactive", false, "Interactively choose network to forget (for 'forget' mode only)")
	//ssidToForget := flag.String("ssid", "", "SSID of the network to forget (for 'forget' mode only)")
	flag.Parse()

	if *showVersion {
		fmt.Println(version)
		os.Exit(0)
	}
	if err := logger.InitLogger(logger.LogToFile | logger.LogToStdout); err != nil {
		log.Fatalf("Failed to init logger: %v", err)
	}
	logger.Log.Info("Starting jetclock", "version", version)

	config := hotspot.DefaultConfig
	if os.Getenv("JETCLOCK_PORT") != "" {
		config.Port = os.Getenv("JETCLOCK_PORT")
	} else {
		config.Port = "80" //hardcode this version to 80 for the pi
	}

	ssid := os.Getenv("HOTSPOT_SSID")
	if ssid == "" {
		ssid = hotspot.DefaultConfig.SSID
		config.SSID = ssid
	}

	app := NewApp()
	wifi := NewWifi(*mode, config)
	//configure the running web server to host the config page
	webserver, err := hotspot.NewServer(config)
	if err != nil {
		log.Fatalf("failed to create server: %v", err)
	}
	webserver.Start()
	options.NewRGB(0, 0, 0)
	// Create application with options
	err = wails.Run(&options.App{
		Title:         "jetclock",
		Width:         480,
		Height:        480,
		Frameless:     true,
		DisableResize: true,
		//Fullscreen: true,
		//Debug:      options.Debug{OpenInspectorOnStartup: true},
		AssetServer: &assetserver.Options{
			Assets:  assets,
			Handler: NewAssetLoader(),
		},
		BackgroundColour: options.NewRGB(0, 0, 0),
		OnDomReady:       app.domReady,
		OnStartup:        wifi.onStartup,
		Bind: []interface{}{
			app,
			wifi,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
