package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"syscall"
	"time"

	"github.com/jetclock/jetclock-sdk/pkg/logger"
	"github.com/jetclock/jetclock-sdk/pkg/utils"
)

// App struct
type App struct {
	ctx      context.Context
	home     string
	SystemID string
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
	return &a
}

// domReady is called when the DOM is ready
func (a *App) domReady(ctx context.Context) {
	a.ctx = ctx

	// Run immediately when DOM is ready
	p := utils.PidPath("jetclock-updater")
	pid, err := utils.ReadPID(p)
	if err == nil {
		// FIX: Use %d for integer formatting, not string(pid)
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

// GetBrightness returns the current screen brightness (0 or 1)
func (a *App) GetBrightness() (int, error) {
	return utils.CheckDisplay()
}

// SetBrightness sets the screen brightness (0 or 1)
func (a *App) SetBrightness(brightness int) error {
	if brightness != 0 && brightness != 1 {
		return fmt.Errorf("brightness must be 0 or 1")
	}

	if brightness == 0 {
		utils.TurnOffDisplay()
	} else {
		utils.TurnOnDisplay()
	}

	logger.Log.Infof("Set brightness to %d", brightness)
	return nil
}

// Reboot reboots the system
func (a *App) Reboot() error {
	logger.Log.Infof("Rebooting system...")
	utils.Reboot()
	return nil
}

