package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	rt "runtime"
	"strconv"
	"strings"
	"syscall"
	"time"

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
		a.SystemID = "000000005d34b088"
	}
	return &a
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) domReady(ctx context.Context) {
	a.ctx = ctx
	debugBridge(ctx)

	// Also log to a file for debugging
	logFile, err := os.OpenFile("/tmp/jetclock.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err == nil {
		defer logFile.Close()
		fmt.Fprintf(logFile, "[%s] JetClock app starting, PID: %d\n", time.Now().Format("2006-01-02 15:04:05"), os.Getpid())
	}

	// Run immediately when DOM is ready
	data, err := os.ReadFile("/tmp/jetclock-updater.pid")
	if err == nil {
		logger.Log.Infof("signalling to: %s app is ready", string(data))
		if logFile != nil {
			fmt.Fprintf(logFile, "[%s] Signalling to PID: %s\n", time.Now().Format("2006-01-02 15:04:05"), string(data))
		}
		if pid, err := strconv.Atoi(strings.TrimSpace(string(data))); err == nil {
			_ = syscall.Kill(pid, syscall.SIGUSR1) // notify updater
		} else {
			logger.Log.Infof("signall sent to: %s", string(data))
		}
	} else {
		if logFile != nil {
			fmt.Fprintf(logFile, "[%s] No updater PID file found: %v\n", time.Now().Format("2006-01-02 15:04:05"), err)
		}
	}
	time.Sleep(4 * time.Second)
	if logFile != nil {
		fmt.Fprintf(logFile, "[%s] DOM ready complete, splash screen should close\n", time.Now().Format("2006-01-02 15:04:05"))
	}
}

func (a *App) GetSystemID() string {
	return a.SystemID
}

func (a *App) GetVersion() string {
	return version
}

// GetBrightness returns the current screen brightness (0 or 1)
func (a *App) GetBrightness() (int, error) {
	data, err := os.ReadFile("/sys/class/backlight/backlight/brightness")
	if err != nil {
		return 0, fmt.Errorf("failed to read brightness: %v", err)
	}

	brightness, err := strconv.Atoi(strings.TrimSpace(string(data)))
	if err != nil {
		return 0, fmt.Errorf("failed to parse brightness: %v", err)
	}

	// Validate that brightness is 0 or 1
	if brightness != 0 && brightness != 1 {
		return 0, fmt.Errorf("invalid brightness value: %d (expected 0 or 1)", brightness)
	}

	return brightness, nil
}

// SetBrightness sets the screen brightness (0 or 1)
func (a *App) SetBrightness(brightness int) error {
	if brightness != 0 && brightness != 1 {
		return fmt.Errorf("brightness must be 0 or 1")
	}

	cmd := exec.Command("sudo", "sh", "-c", fmt.Sprintf("echo %d > /sys/class/backlight/backlight/brightness", brightness))
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to set brightness: %v, output: %s", err, string(output))
	}

	logger.Log.Infof("Set brightness to %d", brightness)
	return nil
}

// WailsEmitter implements pluginmanager.EventEmitter via Wails
type WailsEmitter struct {
	ctx context.Context
}

func (we *WailsEmitter) Emit(event string, data interface{}) {
	fmt.Println("emit:", event, data)
	whoCalledMe()
	runtime.EventsEmit(we.ctx, event, data)
}

// WailsListener implements pluginmanager.EventListener via Wails
type WailsListener struct {
	ctx context.Context
}

func (wl *WailsListener) On(event string, callback func(args ...interface{})) {
	runtime.EventsOn(wl.ctx, event, func(args ...interface{}) {
		callback(args...)
	})
}

func whoCalledMe() {
	pc, file, line, ok := rt.Caller(2)
	if !ok {
		fmt.Println("Could not retrieve caller information")
		return
	}

	// Use runtime.FuncForPC to get a *Func, then .Name() to retrieve the function's name.
	fn := rt.FuncForPC(pc)
	funcName := "unknown"
	if fn != nil {
		funcName = fn.Name()
		// If you want just the base of the function name (no full package path):
		funcName = filepath.Ext(funcName)
		if len(funcName) > 0 {
			funcName = funcName[1:] // strip leading dot
		}
	}

	fmt.Printf("Called by %s (at %s:%d)\n", funcName, file, line)
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
