package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"syscall"
	"time"

	"github.com/jetclock/jetclock-sdk/pkg/iframe"
	"github.com/jetclock/jetclock-sdk/pkg/logger"
	"github.com/jetclock/jetclock-sdk/pkg/utils"
)

// App struct
type App struct {
	ctx           context.Context
	home          string
	SystemID      string
	iframeHandler *iframe.Handler
}

// NewApp creates a new App application struct
func NewApp() *App {
	dir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("no home directory", err)
	}
	a := App{
		home: dir,
	}
	piSerial, err := utils.GetPiSerial()
	if err == nil {
		a.SystemID = piSerial
	} else {
		a.SystemID = "123"
	}
	
	// Initialize iframe handler
	a.iframeHandler = iframe.NewHandler(&a, "https://app.jetclock.io")
	
	return &a
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	logger.Log.Infof("[%s] App startup called\n", time.Now().Format("2006-01-02 15:04:05"))
}

// domReady is called when the DOM is ready
func (a *App) domReady(ctx context.Context) {
	a.ctx = ctx

	// Run immediately when DOM is ready
	p := utils.PidPath("jetclock-updater")
	pid, err := utils.ReadPID(p)
	if err == nil {
		logger.Log.Infof("signalling to: %d app is ready", pid)

		logger.Log.Infof("[%s] Signalling to PID: %d\n", time.Now().Format("2006-01-02 15:04:05"), pid)

		_ = syscall.Kill(pid, syscall.SIGUSR1) // notify updater
	} else {
		logger.Log.Infof("[%s] No updater PID file found: %v\n", time.Now().Format("2006-01-02 15:04:05"), err)
	}

	logger.Log.Infof("[%s] DOM ready complete, splash screen should close\n", time.Now().Format("2006-01-02 15:04:05"))

}

func (a *App) GetSystemID() string {
	return a.SystemID
}

func (a *App) GetVersion() string {
	return version
}

// GetBrightness returns the current screen brightness (0-100)
// Note: This is a simplified implementation that returns 0 or 100
// TODO: Implement actual PWM reading if needed
func (a *App) GetBrightness() (int, error) {
	displayOn, err := utils.CheckDisplay()
	if err != nil {
		return 0, err
	}
	
	// For now, return 0 or 100 based on display state
	// In future, could read actual PWM value from GPIO
	if displayOn == 1 {
		return 100, nil
	}
	return 0, nil
}

// SetBrightness sets the screen brightness (0-100)
func (a *App) SetBrightness(brightness int) error {
	// Clamp to 0-100
	if brightness < 0 {
		brightness = 0
	}
	if brightness > 100 {
		brightness = 100
	}
	
	// Convert percentage to duty cycle (0-1000000)
	dutyCycle := (brightness * 1000000) / 100
	
	// Use GPIO 19 at 100Hz for backlight control
	cmd := fmt.Sprintf("pigs hp 19 100 %d", dutyCycle)
	if err := utils.ExecuteCommand(cmd); err != nil {
		// Fallback to old on/off method if PWM fails
		if brightness == 0 {
			utils.TurnOffDisplay()
		} else {
			utils.TurnOnDisplay()
		}
		logger.Log.Warnf("PWM control failed, using fallback: %v", err)
	}
	
	logger.Log.Infof("Set brightness to %d%%", brightness)
	return nil
}

// Reboot reboots the system
func (a *App) Reboot() error {
	logger.Log.Infof("Rebooting system...")
	utils.Reboot()
	return nil
}

// HandleIframeMessage processes messages from the iframe using the SDK handler
func (a *App) HandleIframeMessage(origin, method string, args []interface{}) interface{} {
	logger.Log.Infof("HandleIframeMessage called: origin=%s, method=%s, args=%v", origin, method, args)
	
	messageData := iframe.MessageData{
		Method: method,
		Args:   args,
	}
	
	response := a.iframeHandler.HandleMessage(origin, messageData)
	logger.Log.Infof("HandleIframeMessage response: %+v", response)
	
	return response
}


