package main

import (
	"embed"
	"fmt"
	"io"
	"mime"
	"net/http"
	"path"
	"path/filepath"
	"strings"
)

//go:embed all:assets/public
var public embed.FS

type AssetLoader struct {
	http.Handler
}

func NewAssetLoader() *AssetLoader {
	return &AssetLoader{}
}

func (h *AssetLoader) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	requestedFilename := strings.TrimPrefix(r.URL.Path, "/")
	cleanPath := path.Clean(requestedFilename)

	println("Requesting file:", cleanPath)

	data, err := public.ReadFile(cleanPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Could not load file: %s", cleanPath), http.StatusNotFound)
		return
	}

	// Set the appropriate Content-Type header
	ext := filepath.Ext(cleanPath)
	mimeType := mime.TypeByExtension(ext)
	if mimeType != "" {
		w.Header().Set("Content-Type", mimeType)
	} else {
		w.Header().Set("Content-Type", "application/octet-stream")
	}

	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, strings.NewReader(string(data)))
}
