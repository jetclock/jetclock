package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/jetclock/JetClock-UI/pkg/pluginmanager"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"reflect"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) domReady(ctx context.Context) {
	a.ctx = ctx

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
	pm.Startup(ctx, "/Users/alexwalker/go/src/github.com/jetclock/JetClock-UI/plugins")
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
	runtime.EventsEmit(we.ctx, "jetclock:plugin.loaded", data)
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
