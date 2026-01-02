package main

import (
	"embed"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/jetclock/jetclock-sdk/pkg/config"
	"github.com/jetclock/jetclock-sdk/pkg/logger"
	"github.com/jetclock/jetclock-sdk/pkg/utils"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

var (
	version string = "v0.0.17"
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
	appConfig, err := config.LoadConfig(filepath.Join("/home", "jetclock", ".config", "jetclock", "config.yaml"))
	if err != nil {
		log.Fatalf("Failed to init config: %v", err)
	}
	if err := logger.InitLogger("[jetclock]", appConfig.LogLevel, filepath.Join("/home", "jetclock"), ""); err != nil {
		fmt.Printf("Failed to init logger: %v. Using relative directory", err)
		dir, _ := os.UserHomeDir()
		if err := logger.InitLogger("[jetclock]", appConfig.LogLevel, dir, ""); err != nil {
			log.Fatalf("Failed to init logger: %v", err)
		}
	}
	logger.Log.Infof("📍 JetClock App started with PID %d - version ", os.Getpid(), version)

	p := utils.PidPath("jetclock")
	if err := utils.WritePID(p); err != nil {
		logger.Log.Warn("failed to write pidfile", "err", err)
	}
	app := NewApp()

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
