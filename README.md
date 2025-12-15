# JetClock

## About

JetClock is a smart clock that announces planes and helicopters flying overhead in real-time. 

**This application will only run if you have purchased a JetClock device from [jetclock.io](https://jetclock.io).**

If you're interested in building your own jet detection screen, check out the open-source alternative: [jetscreen-v2](https://github.com/jetclock/jetscreen-v2)

## Requirements

- A purchased JetClock device from [jetclock.io](https://jetclock.io)
- The device must be properly configured and connected


## Updating.

When JetClock is updated a build will be made using the build.yml workflow found in .github/workflows. This builds the application and the artefact. This will run automatically.

The version of the SDK that the app uses is set in go.mod e.g `github.com/jetclock/jetclock-sdk v0.5.4`. If you change the SDK you should update this line to use the latest version to get the latest SDK features. You can of course use `@latest` but this will not pin the JetClock app to a version of the SDK. See the Updater and SDK READMEs for further details.

## Releasing.

Releasing is a manual step of which you can do so from here `https://github.com/jetclock/jetclock/actions/workflows/release.yml`. You will need permission to manually release. If you create a release from a branch, then this will create a pre-release You can see all releases [here](https://github.com/jetclock/jetclock/releases).

Pre releases will not by default be updated on the devices. If you release from a tag then it will create a release and any device that restarts, the Updater will detect the new version and update it automatically.


Although the code runs in the Updater, the Release vs PreRelease is explained here as it is this application that would be updated.

```go
		if !appConfig.DisableUpdate { 
			go updateProcess(version, appConfig.PreRelease)
		}
```

Here there are two configs that are relevant. 

1. `DisableUpdate` - this will disable all updates.
2. `appConfig.PreRelease` - this defines whether to update to pre - releases.


Config is not adjustable by production devices it requires SSH-ing in to the device itself

The updater will look in 

for a yaml file called `/home/jetclock/.config/jetclock/config.yaml`


containing something like

```yaml
pre_release: true
disable_update: false
```

Note all config defaults to false.
