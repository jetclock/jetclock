package main

import (
	"context"
	"fmt"
	"github.com/jetclock/jetclock-sdk/pkg/hotspot"
	"github.com/jetclock/jetclock-sdk/pkg/logger"
	"github.com/jetclock/jetclock-sdk/pkg/wifi"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"log"
	"time"
)

// will only work on linux machines.
type Wifi struct {
	ctx    context.Context
	mode   string
	config hotspot.HotspotConfig
}

// NewApp creates a new App application struct
func NewWifi(mode string, config hotspot.HotspotConfig) *Wifi {
	newWifi := Wifi{
		mode:   mode,
		config: config,
	}
	go newWifi.watchWiFi(context.Background())
	return &newWifi
}
func (w *Wifi) watchWiFi(ctx context.Context) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	lastMode := wifi.ModeUnknown
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			mode, err := wifi.GetWifiMode()
			if err != nil {
				log.Printf("Wi-Fi watch error: %v", err)
				logger.Log.Errorf("Wi-Fi watch error: %v", err)
			} else if mode != lastMode {
				logger.Log.Infof("Wi-Fi mode changed: %s → %s", lastMode, mode)
				lastMode = mode
				fmt.Printf("Wi-Fi mode changed: %s\n", mode.String())
			}
			logger.Log.Infof("emitting wifi mode: %s", lastMode)
			runtime.EventsEmit(w.ctx, "jetclock:wifi.mode", lastMode)
		}
	}
}

func (w *Wifi) onStartup(ctx context.Context) {
	fmt.Println("Starting wifi. Mode is", w.mode)
	w.ctx = ctx
	switch w.mode {
	case "connect":
		if err := hotspot.StopHotspot(); err != nil {
			logger.Log.Warn("Failed to stop and clean up hotspots", "error", err)
		}
		if err := wifi.Connect(); err != nil {
			log.Fatalf("❌ Failed to connect to WiFi: %v", err)
		}
	case "hotspot":
		err := hotspot.Start(w.config)
		if err != nil {
			logger.Log.Errorf("❌ Failed to start hotspot: %v", err)
			return
		}
	case "auto":
		if wifi.IsConnected() {
			logger.Log.Info("✅ Already connected to a WiFi network. No action needed.")
			return
		}
		if err := hotspot.StopHotspot(); err != nil {
			logger.Log.Warn("Failed to stop and clean up hotspots", "error", err)
		}
		logger.Log.Info("📶 Not connected. Trying to connect to known networks...")
		if err := wifi.Connect(); err != nil {
			logger.Log.Info("⚠️ Connection failed. Starting hotspot...")
			hotspot.Start(w.config)
		} else {
			logger.Log.Info("✅ Connected successfully via NetworkManager.")
		}
	case "list":
		networks, err := wifi.ListKnownNetworks()
		if err != nil {
			log.Fatalf("Failed to list networks: %v", err)
		}
		if len(networks) == 0 {
			log.Println("No known networks.")
			return
		}
		for i, name := range networks {
			fmt.Printf("[%d] %s\n", i+1, name)
		}
	case "forget":
		fmt.Println("not yet implemented")
	default:
		logger.Log.Warnf("Mode %s not implmented", w.mode)
	}
}
