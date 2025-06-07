package main

import (
	"context"
	"fmt"
	"github.com/jetclock/jetclock-sdk/pkg/hotspot"
	"github.com/jetclock/jetclock-sdk/pkg/logger"
	"github.com/jetclock/jetclock-sdk/pkg/wifi"
	"log"
)

// will only work on linux machines.
type Wifi struct {
	ctx    context.Context
	mode   string
	config hotspot.HotspotConfig
}

// NewApp creates a new App application struct
func NewWifi(mode string, config hotspot.HotspotConfig) *Wifi {
	return &Wifi{
		mode:   mode,
		config: config,
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
		hotspot.Start(w.config)
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
		//if *interactive {
		//	networks, err := wifi.ListKnownNetworks()
		//	if err != nil {
		//		log.Fatalf("Failed to list networks: %v", err)
		//	}
		//	if len(networks) == 0 {
		//		log.Println("No known networks to forget.")
		//		return
		//	}
		//	fmt.Println("Select a network to forget:")
		//	for i, name := range networks {
		//		fmt.Printf("[%d] %s\n", i+1, name)
		//	}
		//	var choice int
		//	fmt.Print("Enter number: ")
		//	_, err = fmt.Scanf("%d", &choice)
		//	if err != nil || choice < 1 || choice > len(networks) {
		//		log.Fatalf("Invalid selection")
		//	}
		//	if err := wifi.ForgetNetwork(networks[choice-1]); err != nil {
		//		log.Fatalf("Failed to forget network: %v", err)
		//	}
		//} else if *ssidToForget != "" {
		//	if err := wifi.ForgetNetwork(*ssidToForget); err != nil {
		//		log.Fatalf("Failed to forget network: %v", err)
		//	}
		//} else {
		//	log.Fatalf("Please provide either --ssid or --interactive")
		//}
	default:
		logger.Log.Warnf("Mode %s not implmented", w.mode)
	}
}
