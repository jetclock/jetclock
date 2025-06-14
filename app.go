package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/jetclock/jetclock-sdk/pkg/logger"
	"github.com/jetclock/jetclock-sdk/pkg/pluginmanager"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"log"
	"os"
	"path/filepath"
	"reflect"
	rt "runtime"
)

// App struct
type App struct {
	ctx  context.Context
	home string
}

// NewApp creates a new App application struct
func NewApp() *App {
	dir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("no home directory", err)
	}
	return &App{
		home: dir,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) domReady(ctx context.Context) {
	a.ctx = ctx
	debugBridge(ctx)
	// Create PluginManager
	pm := pluginmanager.NewPluginManager()

	// Create Wails emitter and listener
	emitter := &WailsEmitter{ctx: ctx}
	listener := &WailsListener{ctx: ctx, pm: pm}

	// Configure PluginManager to use Wails events
	pm.SetEventSystem(emitter, listener)

	// Forward any incoming "plugin:message" events into HandlePluginMessage
	listener.On(pluginmanager.PluginMessage, func(args ...interface{}) {
		fmt.Print("args ", len(args), reflect.TypeOf(args))
		fmt.Println(args...)
		if len(args) == 0 {
			return
		}
		var msgMap map[string]interface{}
		// Case 1: argument is already a map
		if m, ok := args[0].(map[string]interface{}); ok {
			msgMap = m
		} else if arr, ok := args[0].([]interface{}); ok && len(arr) > 0 {
			// Case 2: argument is a slice; take first element if it's a map
			if m2, ok2 := arr[0].(map[string]interface{}); ok2 {
				msgMap = m2
			} else {
				fmt.Println("case2: arg isn't a map")
				return
			}
		} else if s, ok := args[0].(string); ok {
			// Argument is a JSON string: unmarshal into map
			if err := json.Unmarshal([]byte(s), &msgMap); err != nil {
				runtime.LogErrorf(ctx, "plugin:message unmarshal error: %v", err)
				return
			}
		} else {
			fmt.Println("case1: arg isn't a map")
			return
		}
		fmt.Println("raw -- ", msgMap)

		pm.HandlePluginMessage(msgMap)
	})

	// Load plugins from './plugins'
	pm.Startup(ctx, filepath.Join(a.home, ".jetclock", "apps"))
}

// WailsEmitter implements pluginmanager.EventEmitter via Wails
type WailsEmitter struct {
	ctx context.Context
}

func (we *WailsEmitter) Emit(event string, data interface{}) {
	//raw, err := json.Marshal(data)
	//if err != nil {
	//	runtime.LogErrorf(we.ctx, "WailsEmitter: marshal error for %s: %v", event, err)
	//	return
	//}
	fmt.Println("emit:", event, data)
	whoCalledMe()
	runtime.EventsEmit(we.ctx, event, data)
}

// WailsListener implements pluginmanager.EventListener via Wails
type WailsListener struct {
	ctx context.Context
	pm  *pluginmanager.PluginManager
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

	// Use runtime.FuncForPC to get a *Func, then .Name() to retrieve the function’s name.
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
