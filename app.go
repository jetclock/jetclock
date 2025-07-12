package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"syscall"

	"github.com/jetclock/jetclock-sdk/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/runtime"
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
	piSerial, err := getPiSerial()
	if err == nil {
		a.SystemID = piSerial
	} else {
		a.SystemID = "123"
	}
	return &a
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) domReady(ctx context.Context) {
	a.ctx = ctx
	debugBridge(ctx)
	data, err := os.ReadFile("/tmp/jetclock-updater.pid")
	if err == nil {
		logger.Log.Infof("signalling to: %s app is ready", string(data))
		if pid, err := strconv.Atoi(strings.TrimSpace(string(data))); err == nil {
			_ = syscall.Kill(pid, syscall.SIGUSR1) // notify updater
		} else {
			logger.Log.Error("failed to convert pid", "err", err)
		}
	} else {
		logger.Log.Error("failed to read /tmp/jetclock-updater.pid", "err", err)
	}
}

func (a *App) GetSystemID() string {
	return a.SystemID
}

func (a *App) GetVersion() string {
	return version
}

// GetBrightness returns the current screen brightness (0-255)
func (a *App) GetBrightness() (int, error) {
	// Try common backlight paths
	paths := []string{
		"/sys/class/backlight/backlight/brightness",
		"/sys/class/backlight/rpi_backlight/brightness",
		"/sys/class/backlight/panel0-backlight/brightness",
	}

	var lastErr error
	for _, path := range paths {
		data, err := os.ReadFile(path)
		if err == nil {
			brightness, err := strconv.Atoi(strings.TrimSpace(string(data)))
			if err != nil {
				return 0, fmt.Errorf("failed to parse brightness from %s: %v", path, err)
			}
			return brightness, nil
		}
		lastErr = err
	}

	// Return a more user-friendly error message
	return 0, fmt.Errorf("brightness control not available on this system: %v", lastErr)
}

// SetBrightness sets the screen brightness (0-255)
func (a *App) SetBrightness(brightness int) error {
	if brightness < 0 || brightness > 255 {
		return fmt.Errorf("brightness must be between 0 and 255")
	}

	cmd := exec.Command("sudo", "sh", "-c", fmt.Sprintf("echo %d > /sys/class/backlight/backlight/brightness", brightness))
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to set brightness: %v, output: %s", err, string(output))
	}

	logger.Log.Infof("Set brightness to %d", brightness)
	return nil
}

func debugBridge(ctx context.Context) {
	// Listen for all frontend logs
	runtime.EventsOn(ctx, "jetclock:frontend.log", func(args ...interface{}) {
		if len(args) < 1 {
			return
		}
		m, ok := args[0].(map[string]interface{})
		if !ok {
			return
		}
		level, _ := m["level"].(string)
		msg, _ := m["msg"].(string)

		// Now decide: print to stdout, or write to your logfile
		switch level {
		case "info":
			logger.Log.Info("frontend", "msg", msg)
		case "warn":
			logger.Log.Warn("frontend", "msg", msg)
		case "error":
			logger.Log.Error("frontend", "msg", msg)
		default:
			logger.Log.Info("frontend", "msg", msg)
		}
	})
}

func getPiSerial() (string, error) {
	data, err := os.ReadFile("/proc/cpuinfo")
	if err != nil {
		return "", err
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "Serial") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				return strings.TrimSpace(parts[1]), nil
			}
		}
	}

	return "", fmt.Errorf("serial not found")
}
